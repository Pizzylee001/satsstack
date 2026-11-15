// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface ISMusd {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function musdToken() external view returns (address);
}

interface ITigrisRouter {
    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }

    function defaultFactory() external view returns (address);
    function getAmountsOut(uint256 amountIn, Route[] calldata routes) external view returns (uint256[] memory amounts);
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IPriceFeed {
    function fetchPrice() external returns (uint256);
}

interface ITroveManager {
    function getCurrentICR(address borrower, uint256 price) external view returns (uint256);
    function priceFeed() external view returns (address);
    function getEntireDebtAndColl(address borrower) external view returns (
        uint256 debt,
        uint256 coll,
        uint256 pendingLUSDTokenReward,
        uint256 pendingETHReward
    );
}

interface IBorrowerOperations {
    function addColl(address upperHint, address lowerHint) external payable;
}

contract SatsStackVault {
    enum PlanStatus {
        ACTIVE,
        PAUSED,
        COMPLETED,
        CANCELLED
    }

    struct DcaPlan {
        uint256 id;
        address owner;
        uint256 totalBudgetMusd;
        uint256 trancheSizeMusd;
        uint256 intervalSeconds;
        uint256 nextExecutionTime;
        uint256 remainingBudgetMusd;
        uint256 accumulatedBtc;
        uint256 minIcrFloor; // 18 decimals, e.g. 1.5e18 for 150%
        uint256 totalTranches;
        uint256 executedTranches;
        PlanStatus status;
        uint256 createdAt;
    }

    IERC20 public immutable musd;
    ISMusd public immutable smusd;
    ITigrisRouter public immutable router;
    address public immutable btcToken; // 0x7b7C000000000000000000000000000000000000
    ITroveManager public immutable troveManager;
    address public borrowerOperations;
    address public owner;

    uint256 public nextPlanId;
    mapping(uint256 => DcaPlan) public plans;
    mapping(address => uint256[]) private userPlanIds;

    uint256 public totalYieldEarnedMusd;

    event PlanCreated(
        uint256 indexed planId,
        address indexed owner,
        uint256 totalBudgetMusd,
        uint256 trancheSizeMusd,
        uint256 intervalSeconds,
        uint256 minIcrFloor
    );
    event TrancheExecuted(
        uint256 indexed planId,
        uint256 trancheIndex,
        uint256 musdSpent,
        uint256 btcReceived,
        uint256 nextExecutionTime
    );
    event PlanTopUp(uint256 indexed planId, uint256 additionalMusd, uint256 newRemainingBudget);
    event PlanPaused(uint256 indexed planId);
    event PlanResumed(uint256 indexed planId);
    event PlanCancelled(uint256 indexed planId, uint256 refundedMusd, uint256 claimedBtc);
    event BtcClaimed(uint256 indexed planId, address indexed recipient, uint256 amountBtc);
    event BtcRoutedToTrove(uint256 indexed planId, address indexed troveOwner, uint256 amountBtc);
    event TroveCircuitTripped(uint256 indexed planId, uint256 currentIcr, uint256 minIcrFloor);
    event BorrowerOperationsUpdated(address newBorrowerOperations);

    error NotOwner();
    error NotPlanOwner();
    error PlanNotActive();
    error PlanNotPaused();
    error TrancheNotDue(uint256 nextExecutionTime, uint256 currentTimestamp);
    error InvalidTrancheParameters();
    error TroveUnsafe(uint256 currentIcr, uint256 minIcrFloor);
    error InsufficientBalance();
    error ZeroAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPlanOwner(uint256 planId) {
        if (plans[planId].owner != msg.sender) revert NotPlanOwner();
        _;
    }

    constructor(
        address _musd,
        address _smusd,
        address _router,
        address _btcToken,
        address _troveManager,
        address _borrowerOperations
    ) {
        if (_musd == address(0) || _smusd == address(0) || _router == address(0) || _troveManager == address(0)) {
            revert ZeroAddress();
        }
        owner = msg.sender;
        musd = IERC20(_musd);
        smusd = ISMusd(_smusd);
        router = ITigrisRouter(_router);
        btcToken = _btcToken;
        troveManager = ITroveManager(_troveManager);
        borrowerOperations = _borrowerOperations;

        // Approvals for sMUSD and Tigris Router
        musd.approve(_smusd, type(uint256).max);
        musd.approve(_router, type(uint256).max);
    }

    function setBorrowerOperations(address _borrowerOperations) external onlyOwner {
        borrowerOperations = _borrowerOperations;
        emit BorrowerOperationsUpdated(_borrowerOperations);
    }

    function createPlan(
        uint256 totalBudgetMusd,
        uint256 trancheSizeMusd,
        uint256 intervalSeconds,
        uint256 minIcrFloor
    ) external returns (uint256 planId) {
        if (trancheSizeMusd == 0 || trancheSizeMusd > totalBudgetMusd || intervalSeconds == 0) {
            revert InvalidTrancheParameters();
        }

        // Transfer MUSD from caller
        bool success = musd.transferFrom(msg.sender, address(this), totalBudgetMusd);
        if (!success) revert TransferFailed();

        // Deposit into sMUSD to earn continuous savings yield
        smusd.deposit(totalBudgetMusd);

        planId = nextPlanId++;
        uint256 tranches = totalBudgetMusd / trancheSizeMusd;

        plans[planId] = DcaPlan({
            id: planId,
            owner: msg.sender,
            totalBudgetMusd: totalBudgetMusd,
            trancheSizeMusd: trancheSizeMusd,
            intervalSeconds: intervalSeconds,
            nextExecutionTime: block.timestamp,
            remainingBudgetMusd: totalBudgetMusd,
            accumulatedBtc: 0,
            minIcrFloor: minIcrFloor,
            totalTranches: tranches,
            executedTranches: 0,
            status: PlanStatus.ACTIVE,
            createdAt: block.timestamp
        });

        userPlanIds[msg.sender].push(planId);

        emit PlanCreated(
            planId,
            msg.sender,
            totalBudgetMusd,
            trancheSizeMusd,
            intervalSeconds,
            minIcrFloor
        );
    }

    function checkTroveIcr(address user) public returns (uint256 icr) {
        address pf = troveManager.priceFeed();
        uint256 price = 0;
        if (pf != address(0)) {
            try IPriceFeed(pf).fetchPrice() returns (uint256 fetchedPrice) {
                price = fetchedPrice;
            } catch {
                price = 0;
            }
        }
        if (price == 0) {
            // Default reference BTC price 65,000 USD (18 decimals) if oracle call falls back
            price = 65000 * 1e18;
        }

        try troveManager.getCurrentICR(user, price) returns (uint256 calculatedIcr) {
            return calculatedIcr;
        } catch {
            return type(uint256).max;
        }
    }

    function executeTranche(uint256 planId) external returns (uint256 btcBought) {
        DcaPlan storage plan = plans[planId];
        if (plan.status != PlanStatus.ACTIVE) revert PlanNotActive();
        if (block.timestamp < plan.nextExecutionTime) {
            revert TrancheNotDue(plan.nextExecutionTime, block.timestamp);
        }

        // Safety Circuit check on user's Trove ICR
        if (plan.minIcrFloor > 0) {
            uint256 currentIcr = checkTroveIcr(plan.owner);
            if (currentIcr < plan.minIcrFloor) {
                plan.status = PlanStatus.PAUSED;
                emit TroveCircuitTripped(planId, currentIcr, plan.minIcrFloor);
                revert TroveUnsafe(currentIcr, plan.minIcrFloor);
            }
        }

        uint256 trancheAmount = plan.trancheSizeMusd;
        if (plan.remainingBudgetMusd < trancheAmount) {
            trancheAmount = plan.remainingBudgetMusd;
        }

        // Pull tranche MUSD from sMUSD
        smusd.withdraw(trancheAmount);

        // Prepare swap on Tigris Router
        address defaultFactory = router.defaultFactory();
        ITigrisRouter.Route[] memory routes = new ITigrisRouter.Route[](1);
        routes[0] = ITigrisRouter.Route({
            from: address(musd),
            to: btcToken,
            stable: false,
            factory: defaultFactory
        });

        uint256 btcBefore = IERC20(btcToken).balanceOf(address(this));
        uint256 nativeBefore = address(this).balance;

        // Execute swap: MUSD -> BTC
        router.swapExactTokensForTokens(
            trancheAmount,
            1, // slippage protection minimum
            routes,
            address(this),
            block.timestamp + 300
        );

        uint256 btcAfter = IERC20(btcToken).balanceOf(address(this));
        uint256 nativeAfter = address(this).balance;

        // Calculate btcBought (either via ERC20 balance change or native balance change)
        if (btcAfter > btcBefore) {
            btcBought = btcAfter - btcBefore;
        } else if (nativeAfter > nativeBefore) {
            btcBought = nativeAfter - nativeBefore;
        }

        plan.accumulatedBtc += btcBought;
        plan.remainingBudgetMusd -= trancheAmount;
        plan.executedTranches += 1;
        plan.nextExecutionTime = block.timestamp + plan.intervalSeconds;

        if (plan.remainingBudgetMusd == 0) {
            plan.status = PlanStatus.COMPLETED;
        }

        emit TrancheExecuted(
            planId,
            plan.executedTranches,
            trancheAmount,
            btcBought,
            plan.nextExecutionTime
        );
    }

    function topUp(uint256 planId, uint256 amount) external onlyPlanOwner(planId) {
        DcaPlan storage plan = plans[planId];
        if (plan.status != PlanStatus.ACTIVE && plan.status != PlanStatus.PAUSED) {
            revert PlanNotActive();
        }

        bool success = musd.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        smusd.deposit(amount);
        plan.remainingBudgetMusd += amount;
        plan.totalBudgetMusd += amount;
        plan.totalTranches = plan.totalBudgetMusd / plan.trancheSizeMusd;

        emit PlanTopUp(planId, amount, plan.remainingBudgetMusd);
    }

    function pause(uint256 planId) external onlyPlanOwner(planId) {
        DcaPlan storage plan = plans[planId];
        if (plan.status != PlanStatus.ACTIVE) revert PlanNotActive();
        plan.status = PlanStatus.PAUSED;
        emit PlanPaused(planId);
    }

    function resume(uint256 planId) external onlyPlanOwner(planId) {
        DcaPlan storage plan = plans[planId];
        if (plan.status != PlanStatus.PAUSED) revert PlanNotPaused();
        plan.status = PlanStatus.ACTIVE;
        emit PlanResumed(planId);
    }

    function cancelAndWithdraw(uint256 planId) external onlyPlanOwner(planId) {
        DcaPlan storage plan = plans[planId];
        if (plan.status == PlanStatus.CANCELLED || plan.status == PlanStatus.COMPLETED) {
            revert PlanNotActive();
        }

        plan.status = PlanStatus.CANCELLED;
        uint256 unspentMusd = plan.remainingBudgetMusd;
        uint256 accumulatedBtcAmount = plan.accumulatedBtc;

        plan.remainingBudgetMusd = 0;
        plan.accumulatedBtc = 0;

        // Withdraw unspent MUSD from sMUSD and return to owner
        if (unspentMusd > 0) {
            smusd.withdraw(unspentMusd);
            bool success = musd.transfer(msg.sender, unspentMusd);
            if (!success) revert TransferFailed();
        }

        // Return accumulated BTC if any
        if (accumulatedBtcAmount > 0) {
            _transferBtc(msg.sender, accumulatedBtcAmount);
        }

        emit PlanCancelled(planId, unspentMusd, accumulatedBtcAmount);
    }

    function claimBtc(uint256 planId, address to) external onlyPlanOwner(planId) {
        if (to == address(0)) revert ZeroAddress();
        DcaPlan storage plan = plans[planId];
        uint256 amount = plan.accumulatedBtc;
        if (amount == 0) revert InsufficientBalance();

        plan.accumulatedBtc = 0;
        _transferBtc(to, amount);

        emit BtcClaimed(planId, to, amount);
    }

    function routeBtcToTrove(
        uint256 planId,
        address upperHint,
        address lowerHint
    ) external onlyPlanOwner(planId) {
        DcaPlan storage plan = plans[planId];
        uint256 amount = plan.accumulatedBtc;
        if (amount == 0) revert InsufficientBalance();

        plan.accumulatedBtc = 0;

        if (borrowerOperations != address(0)) {
            // Execute addColl{value: amount}(upperHint, lowerHint)
            IBorrowerOperations(borrowerOperations).addColl{value: amount}(upperHint, lowerHint);
        } else {
            // If BorrowerOperations not configured on testnet, transfer native BTC to owner
            _transferBtc(plan.owner, amount);
        }

        emit BtcRoutedToTrove(planId, plan.owner, amount);
    }

    function _transferBtc(address to, uint256 amount) internal {
        uint256 nativeBal = address(this).balance;
        if (nativeBal >= amount) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) {
                // Fallback to ERC20 transfer if native call fails
                IERC20(btcToken).transfer(to, amount);
            }
        } else {
            IERC20(btcToken).transfer(to, amount);
        }
    }

    function getUserPlans(address user) external view returns (uint256[] memory) {
        return userPlanIds[user];
    }

    function getPlan(uint256 planId) external view returns (DcaPlan memory) {
        return plans[planId];
    }

    receive() external payable {}
}

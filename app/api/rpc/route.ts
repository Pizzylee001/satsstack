import { NextRequest, NextResponse } from 'next/server';
import { MEZO_TESTNET_RPC_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const ALLOWED_RPC_METHODS = new Set([
  'eth_blockNumber',
  'eth_chainId',
  'eth_call',
  'eth_getLogs',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getBalance',
  'eth_estimateGas',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_feeHistory',
  'eth_getCode',
  'net_version',
]);

function isValidRpcCall(item: unknown): item is { method: string } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'method' in item &&
    typeof (item as { method: unknown }).method === 'string' &&
    ALLOWED_RPC_METHODS.has((item as { method: string }).method)
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON-RPC request body' },
      { status: 400 }
    );
  }

  const valid = Array.isArray(payload)
    ? payload.length > 0 && payload.every(isValidRpcCall)
    : isValidRpcCall(payload);

  if (!valid) {
    return NextResponse.json(
      { error: 'Unsupported or malformed JSON-RPC method' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(MEZO_TESTNET_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Upstream Mezo RPC request failed';
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message,
        },
      },
      { status: 502 }
    );
  }
}

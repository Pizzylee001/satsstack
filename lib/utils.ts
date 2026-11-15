export function formatCurrency(amount: number, digits: number = 2): string {
  if (!Number.isFinite(amount)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatBtc(amount: number, digits: number = 6): string {
  if (!Number.isFinite(amount)) return '0.000000';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatSats(btcAmount: number): string {
  if (!Number.isFinite(btcAmount)) return '0';
  const sats = Math.round(btcAmount * 1e8);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(sats);
}

export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address || address.length < start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Due Now';
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

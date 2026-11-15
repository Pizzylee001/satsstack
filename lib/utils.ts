export function formatCurrency(amount: number, digits: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatBtc(amount: number, digits: number = 6): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address || address.length < start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Due Now';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

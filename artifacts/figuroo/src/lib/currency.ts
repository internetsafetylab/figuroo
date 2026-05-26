// Format price in Romanian Lei (RON)
export function formatRON(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0 Lei";
  return `${value.toFixed(2)} Lei`;
}

// Format currency for analytics and charts
export function formatCurrencyValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return `${value.toFixed(2)} Lei`;
}

// Parse RON string to number
export function parseRON(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
}

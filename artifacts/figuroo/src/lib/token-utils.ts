// Generate a random token
export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Token storage keys
export const ADMIN_TOKENS_KEY = "figuroo_admin_tokens";

// Get stored admin tokens
export function getStoredAdminTokens(): string[] {
  try {
    const stored = localStorage.getItem(ADMIN_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save admin tokens
export function saveAdminTokens(tokens: string[]): void {
  localStorage.setItem(ADMIN_TOKENS_KEY, JSON.stringify(tokens));
}

// Add a new admin token
export function addAdminToken(): string {
  const newToken = generateToken();
  const tokens = getStoredAdminTokens();
  tokens.push(newToken);
  saveAdminTokens(tokens);
  return newToken;
}

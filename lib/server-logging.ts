export function logServerError(context: string, error: unknown) {
  console.error(`[server-error] ${context}`, error);
}

export function getMissingServerEnv() {
  return ["DATABASE_URL", "AUTH_SECRET"].filter((key) => !process.env[key]);
}

export function logMissingServerEnv(context: string) {
  const missing = getMissingServerEnv();

  if (missing.length > 0) {
    console.error(`[env-check] ${context}: missing ${missing.join(", ")}`);
  }
}

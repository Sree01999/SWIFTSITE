function getBoolEnv(name: string) {
  const value = process.env[name];
  if (!value) return false;
  return value.trim().toLowerCase() === "true";
}

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function isDevFeatureEnabled() {
  if (!isProductionEnv()) return true;
  return getBoolEnv("ALLOW_DEV_ENDPOINTS");
}

export function getSecurityEnvSummary() {
  return {
    production: isProductionEnv(),
    allowDevEndpoints: isDevFeatureEnabled(),
  };
}

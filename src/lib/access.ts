export function isChamadoActive(userProfile: any): boolean {
  if (!userProfile?.chamado_active || !userProfile?.chamado_expires_at) return false;
  const expiresAt = new Date(userProfile.chamado_expires_at);
  return !isNaN(expiresAt.getTime()) && expiresAt > new Date();
}

export function hasChamadoFeature(userProfile: any, featureKey: string): boolean {
  if (!userProfile || !featureKey) return false;
  if (hasPlusAccess(userProfile)) return true;
  return isChamadoActive(userProfile) && Array.isArray(userProfile.chamado_features) && userProfile.chamado_features.includes(featureKey);
}

export function hasPlusAccess(userProfile: any): boolean {
  if (!userProfile) return false;

  if (userProfile.has_access === true) {
    const expiresAt = userProfile.access_expires_at ? new Date(userProfile.access_expires_at) : null;
    if (!expiresAt || expiresAt > new Date()) return true;
  }

  return userProfile.subscription_tier === "PLUS";
}

export function hasActiveAccess(userProfile: any): boolean {
  if (!userProfile) return false;

  const now = new Date();

  if (userProfile.has_access === true) {
    const expiresAt = userProfile.access_expires_at
      ? new Date(userProfile.access_expires_at)
      : null;
    if (!expiresAt || expiresAt > now) {
      return true;
    }
  }

  if (isChamadoActive(userProfile)) {
    return true;
  }

  return userProfile.subscription_tier === "PLUS";
}

export function formatAccessExpiry(userProfile: any): string | null {
  if (!userProfile?.access_expires_at) return null;
  return new Date(userProfile.access_expires_at).toLocaleDateString("pt-BR");
}

export function getDaysUntilExpiry(userProfile: any): number | null {
  if (!userProfile?.access_expires_at) return null;
  const expiresAt = new Date(userProfile.access_expires_at);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

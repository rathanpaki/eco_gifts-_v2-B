export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export function roleFromClaims(claims: Record<string, unknown>): Role | null {
  const legacyRoles: unknown[] = Array.isArray(claims.roles)
    ? (claims.roles as unknown[])
    : [];
  const values = [claims.role, ...legacyRoles];
  if (values.some((value) => value === 'ADMIN' || value === 'SUPER_ADMIN')) {
    return Role.ADMIN;
  }
  if (
    values.some(
      (value) => value === 'USER' || value === 'CUSTOMER' || value === 'STAFF',
    )
  ) {
    return Role.USER;
  }
  return null;
}

export function normalizedClaims(
  claims: Record<string, unknown>,
  role: Role,
): Record<string, unknown> {
  const preserved = { ...claims };
  delete preserved.role;
  delete preserved.roles;
  return { ...preserved, role };
}

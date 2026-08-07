import { normalizedClaims, Role, roleFromClaims } from './role.enum';

describe('role claims', () => {
  it('maps current and legacy claims to USER or ADMIN', () => {
    expect(roleFromClaims({ role: Role.ADMIN })).toBe(Role.ADMIN);
    expect(roleFromClaims({ roles: ['SUPER_ADMIN'] })).toBe(Role.ADMIN);
    expect(roleFromClaims({ roles: ['CUSTOMER', 'STAFF'] })).toBe(Role.USER);
  });

  it('returns null for unknown and empty claims', () => {
    expect(roleFromClaims({ roles: ['OWNER'] })).toBeNull();
    expect(roleFromClaims({})).toBeNull();
  });

  it('removes legacy fields while preserving unrelated claims', () => {
    expect(
      normalizedClaims({ roles: ['SUPER_ADMIN'], flag: true }, Role.ADMIN),
    ).toEqual({ flag: true, role: Role.ADMIN });
  });
});

import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Role } from './role.enum';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: Role;
  token: DecodedIdToken;
}

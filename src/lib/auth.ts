import crypto from "crypto";
import { cookies } from "next/headers";
import {
  ensureDbSynced,
  writeDbAsync,
  User,
  UserRole,
  DashboardPermission,
  getDefaultPermissionsForRole,
} from "./db";

function getSessionSecret(): string {
  const configured =
    process.env.D2J_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.D2J_ADMIN_PASSWORD;
  if (configured && configured.trim().length >= 12) {
    return crypto.createHash("sha256").update(`d2j-hmac:${configured.trim()}`).digest("hex");
  }
  return "d2j_media_hub_internal_hmac_secret_2026_key";
}

export const SESSION_COOKIE_NAME = "d2j_editorial_session";
export const STAFF_REGISTRY_COOKIE = "d2j_staff_registry";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  isSuperAdmin?: boolean;
  permissions?: DashboardPermission[];
  allowedCategories?: string[];
  exp: number;
}

export function createSessionToken(user: User): string {
  const isSuper = Boolean(user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.id === "usr-admin");
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    isSuperAdmin: isSuper,
    permissions:
      Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : getDefaultPermissionsForRole(user.role),
    allowedCategories:
      Array.isArray(user.allowedCategories) && user.allowedCategories.length > 0
        ? user.allowedCategories
        : ["ALL"],
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSignedUsersToken(users: User[]): string {
  const data = Buffer.from(JSON.stringify(users)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySignedUsersToken(token?: string): User[] | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return Array.isArray(parsed) ? (parsed as User[]) : null;
  } catch {
    return null;
  }
}

export function createStaffInviteToken(user: User): string {
  const data = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyStaffInviteToken(token?: string): User | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return parsed && typeof parsed.email === "string" ? (parsed as User) : null;
  } catch {
    return null;
  }
}

export function mergeVerifiedUsersIntoList(
  existingUsers: User[],
  registryCookie?: string,
  inviteToken?: string
): { users: User[]; changed: boolean } {
  const merged = [...existingUsers];
  let changed = false;

  const upsert = (incoming: User) => {
    if (!incoming || !incoming.email) return;
    const idx = merged.findIndex(
      (u) =>
        u.id === incoming.id ||
        u.email.toLowerCase().trim() === incoming.email.toLowerCase().trim()
    );
    if (idx >= 0) {
      const curr = merged[idx];
      if (
        curr.name !== incoming.name ||
        curr.email !== incoming.email ||
        curr.passwordHash !== incoming.passwordHash ||
        curr.role !== incoming.role ||
        curr.active !== incoming.active
      ) {
        merged[idx] = { ...curr, ...incoming };
        changed = true;
      }
    } else {
      merged.push(incoming);
      changed = true;
    }
  };

  const registryUsers = verifySignedUsersToken(registryCookie);
  if (registryUsers) {
    for (const u of registryUsers) upsert(u);
  }

  const invitedUser = verifyStaffInviteToken(inviteToken);
  if (invitedUser) {
    upsert(invitedUser);
  }

  return { users: merged, changed };
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;

  const db = await ensureDbSynced();
  const registryCookie = cookieStore.get(STAFF_REGISTRY_COOKIE)?.value;
  const { users, changed } = mergeVerifiedUsersIntoList(db.users, registryCookie);
  if (changed) {
    db.users = users;
    await writeDbAsync(db);
  }

  // Match by exact email first so admin@dpathtojannah.com and lawalsodiq915@gmail.com never collide
  const user =
    db.users.find((u) => u.email.toLowerCase().trim() === session.email.toLowerCase().trim()) ||
    db.users.find((u) => u.id === session.userId);

  if (user) {
    if (!user.active) return null;
    const isSuper = Boolean(user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.id === "usr-admin");
    return {
      ...session,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      isSuperAdmin: isSuper,
      permissions:
        Array.isArray(user.permissions) && user.permissions.length > 0
          ? user.permissions
          : getDefaultPermissionsForRole(user.role),
      allowedCategories:
        Array.isArray(user.allowedCategories) && user.allowedCategories.length > 0
          ? user.allowedCategories
          : ["ALL"],
    };
  }

  // If this serverless container has a cold cache that doesn't have the newly created user yet,
  // honour the cryptographically verified HMAC session token so newly created users are never kicked out.
  return {
    ...session,
    permissions:
      Array.isArray(session.permissions) && session.permissions.length > 0
        ? session.permissions
        : getDefaultPermissionsForRole(session.role),
    allowedCategories:
      Array.isArray(session.allowedCategories) && session.allowedCategories.length > 0
        ? session.allowedCategories
        : ["ALL"],
  };
}

export function hasPermission(session: SessionPayload, perm: DashboardPermission): boolean {
  if (session.isSuperAdmin || session.role === "SUPER_ADMIN") return true;
  if (Array.isArray(session.permissions)) {
    return session.permissions.includes(perm);
  }
  return getDefaultPermissionsForRole(session.role).includes(perm);
}

export function canPublishContent(role: UserRole, permissions?: DashboardPermission[]): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMINISTRATOR" || role === "EDITOR") return true;
  if (Array.isArray(permissions) && permissions.includes("publish_articles")) return true;
  return false;
}

export function canManageUsers(role: UserRole, permissions?: DashboardPermission[]): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMINISTRATOR") return true;
  if (Array.isArray(permissions) && permissions.includes("users")) return true;
  return false;
}

export function canReviewOtherAdmins(role: UserRole, permissions?: DashboardPermission[]): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMINISTRATOR") return true;
  if (Array.isArray(permissions) && permissions.includes("admin-reviews")) return true;
  return false;
}

export function canReviewScholarQuestions(role: UserRole, permissions?: DashboardPermission[]): boolean {
  if (
    role === "SUPER_ADMIN" ||
    role === "ADMINISTRATOR" ||
    role === "EDITOR" ||
    role === "SCHOLAR"
  ) {
    return true;
  }
  if (Array.isArray(permissions) && permissions.includes("ask-scholar")) return true;
  return false;
}

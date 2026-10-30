import crypto from "crypto";
import { cookies } from "next/headers";
import {
  readDb,
  User,
  UserRole,
  DashboardPermission,
  getDefaultPermissionsForRole,
} from "./db";

const SECRET = process.env.D2J_SESSION_SECRET || "d2j_media_hub_internal_hmac_secret_2026_key";
export const SESSION_COOKIE_NAME = "d2j_editorial_session";

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
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;
  // Confirm user still active in DB and sync latest role & permissions assigned by Super Admin
  const db = readDb();
  const user = db.users.find((u) => u.id === session.userId && u.active);
  if (!user) return null;
  const isSuper = Boolean(user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.id === "usr-admin");
  return {
    ...session,
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

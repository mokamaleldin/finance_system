export const userRoles = ["FULL_ADMIN", "OPERATOR", "VIEWER"] as const;

export type UserRole = (typeof userRoles)[number];

export type Permission =
  | "transactions:write"
  | "customers:create"
  | "customers:write"
  | "expenses:create"
  | "expenses:write"
  | "capital:read"
  | "capital:write"
  | "rates:write"
  | "users:manage";

export const roleLabels: Record<UserRole, string> = {
  FULL_ADMIN: "مدير كامل",
  OPERATOR: "نصف أدمن",
  VIEWER: "مشاهدة فقط",
};

const rolePermissions: Record<UserRole, Permission[]> = {
  FULL_ADMIN: [
    "transactions:write",
    "customers:create",
    "customers:write",
    "expenses:create",
    "expenses:write",
    "capital:read",
    "capital:write",
    "rates:write",
    "users:manage",
  ],
  OPERATOR: ["transactions:write", "customers:create", "expenses:create"],
  VIEWER: ["capital:read"],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

import {
  Banknote,
  BarChart3,
  ReceiptText,
  UserCog,
  Gauge,
  Repeat,
  UserRound,
  WalletCards,
} from "lucide-react";
import { hasPermission, type Permission, type UserRole } from "@/lib/permissions";

type NavigationLink = {
  href: string;
  label: string;
  icon: typeof Gauge;
  requiredPermission?: Permission;
};

export const navigationLinks: NavigationLink[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: Gauge },
  { href: "/dashboard/transactions/new", label: "معاملة جديدة", icon: Banknote, requiredPermission: "transactions:write" },
  { href: "/dashboard/transactions", label: "سجل المعاملات", icon: Repeat },
  { href: "/dashboard/open", label: "المتبقي علينا ولنا", icon: BarChart3 },
  { href: "/dashboard/capital", label: "رأس المال", icon: WalletCards, requiredPermission: "capital:read" },
  { href: "/dashboard/customers", label: "العملاء", icon: UserRound },
  { href: "/dashboard/expenses", label: "المصاريف", icon: ReceiptText },
  { href: "/dashboard/reports/daily", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/users", label: "المستخدمين", icon: UserCog, requiredPermission: "users:manage" },
];

export function getNavigationLinks(role: UserRole) {
  return navigationLinks.filter((link) => !link.requiredPermission || hasPermission(role, link.requiredPermission));
}

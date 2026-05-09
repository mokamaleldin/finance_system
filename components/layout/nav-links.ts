import {
  Banknote,
  BarChart3,
  ReceiptText,
  Gauge,
  Repeat,
  UserRound,
  WalletCards,
} from "lucide-react";

export const navigationLinks = [
  { href: "/dashboard", label: "لوحة التحكم", icon: Gauge },
  { href: "/dashboard/transactions/new", label: "معاملة جديدة", icon: Banknote },
  { href: "/dashboard/transactions", label: "سجل المعاملات", icon: Repeat },
  { href: "/dashboard/open", label: "المتبقي علينا ولنا", icon: BarChart3 },
  { href: "/dashboard/capital", label: "رأس المال", icon: WalletCards },
  { href: "/dashboard/customers", label: "العملاء", icon: UserRound },
  { href: "/dashboard/expenses", label: "المصاريف", icon: ReceiptText },
  { href: "/dashboard/reports/daily", label: "التقارير", icon: BarChart3 },
];

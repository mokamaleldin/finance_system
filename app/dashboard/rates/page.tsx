import { redirect } from "next/navigation";

export default function RatesPage() {
  redirect("/dashboard/transactions/new");
}

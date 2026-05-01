import { redirect } from "next/navigation";

export default function NewMovementPage() {
  redirect("/dashboard/transactions/new");
}

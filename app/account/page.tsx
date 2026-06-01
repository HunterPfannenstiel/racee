import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/server";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/signin");

  return <AccountForm />;
}

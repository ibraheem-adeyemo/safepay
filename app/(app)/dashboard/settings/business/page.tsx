import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import BusinessProfileForm from "./BusinessProfileForm";

export default async function BusinessSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") redirect("/dashboard/settings");

  const business = await db.business.findUnique({
    where: { userId: session.userId },
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
      <h2 className="text-base font-bold text-stone-900 mb-1">Business Profile</h2>
      <p className="text-stone-400 text-xs mb-5">
        This information is shown to counterparties and used for API integrations.
      </p>
      <BusinessProfileForm
        currentName={business?.name ?? ""}
        currentDescription={business?.description ?? ""}
        currentWebsite={business?.website ?? ""}
      />
    </div>
  );
}

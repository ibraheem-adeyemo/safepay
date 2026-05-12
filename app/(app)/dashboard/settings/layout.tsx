import Link from "next/link";
import { getSession } from "@/lib/session";

const NAV = [
  { href: "/dashboard/settings", label: "Profile" },
  { href: "/dashboard/settings/password", label: "Password" },
  { href: "/dashboard/settings/business", label: "Business", businessOnly: true },
  { href: "/dashboard/settings/api-keys", label: "API Keys", businessOnly: true },
  { href: "/dashboard/settings/webhooks", label: "Webhooks", businessOnly: true },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isBusiness = session?.accountType === "BUSINESS";

  const links = NAV.filter((n) => !n.businessOnly || isBusiness);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-48 shrink-0">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-white hover:text-stone-900 hover:border hover:border-stone-200 transition-all"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Page content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

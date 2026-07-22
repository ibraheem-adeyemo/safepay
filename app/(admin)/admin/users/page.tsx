import Link from "next/link";
import { db } from "@/lib/db";
import { AccountType, AccountStatus } from "@prisma/client";

const PER_PAGE = 50;

const TABS = [
  { key: "all",       label: "All" },
  { key: "active",    label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "shadow",    label: "Shadow" },
  { key: "business",  label: "Business" },
  { key: "admin",     label: "Admins" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function tabWhere(tab: Tab) {
  switch (tab) {
    case "active":    return { accountStatus: AccountStatus.ACTIVE };
    case "suspended": return { accountStatus: AccountStatus.SUSPENDED };
    case "shadow":    return { isClaimed: false };
    case "business":  return { accountType: AccountType.BUSINESS };
    case "admin":     return { accountType: { in: [AccountType.ADMIN, AccountType.SUPER_ADMIN] } };
    default:          return {};
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  const { q, tab: tabParam, page: pageParam } = await searchParams;
  const tab = (TABS.some((t) => t.key === tabParam) ? tabParam : "all") as Tab;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const searchFilter = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = { ...tabWhere(tab), ...searchFilter };

  // Separate queries so Prisma can correctly infer the `include` return type
  const total = await db.user.count({ where });
  const users = await db.user.findMany({
    where,
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tab !== "all") params.set("tab", tab);
    if (p > 1) params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  function tabUrl(t: Tab) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (t !== "all") params.set("tab", t);
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Users</h1>
          <p className="text-stone-500 text-sm mt-1">
            {total.toLocaleString()} user{total !== 1 ? "s" : ""}
            {q ? ` matching "${q}"` : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-4">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <input
          name="q"
          defaultValue={q}
          type="search"
          placeholder="Search by name or email…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </form>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-emerald-700 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-700 font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name + contact */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">
                      {user.name}
                    </p>
                    {!user.isClaimed && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        Shadow
                      </span>
                    )}
                    {!user.emailVerified && user.isClaimed && (
                      <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                    {(user.accountType === "ADMIN" || user.accountType === "SUPER_ADMIN") && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                        {user.accountType}
                      </span>
                    )}
                    {user.accountType === "BUSINESS" && (
                      <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">
                        Business
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {user.email ?? user.phone ?? "No contact"} · {user.channel}
                  </p>
                </div>

                {/* Txn count + join date */}
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-sm font-semibold text-stone-700">
                    {user._count.transactions} txn{user._count.transactions !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      user.accountStatus === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : user.accountStatus === "SUSPENDED"
                        ? "bg-red-100 text-red-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {user.accountStatus}
                  </span>
                  <span className="text-stone-300 group-hover:text-stone-400">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-stone-500">
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

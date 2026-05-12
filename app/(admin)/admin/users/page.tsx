import { db } from "@/lib/db";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Users</h1>
          <p className="text-stone-500 text-sm mt-1">{users.length} result{users.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          type="search"
          placeholder="Search by name or email…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </form>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-700 font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                    {!user.isClaimed && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        Shadow
                      </span>
                    )}
                    {(user.accountType === "ADMIN" || user.accountType === "SUPER_ADMIN") && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                        {user.accountType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {user.email ?? user.phone ?? "No contact"} · {user.channel}
                  </p>
                </div>

                <div className="shrink-0 text-right">
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

                <div className="shrink-0">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

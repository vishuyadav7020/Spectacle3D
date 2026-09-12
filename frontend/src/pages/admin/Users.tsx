import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listUsers, setUserActive } from "../../lib/adminUsers";
import type { AuthUser } from "../../lib/auth";

const ROLE_OPTIONS = ["all", "customer", "admin"] as const;
const STATUS_OPTIONS = ["all", "pending", "verified", "rejected"] as const;
const PAGE_SIZE = 10;

export function AdminUsers() {
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [count, setCount] = useState(0);
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await listUsers({
        role: role === "all" ? undefined : role,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setUsers(data.results);
      setCount(data.count);
    } catch {
      setError("Could not load users.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, statusFilter, search, page]);

  async function handleToggleActive(user: AuthUser) {
    try {
      await setUserActive(user.id, !user.is_active);
      await load();
    } catch {
      setError("Could not update user.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Users
      </h1>
      <p className="mt-2 font-body text-sm text-text-secondary">
        {count} registered user{count !== 1 ? "s" : ""}.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="flex gap-2"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email..."
            className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-accent-primary px-4 py-2 font-body text-sm font-semibold text-bg"
          >
            Search
          </button>
        </form>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as (typeof ROLE_OPTIONS)[number]);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm capitalize text-text-primary focus:border-accent-primary focus:outline-none"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All Roles" : r}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number]);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm capitalize text-text-primary focus:border-accent-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Status" : s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Name</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Email</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Role</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Status</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Orders</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Joined</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-body text-sm text-text-primary">{user.full_name}</td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-sm px-2 py-0.5 font-body text-xs capitalize ${
                      user.role === "admin"
                        ? "bg-accent-secondary/20 text-accent-secondary"
                        : "bg-surface-2 text-text-secondary"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 font-body text-xs capitalize ${
                      !user.is_active
                        ? "bg-accent-warm/20 text-accent-warm"
                        : user.status === "verified"
                          ? "bg-success/20 text-success"
                          : "bg-surface-2 text-text-secondary"
                    }`}
                  >
                    {!user.is_active ? "Deactivated" : user.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">{user.total_orders}</td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`font-body text-sm hover:underline ${
                      user.is_active ? "text-accent-warm" : "text-accent-primary"
                    }`}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users && users.length === 0 && (
          <p className="px-4 py-8 text-center font-body text-sm text-text-secondary">
            No users found.
          </p>
        )}

        {users && users.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="font-body text-sm text-text-secondary">
              Showing <span className="text-text-primary">{(page - 1) * PAGE_SIZE + 1}-{(page - 1) * PAGE_SIZE + users.length}</span> of{" "}
              <span className="text-text-primary">{count}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-body text-sm text-text-primary">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

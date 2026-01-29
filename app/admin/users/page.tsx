"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  verified: boolean;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [verifiedUpdatingId, setVerifiedUpdatingId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        setUsers(data);
      } catch {
        setError("Could not load users");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const changePassword = async (userId: string) => {
    const newPassword = passwords[userId];
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSavingId(userId);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: newPassword }),
      });

      if (!res.ok) throw new Error("Failed to update password");

      setPasswords((prev) => ({ ...prev, [userId]: "" }));
    } catch {
      setError("Unable to update password");
    } finally {
      setSavingId(null);
    }
  };

  const updateVerified = async (userId: string, verified: boolean) => {
    setVerifiedUpdatingId(userId);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verified }),
      });

      if (!res.ok) throw new Error("Failed to update verified status");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verified } : u)),
      );
    } catch {
      setError("Unable to update verified status");
    } finally {
      setVerifiedUpdatingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;

    setDeletingId(userId);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError("Unable to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          </div>
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No users found.
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm text-slate-900">
              <thead className="bg-slate-100 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">New Password</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                      {u.name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                      {u.role}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                      <select
                        value={u.verified ? "yes" : "no"}
                        onChange={(e) =>
                          updateVerified(u.id, e.target.value === "yes")
                        }
                        disabled={
                          verifiedUpdatingId === u.id || deletingId === u.id
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type={showPasswords[u.id] ? "text" : "password"}
                            value={passwords[u.id] || ""}
                            onChange={(e) =>
                              setPasswords((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            placeholder="Set new password"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 pr-24 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [u.id]: !prev[u.id],
                              }))
                            }
                            className="absolute inset-y-0 right-2 my-1 px-3 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#1f4b99]"
                            aria-label={
                              showPasswords[u.id]
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPasswords[u.id] ? "Hide" : "Show"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => changePassword(u.id)}
                          disabled={savingId === u.id}
                          className="rounded-lg bg-[#1f4b99] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-50"
                        >
                          {savingId === u.id ? "Saving..." : "Update"}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => deleteUser(u.id)}
                        disabled={deletingId === u.id}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 disabled:opacity-50"
                      >
                        {deletingId === u.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

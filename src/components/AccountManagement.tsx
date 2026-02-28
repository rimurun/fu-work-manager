"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, UserCog, CheckCircle } from "lucide-react";
import type { Store } from "@/lib/stores";

interface UserAccount {
  username: string;
  role: "admin" | "store";
  storeIds: string[];
}

interface AccountManagementProps {
  stores: Store[];
}

export default function AccountManagement({ stores }: AccountManagementProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const toggleStore = (username: string, storeId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username !== username) return u;
        const has = u.storeIds.includes(storeId);
        return {
          ...u,
          storeIds: has
            ? u.storeIds.filter((id) => id !== storeId)
            : [...u.storeIds, storeId],
        };
      }),
    );
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch {}
  };

  const saveUser = async (user: UserAccount) => {
    setSaving(user.username);
    setSaved(null);
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeIds: user.storeIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "保存に失敗しました");
      }
      await res.json();
      // Verify DB persistence by re-fetching from server
      await fetchUsers();
      setSaved(user.username);
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">アカウント管理</h1>
        <p className="text-gray-400 mt-1">
          各アカウントがアクセスできる店舗を設定
        </p>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.username} className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-accent-purple" />
                <div>
                  <span className="font-semibold text-lg">{user.username}</span>
                  <span
                    className={`ml-3 text-xs px-2 py-0.5 rounded ${
                      user.role === "admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {user.role === "admin" ? "管理者" : "店舗"}
                  </span>
                </div>
              </div>
              {user.role !== "admin" && (
                <div className="flex items-center gap-3">
                  {saved === user.username && (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      保存しました
                    </span>
                  )}
                  <button
                    onClick={() => saveUser(user)}
                    disabled={saving === user.username}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors disabled:opacity-50"
                  >
                    {saving === user.username ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    保存
                  </button>
                </div>
              )}
            </div>

            {user.role === "admin" ? (
              <p className="text-gray-500 text-sm">
                管理者は全店舗にアクセスできます
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stores.map((store) => {
                  const active = user.storeIds.includes(store.id);
                  return (
                    <button
                      key={store.id}
                      onClick={() => toggleStore(user.username, store.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-accent-purple text-white"
                          : "bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-100"
                      }`}
                    >
                      {store.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

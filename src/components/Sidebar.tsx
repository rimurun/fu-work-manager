"use client";

import {
  Upload,
  BarChart3,
  Users,
  Building2,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Settings,
  LogOut,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import type { Store } from "@/lib/stores";

type Page = "dashboard" | "upload" | "cast" | "trends" | "accounts";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
  stores: Store[];
  onAddStore: (id: string, name: string) => Promise<void>;
  onUpdateStore: (id: string, name: string) => Promise<void>;
  onDeleteStore: (id: string) => Promise<void>;
  userRole: "admin" | "store";
  userName: string;
  onLogout: () => void;
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  selectedStore,
  setSelectedStore,
  stores,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  userRole,
  userName,
  onLogout,
}: SidebarProps) {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  const isAdmin = userRole === "admin";

  const menuItems = [
    { id: "dashboard" as Page, label: "ダッシュボード", icon: BarChart3 },
    { id: "cast" as Page, label: "キャスト分析", icon: Users },
    { id: "upload" as Page, label: "データアップロード", icon: Upload },
    ...(isAdmin
      ? [{ id: "accounts" as Page, label: "アカウント管理", icon: UserCog }]
      : []),
  ];

  const currentStoreName =
    stores.find((s) => s.id === selectedStore)?.name || "店舗選択";

  const handleEdit = (store: Store) => {
    setEditingId(store.id);
    setEditName(store.name);
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      try {
        await onUpdateStore(editingId, editName.trim());
      } catch {}
      setEditingId(null);
      setEditName("");
    }
  };

  const handleAdd = async () => {
    if (newId.trim() && newName.trim()) {
      try {
        await onAddStore(newId.trim(), newName.trim());
        setNewId("");
        setNewName("");
        setAddMode(false);
      } catch {}
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteStore(id);
      if (selectedStore === id && stores.length > 1) {
        const remaining = stores.filter((s) => s.id !== id);
        if (remaining.length > 0) setSelectedStore(remaining[0].id);
      }
    } catch {}
  };

  return (
    <aside className="w-64 bg-dark-200 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold gradient-text">FU Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Business Analytics</p>
      </div>

      {/* Store Selector */}
      <div className="p-4 border-b border-white/10">
        {stores.length > 1 ? (
          <div className="relative">
            <button
              onClick={() => {
                setStoreDropdownOpen(!storeDropdownOpen);
                if (storeDropdownOpen) {
                  setEditMode(false);
                  setEditingId(null);
                  setAddMode(false);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-300 hover:bg-dark-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-accent-purple" />
                <span className="font-medium">{currentStoreName}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  storeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {storeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-100 rounded-lg border border-white/10 overflow-hidden z-50 shadow-xl">
                {/* Edit mode toggle - admin only */}
                {isAdmin && (
                  <div className="flex items-center justify-end px-3 py-2 border-b border-white/5">
                    <button
                      onClick={() => {
                        setEditMode(!editMode);
                        setEditingId(null);
                        setAddMode(false);
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        editMode
                          ? "bg-accent-purple/20 text-accent-purple"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                      title="店舗を編集"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Store list */}
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className={`flex items-center ${
                      selectedStore === store.id && !editMode
                        ? "bg-accent-purple/20"
                        : ""
                    }`}
                  >
                    {editingId === store.id ? (
                      <div className="flex-1 flex items-center gap-1 px-3 py-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 bg-dark-300 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-accent-purple"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-400 hover:bg-dark-200 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (!editMode) {
                              setSelectedStore(store.id);
                              setStoreDropdownOpen(false);
                            }
                          }}
                          className={`flex-1 text-left px-4 py-3 hover:bg-dark-200 transition-colors ${
                            selectedStore === store.id && !editMode
                              ? "text-accent-purple"
                              : ""
                          }`}
                        >
                          {store.name}
                        </button>
                        {editMode && (
                          <div className="flex items-center gap-1 pr-2">
                            <button
                              onClick={() => handleEdit(store)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-200 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(store.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Add store - admin only */}
                {isAdmin && editMode && (
                  <div className="border-t border-white/5">
                    {addMode ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={newId}
                          onChange={(e) => setNewId(e.target.value)}
                          placeholder="店舗ID（英数字）"
                          className="w-full bg-dark-300 border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent-purple"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="店舗名"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                          }}
                          className="w-full bg-dark-300 border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent-purple"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAdd}
                            className="flex-1 py-1.5 bg-accent-purple/20 text-accent-purple rounded text-sm hover:bg-accent-purple/30 transition-colors"
                          >
                            追加
                          </button>
                          <button
                            onClick={() => {
                              setAddMode(false);
                              setNewId("");
                              setNewName("");
                            }}
                            className="flex-1 py-1.5 bg-dark-300 text-gray-400 rounded text-sm hover:bg-dark-200 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddMode(true)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-accent-purple hover:bg-dark-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">店舗を追加</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : stores.length === 1 ? (
          // Single store: fixed display
          <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-300">
            <Building2 className="w-5 h-5 text-accent-purple" />
            <span className="font-medium">{stores[0].name}</span>
          </div>
        ) : (
          // No stores
          <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-300">
            <Building2 className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-500">店舗なし</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-accent-purple/20 to-accent-pink/20 text-white border-l-2 border-accent-purple"
                      : "text-gray-400 hover:text-white hover:bg-dark-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-accent-purple" : ""}`}
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with user info and logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">{userName}</span>
            <span className="text-xs text-gray-600 ml-2">
              {isAdmin ? "管理者" : "店舗"}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 text-center">
          FU Work Manager v0.1.0
        </div>
      </div>
    </aside>
  );
}

"use client";

import { Upload, BarChart3, Users, TrendingUp, Building2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { STORES } from "@/lib/stores";

type Page = "dashboard" | "upload" | "cast" | "trends";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  selectedStore,
  setSelectedStore,
}: SidebarProps) {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  const menuItems = [
    { id: "dashboard" as Page, label: "ダッシュボード", icon: BarChart3 },
    { id: "cast" as Page, label: "キャスト分析", icon: Users },
    { id: "upload" as Page, label: "データアップロード", icon: Upload },
  ];

  const currentStoreName = STORES.find(s => s.id === selectedStore)?.name || "店舗選択";

  return (
    <aside className="w-64 bg-dark-200 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold gradient-text">FU Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Business Analytics</p>
      </div>

      {/* Store Selector */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
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
              {STORES.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store.id);
                    setStoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-dark-200 transition-colors ${
                    selectedStore === store.id
                      ? "bg-accent-purple/20 text-accent-purple"
                      : ""
                  }`}
                >
                  {store.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
                  <Icon className={`w-5 h-5 ${isActive ? "text-accent-purple" : ""}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          FU Work Manager v0.1.0
        </div>
      </div>
    </aside>
  );
}

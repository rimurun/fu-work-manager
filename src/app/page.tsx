"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import UploadPage from "@/components/UploadPage";
import CastAnalysis from "@/components/CastAnalysis";
import AccountManagement from "@/components/AccountManagement";
import { useStores } from "@/hooks/useStores";
import { Loader2 } from "lucide-react";

type Page = "dashboard" | "upload" | "cast" | "trends" | "accounts";

export default function Home() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const storeManager = useStores();

  const userRole = (session?.user as any)?.role as
    | "admin"
    | "store"
    | undefined;
  const userStoreIds = (session?.user as any)?.storeIds as string[] | undefined;

  // Filter stores by user access
  const visibleStores =
    userRole === "admin"
      ? storeManager.stores
      : storeManager.stores.filter((s) => userStoreIds?.includes(s.id));

  // Keep selectedStore in sync with available stores
  useEffect(() => {
    if (visibleStores.length > 0) {
      if (
        !selectedStore ||
        !visibleStores.find((s) => s.id === selectedStore)
      ) {
        setSelectedStore(visibleStores[0].id);
      }
    }
  }, [selectedStore, visibleStores]);

  if (status === "loading" || storeManager.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            selectedStore={selectedStore}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            userRole={userRole}
          />
        );
      case "upload":
        return (
          <UploadPage
            selectedStore={selectedStore}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
          />
        );
      case "cast":
        return (
          <CastAnalysis
            selectedStore={selectedStore}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
          />
        );
      case "accounts":
        return <AccountManagement stores={storeManager.stores} />;
      default:
        return (
          <Dashboard
            selectedStore={selectedStore}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            userRole={userRole}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-400">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        stores={visibleStores}
        onAddStore={storeManager.addStore}
        onUpdateStore={storeManager.updateStore}
        onDeleteStore={storeManager.deleteStore}
        userRole={userRole || "store"}
        userName={session?.user?.name || ""}
        onLogout={() => signOut({ callbackUrl: "/login" })}
      />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
}

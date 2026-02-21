"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import UploadPage from "@/components/UploadPage";
import CastAnalysis from "@/components/CastAnalysis";

type Page = "dashboard" | "upload" | "cast" | "trends";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedStore, setSelectedStore] = useState<string>("omiya");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(1);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard selectedStore={selectedStore} selectedYear={selectedYear} selectedMonth={selectedMonth} setSelectedYear={setSelectedYear} setSelectedMonth={setSelectedMonth} />;
      case "upload":
        return <UploadPage selectedStore={selectedStore} />;
      case "cast":
        return <CastAnalysis selectedStore={selectedStore} selectedYear={selectedYear} selectedMonth={selectedMonth} setSelectedYear={setSelectedYear} setSelectedMonth={setSelectedMonth} />;
      default:
        return <Dashboard selectedStore={selectedStore} selectedYear={selectedYear} selectedMonth={selectedMonth} setSelectedYear={setSelectedYear} setSelectedMonth={setSelectedMonth} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-400">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
      />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

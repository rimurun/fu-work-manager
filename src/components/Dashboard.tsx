"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  UserPlus,
  Clock,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useReportData } from "@/hooks/useReportData";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Area,
} from "recharts";
import { STORES } from "@/lib/stores";

interface DashboardProps {
  selectedStore: string;
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  userRole?: "admin" | "store";
}

// Sample data
const sampleSalesData = [
  { date: "1/1", sales: 0, profit: 0, dayOfWeek: "水" },
  { date: "1/2", sales: 0, profit: 0, dayOfWeek: "木" },
  { date: "1/3", sales: 346000, profit: 135000, dayOfWeek: "金" },
  { date: "1/4", sales: 315000, profit: 113000, dayOfWeek: "土" },
  { date: "1/5", sales: 282000, profit: 98500, dayOfWeek: "日" },
  { date: "1/6", sales: 329000, profit: 125500, dayOfWeek: "月" },
  { date: "1/7", sales: 286000, profit: 105000, dayOfWeek: "火" },
  { date: "1/8", sales: 206000, profit: 81000, dayOfWeek: "水" },
  { date: "1/9", sales: 313000, profit: 119500, dayOfWeek: "木" },
  { date: "1/10", sales: 466000, profit: 184000, dayOfWeek: "金" },
  { date: "1/11", sales: 425000, profit: 168000, dayOfWeek: "土" },
  { date: "1/12", sales: 380000, profit: 145000, dayOfWeek: "日" },
  { date: "1/13", sales: 295000, profit: 112000, dayOfWeek: "月" },
  { date: "1/14", sales: 278000, profit: 102000, dayOfWeek: "火" },
];

// Previous month data for comparison
const prevMonthData = {
  sales: 9500000,
  profit: 3800000,
  customers: 580,
  avgUtilization: 29.5,
};

const sampleMediaData = [
  { name: "ヘブン大宮", value: 3878500, count: 222, color: "#a855f7" },
  { name: "不明", value: 3345000, count: 210, color: "#6b7280" },
  { name: "デリヘルタウン大宮", value: 1974000, count: 121, color: "#ec4899" },
  { name: "デリヘルタウン川越", value: 506000, count: 31, color: "#06b6d4" },
  { name: "その他", value: 626000, count: 45, color: "#22c55e" },
];

const sampleServiceData = [
  { name: "60分", sales: 567000 },
  { name: "60+10分", sales: 837000 },
  { name: "80分", sales: 936000 },
  { name: "80+10分", sales: 888000 },
  { name: "100分", sales: 765000 },
  { name: "100+10分", sales: 840000 },
  { name: "120分", sales: 918000 },
];

const sampleHourlyData = [
  { hour: "10時", rate: 33.0, count: 32, castCount: 8 },
  { hour: "11時", rate: 41.7, count: 45, castCount: 9 },
  { hour: "12時", rate: 29.0, count: 42, castCount: 12 },
  { hour: "13時", rate: 25.5, count: 41, castCount: 13 },
  { hour: "14時", rate: 22.1, count: 45, castCount: 17 },
  { hour: "15時", rate: 29.2, count: 69, castCount: 20 },
  { hour: "16時", rate: 24.3, count: 64, castCount: 22 },
  { hour: "17時", rate: 22.9, count: 66, castCount: 24 },
  { hour: "18時", rate: 22.4, count: 72, castCount: 27 },
  { hour: "19時", rate: 26.6, count: 83, castCount: 26 },
  { hour: "20時", rate: 23.2, count: 77, castCount: 28 },
  { hour: "21時", rate: 28.5, count: 85, castCount: 25 },
  { hour: "22時", rate: 35.2, count: 92, castCount: 22 },
  { hour: "23時", rate: 38.8, count: 78, castCount: 17 },
];

// Day of week mapping helper
const getDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
};

// Color palette for charts
const CHART_COLORS = [
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#6b7280",
];

export default function Dashboard({
  selectedStore,
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
  userRole,
}: DashboardProps) {
  const storeName = STORES.find((s) => s.id === selectedStore)?.name || "";
  const { data, prevData, loading, error, refetch } = useReportData(
    selectedStore,
    selectedYear,
    selectedMonth,
  );
  const [deleting, setDeleting] = useState(false);

  const handleDeleteMonth = async () => {
    if (
      !confirm(
        `${selectedYear}年${selectedMonth}月のデータを削除しますか？この操作は取り消せません。`,
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/data?store=${selectedStore}&year=${selectedYear}&month=${selectedMonth}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(await res.text());
      refetch();
    } catch (err) {
      alert("削除に失敗しました: " + String(err));
    } finally {
      setDeleting(false);
    }
  };

  // Use real data or fallback to sample data
  const salesData = data?.salesData || sampleSalesData;
  const mediaDataRaw = data?.mediaData || [];
  // Filter to allowed courses and sort by sales descending
  const ALLOWED_COURSES = new Set([
    "60分",
    "80分",
    "100分",
    "120分",
    "60+10分",
    "80+10分",
    "100+10分",
    "120+10分",
    "60分+10分",
    "80分+10分",
    "100分+10分",
    "120分+10分",
    "事前予約80+20分",
    "事前予約100+20分",
    "事前予約120+20分",
    "事前予約80分+20分",
    "事前予約100分+20分",
    "事前予約120分+20分",
    "延長30分+",
    "延長30分",
    "延長60分",
    "延長60分+",
  ]);
  const serviceData = (data?.serviceData || sampleServiceData)
    .filter((s) => ALLOWED_COURSES.has(s.name.replace(/＋/g, "+")))
    .sort((a, b) => b.sales - a.sales);
  const hourlyDataRaw = data?.hourlyData || [];

  // Transform sales data for charts
  const chartSalesData = data
    ? salesData.map((d) => ({
        date: `${selectedMonth}/${new Date(d.date).getDate()}`,
        sales: d.sales,
        profit: d.profit,
        dayOfWeek: getDayOfWeek(d.date),
      }))
    : sampleSalesData;

  // Transform media data
  const mediaData = data
    ? mediaDataRaw.map((m, i) => ({
        name: m.name,
        value: m.sales,
        count: m.count,
        color:
          m.name === "不明" ? "#6b7280" : CHART_COLORS[i % CHART_COLORS.length],
      }))
    : sampleMediaData;

  // Transform hourly data
  const hourlyData = data
    ? hourlyDataRaw.map((h) => ({
        hour: `${h.hour}時`,
        rate: h.utilizationRate,
        count: h.count,
        castCount: h.castCount,
      }))
    : sampleHourlyData;

  const totalSales = data
    ? salesData.reduce((sum, d) => sum + d.sales, 0)
    : sampleSalesData.reduce((sum, d) => sum + d.sales, 0);
  const totalProfit = data
    ? salesData.reduce((sum, d) => sum + d.profit, 0)
    : sampleSalesData.reduce((sum, d) => sum + d.profit, 0);
  const totalCustomers = data?.castData
    ? data.castData.reduce((sum, c) => sum + c.totalCustomers, 0)
    : 629;
  const totalMediaCount = mediaData.reduce((sum, m) => sum + m.count, 0);

  // Calculate previous month totals
  const prevTotalSales = prevData?.salesData
    ? prevData.salesData.reduce((sum, d) => sum + d.sales, 0)
    : prevMonthData.sales;
  const prevTotalProfit = prevData?.salesData
    ? prevData.salesData.reduce((sum, d) => sum + d.profit, 0)
    : prevMonthData.profit;
  const prevTotalCustomers = prevData?.castData
    ? prevData.castData.reduce((sum, c) => sum + c.totalCustomers, 0)
    : prevMonthData.customers;

  // Calculate month-over-month change
  const salesChange =
    prevTotalSales > 0
      ? ((totalSales - prevTotalSales) / prevTotalSales) * 100
      : 0;
  const profitChange =
    prevTotalProfit > 0
      ? ((totalProfit - prevTotalProfit) / prevTotalProfit) * 100
      : 0;
  const customerChange =
    prevTotalCustomers > 0
      ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100
      : 0;

  // Calculate "unknown" media percentage
  const unknownMedia = mediaData.find((m) => m.name === "不明");
  const unknownPercentage =
    unknownMedia && totalMediaCount > 0
      ? (unknownMedia.count / totalMediaCount) * 100
      : 0;

  // Calculate day of week stats
  const dayOfWeekStats = ["月", "火", "水", "木", "金", "土", "日"].map(
    (day) => {
      const dayData = chartSalesData.filter((d) => d.dayOfWeek === day);
      const avgSales =
        dayData.length > 0
          ? dayData.reduce((sum, d) => sum + d.sales, 0) / dayData.length
          : 0;
      return { day, avgSales, count: dayData.length };
    },
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate alerts
  const getAlerts = () => {
    const alerts: {
      type: "warning" | "success" | "info";
      icon: React.ElementType;
      message: string;
      detail: string;
    }[] = [];

    if (!data) return alerts;

    // Sales down significantly
    if (salesChange < -15) {
      alerts.push({
        type: "warning",
        icon: TrendingDown,
        message: "売上前月比-15%超",
        detail: `${salesChange.toFixed(1)}%減`,
      });
    } else if (salesChange > 10) {
      alerts.push({
        type: "success",
        icon: TrendingUp,
        message: "売上好調",
        detail: `前月比+${salesChange.toFixed(1)}%`,
      });
    }

    // Unknown media high
    if (unknownPercentage > 20) {
      alerts.push({
        type: "warning",
        icon: HelpCircle,
        message: "媒体不明が多い",
        detail: `${unknownPercentage.toFixed(0)}% - 確認徹底を`,
      });
    }

    // Low utilization hours (stricter: < 20% with many casts)
    const lowUtilHours = hourlyData.filter(
      (h) => h.rate < 20 && h.castCount > 20,
    );
    if (lowUtilHours.length >= 3) {
      alerts.push({
        type: "info",
        icon: Clock,
        message: "稼働率低時間帯あり",
        detail: `${lowUtilHours.length}時間帯で過剰配置の可能性`,
      });
    }

    // High utilization hours need more cast
    const highUtilHours = hourlyData.filter((h) => h.rate > 38);
    if (highUtilHours.length >= 2) {
      alerts.push({
        type: "info",
        icon: UserPlus,
        message: "高需要時間帯",
        detail: `${highUtilHours.map((h) => h.hour).join(", ")}に増員余地`,
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  // Calculate demand level per hour
  // Based on industry norms: 25-35% utilization is healthy for this business
  const getDemandInsights = () => {
    return hourlyData.map((h) => {
      const currentRate = h.rate;

      if (currentRate > 40) {
        return {
          hour: h.hour,
          type: "high" as const,
          message: "かなり需要高め",
        };
      } else if (currentRate > 35) {
        return {
          hour: h.hour,
          type: "high" as const,
          message: "需要高め",
        };
      } else if (currentRate < 15) {
        return {
          hour: h.hour,
          type: "low" as const,
          message: "かなり余裕あり",
        };
      } else if (currentRate < 20 && h.castCount > 20) {
        return {
          hour: h.hour,
          type: "low" as const,
          message: "やや余裕あり",
        };
      }
      return {
        hour: h.hour,
        type: "ok" as const,
        message: "適正",
      };
    });
  };

  const demandInsights = getDemandInsights();
  const highDemandHours = demandInsights.filter((r) => r.type === "high");
  const lowDemandHours = demandInsights.filter((r) => r.type === "low");

  const StatCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    change,
    color,
  }: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    change?: number;
    color: string;
  }) => (
    <div className="glass rounded-xl p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-4">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm ${change >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="text-gray-500 text-sm">前月比</span>
        </div>
      )}
    </div>
  );

  const years = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-gray-400">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const pieFormatter = (value: number, name: string, item: any) => {
    const count = item?.payload?.count;
    const label = `${formatCurrency(value)}${typeof count === "number" ? ` (${count}人)` : ""}`;
    return [label, name] as [string, string];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{storeName} ダッシュボード</h1>
            {data && userRole === "admin" && (
              <button
                onClick={handleDeleteMonth}
                disabled={deleting}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title={`${selectedYear}年${selectedMonth}月のデータを削除`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            {selectedYear}年{selectedMonth}月の統計データ
          </p>
        </div>

        <div className="flex items-center gap-2 bg-dark-200 rounded-lg p-1">
          <Calendar className="w-5 h-5 text-gray-400 ml-2" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent border-none text-white px-2 py-2 focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year} className="bg-dark-300">
                {year}年
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedMonth === month
                    ? "bg-accent-purple text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-100"
                }`}
              >
                {month}月
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No Data State */}
      {!data && (
        <div className="glass rounded-xl p-12 text-center">
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            データがありません
          </h3>
          <p className="text-gray-500 mb-4">
            {selectedYear}年{selectedMonth}
            月のデータはまだアップロードされていません。
          </p>
          <p className="text-sm text-gray-600">
            左メニューの「アップロード」からExcelファイルをアップロードしてください。
          </p>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border flex items-start gap-3 ${
                  alert.type === "warning"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : alert.type === "success"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-cyan-500/10 border-cyan-500/30"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    alert.type === "warning"
                      ? "text-orange-400"
                      : alert.type === "success"
                        ? "text-green-400"
                        : "text-cyan-400"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      alert.type === "warning"
                        ? "text-orange-400"
                        : alert.type === "success"
                          ? "text-green-400"
                          : "text-cyan-400"
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400">{alert.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="月間売上"
            value={formatCurrency(totalSales)}
            icon={DollarSign}
            change={prevData ? salesChange : undefined}
            color="#a855f7"
          />
          <StatCard
            title="純利益"
            value={formatCurrency(totalProfit)}
            subValue={
              totalSales > 0
                ? `利益率 ${((totalProfit / totalSales) * 100).toFixed(1)}%`
                : undefined
            }
            icon={TrendingUp}
            change={prevData ? profitChange : undefined}
            color="#22c55e"
          />
          <StatCard
            title="総客数"
            value={`${totalCustomers}人`}
            icon={Users}
            change={prevData ? customerChange : undefined}
            color="#06b6d4"
          />
          {(() => {
            const seg = data?.customerSegment || [];
            const newC = seg.find((s) => s.segment.includes("新規"));
            const memC = seg.find((s) => s.segment.includes("会員"));
            return (
              <div className="glass rounded-xl p-6 card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">新規・会員比率</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xl font-bold">
                        新規{" "}
                        <span className="text-pink-400">
                          {newC ? `${newC.percentage.toFixed(0)}%` : "-"}
                        </span>
                      </p>
                      <p className="text-xl font-bold">
                        会員{" "}
                        <span className="text-cyan-400">
                          {memC ? `${memC.percentage.toFixed(0)}%` : "-"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "#ec489920" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "#ec4899" }} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Charts Row 1 - Only show if data exists */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">売上・純利益推移</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v) => `${v / 10000}万`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1e2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="売上"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: "#a855f7" }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="純利益"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Day of Week Analysis */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">曜日別平均売上</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayOfWeekStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v) => `${v / 10000}万`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1e2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="avgSales" name="平均売上" radius={[4, 4, 0, 0]}>
                  {dayOfWeekStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["金", "土", "日"].includes(entry.day)
                          ? "#a855f7"
                          : "#6b7280"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-2">紫 = 金土日（週末）</p>
          </div>
        </div>
      )}

      {/* Media Distribution with count and warning */}
      {data && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">媒体別売上</h3>
            {unknownPercentage > 20 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">
                  不明 {unknownPercentage.toFixed(0)}% - 媒体確認を徹底
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={mediaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mediaData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "不明" && unknownPercentage > 20
                            ? "#ef4444"
                            : entry.color
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1e2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={pieFormatter}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-3 space-y-1.5">
              {mediaData.map((entry, index) => {
                const isUnknownWarning =
                  entry.name === "不明" && unknownPercentage > 20;
                const percentage =
                  totalSales > 0 ? (entry.value / totalSales) * 100 : 0;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${isUnknownWarning ? "bg-red-500/10" : "bg-dark-200/50"}`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isUnknownWarning
                          ? "#ef4444"
                          : entry.color,
                      }}
                    />
                    <span
                      className={`text-sm flex-1 ${isUnknownWarning ? "text-red-400 font-medium" : "text-gray-300"}`}
                      title={entry.name}
                    >
                      {entry.name}
                    </span>
                    <span
                      className={`text-sm font-medium ${isUnknownWarning ? "text-red-400" : "text-gray-300"}`}
                    >
                      {formatCurrency(entry.value)}
                    </span>
                    <span
                      className={`text-sm w-12 text-right ${isUnknownWarning ? "text-red-400" : "text-gray-500"}`}
                    >
                      {entry.count}人
                    </span>
                    <span
                      className={`text-sm w-10 text-right ${isUnknownWarning ? "text-red-400" : "text-gray-500"}`}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Time Analysis with Driver Recommendations */}
      {data && hourlyData.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">時間帯別分析 & シフト提案</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                高需要
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                適正
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                過剰
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" stroke="#888" fontSize={11} />
                  <YAxis
                    yAxisId="left"
                    stroke="#888"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1e2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: number, name: string) => {
                      if (name === "稼働率") return `${value.toFixed(1)}%`;
                      return `${value}人`;
                    }}
                  />
                  <Legend />
                  <ReferenceLine
                    yAxisId="left"
                    y={28}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    label={{
                      value: "目標28%",
                      fill: "#22c55e",
                      fontSize: 10,
                      position: "right",
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="rate"
                    name="稼働率"
                    radius={[4, 4, 0, 0]}
                  >
                    {hourlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.rate > 33
                            ? "#34d399"
                            : entry.rate > 20
                              ? "#fbbf24"
                              : "#f87171"
                        }
                      />
                    ))}
                  </Bar>
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="castCount"
                    name="出勤数"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                    stroke="#06b6d4"
                    strokeWidth={1}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-emerald-400 text-sm">
                    需要が高い時間帯
                  </h4>
                </div>
                <div className="space-y-1">
                  {highDemandHours.length > 0 ? (
                    highDemandHours.map((r) => (
                      <div
                        key={r.hour}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">{r.hour}</span>
                        <span className="text-emerald-400 font-medium">
                          {r.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">現在なし</p>
                  )}
                  {highDemandHours.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      手厚くするとお客さん逃さないかも
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h4 className="font-semibold text-amber-400 text-sm">
                    余裕がある時間帯
                  </h4>
                </div>
                <div className="space-y-1">
                  {lowDemandHours.length > 0 ? (
                    lowDemandHours.map((r) => (
                      <div
                        key={r.hour}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">{r.hour}</span>
                        <span className="text-amber-400 font-medium">
                          {r.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">現在なし</p>
                  )}
                  {lowDemandHours.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      厚くしてもきついかも？
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Sales */}
      {data && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">コース別売上</h3>
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, serviceData.length * 32 + 40)}
          >
            <BarChart data={serviceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number"
                stroke="#888"
                tickFormatter={(v) => `${v / 10000}万`}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#888"
                width={130}
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e1e2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="sales" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

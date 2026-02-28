"use client";

import { useState, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  AlertTriangle,
  Award,
  Target,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  UserMinus,
  Calendar,
  Loader2,
  Upload,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import { STORES } from "@/lib/stores";
import { useReportData } from "@/hooks/useReportData";

interface CastAnalysisProps {
  selectedStore: string;
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
}

type SortKey =
  | "sales"
  | "honShimei"
  | "photoShimei"
  | "repeatRate"
  | "extensionRate"
  | "utilizationRate"
  | "absenceRate";
type SortOrder = "asc" | "desc";

// Sample cast data with extension rate and previous month comparison
const sampleCastData = [
  {
    id: 1,
    name: "ゆうみ★",
    sales: 360000,
    prevSales: 340000,
    honShimei: 25,
    photoShimei: 8,
    repeatRate: 33.7,
    extensionRate: 18.5,
    utilizationRate: 32.4,
    absenceRate: 14.3,
    prevAbsenceRate: 10.0,
    trend: "up",
  },
  {
    id: 2,
    name: "にな★",
    sales: 270000,
    prevSales: 280000,
    honShimei: 23,
    photoShimei: 3,
    repeatRate: 28.5,
    extensionRate: 22.0,
    utilizationRate: 35.2,
    absenceRate: 10.0,
    prevAbsenceRate: 8.0,
    trend: "up",
  },
  {
    id: 3,
    name: "かえで★",
    sales: 350000,
    prevSales: 320000,
    honShimei: 13,
    photoShimei: 12,
    repeatRate: 25.0,
    extensionRate: 15.2,
    utilizationRate: 28.5,
    absenceRate: 8.0,
    prevAbsenceRate: 10.0,
    trend: "up",
  },
  {
    id: 4,
    name: "あど★",
    sales: 288000,
    prevSales: 260000,
    honShimei: 12,
    photoShimei: 1,
    repeatRate: 30.2,
    extensionRate: 25.8,
    utilizationRate: 59.2,
    absenceRate: 0,
    prevAbsenceRate: 0,
    trend: "up",
  },
  {
    id: 5,
    name: "うみ★",
    sales: 250000,
    prevSales: 280000,
    honShimei: 12,
    photoShimei: 10,
    repeatRate: 33.7,
    extensionRate: 12.5,
    utilizationRate: 32.4,
    absenceRate: 14.3,
    prevAbsenceRate: 5.0,
    trend: "up",
  },
  {
    id: 6,
    name: "あすか★",
    sales: 309000,
    prevSales: 380000,
    honShimei: 8,
    photoShimei: 6,
    repeatRate: 14.8,
    extensionRate: 8.2,
    utilizationRate: 28.2,
    absenceRate: 13.3,
    prevAbsenceRate: 5.0,
    trend: "down",
  },
  {
    id: 7,
    name: "ゆら★",
    sales: 160000,
    prevSales: 200000,
    honShimei: 8,
    photoShimei: 6,
    repeatRate: 25.0,
    extensionRate: 20.0,
    utilizationRate: 22.0,
    absenceRate: 5.0,
    prevAbsenceRate: 3.0,
    trend: "up",
  },
  {
    id: 8,
    name: "あみ★",
    sales: 124000,
    prevSales: 220000,
    honShimei: 4,
    photoShimei: 1,
    repeatRate: 33.7,
    extensionRate: 5.0,
    utilizationRate: 32.4,
    absenceRate: 57.1,
    prevAbsenceRate: 25.0,
    trend: "down",
  },
  {
    id: 9,
    name: "りん★",
    sales: 230000,
    prevSales: 225000,
    honShimei: 11,
    photoShimei: 8,
    repeatRate: 28.0,
    extensionRate: 16.5,
    utilizationRate: 38.5,
    absenceRate: 8.5,
    prevAbsenceRate: 10.0,
    trend: "up",
  },
  {
    id: 10,
    name: "すみれ★",
    sales: 180000,
    prevSales: 250000,
    honShimei: 9,
    photoShimei: 2,
    repeatRate: 22.0,
    extensionRate: 28.5,
    utilizationRate: 25.0,
    absenceRate: 12.0,
    prevAbsenceRate: 5.0,
    trend: "up",
  },
];

// Calculate attrition risk (離脱リスク予測)
const getAttritionRisk = (cast: (typeof sampleCastData)[0]) => {
  let riskScore = 0;
  const reasons: string[] = [];

  // Factor 1: Declining sales (売上低下)
  // This industry has 10-20% monthly fluctuation as normal
  const salesChange = ((cast.sales - cast.prevSales) / cast.prevSales) * 100;
  if (salesChange < -30) {
    riskScore += 3;
    reasons.push(`売上${salesChange.toFixed(0)}%減`);
  } else if (salesChange < -20) {
    riskScore += 2;
    reasons.push(`売上${salesChange.toFixed(0)}%減`);
  }

  // Factor 2: Increasing absence rate (欠勤率上昇)
  const absenceIncrease = cast.absenceRate - cast.prevAbsenceRate;
  if (absenceIncrease >= 25) {
    riskScore += 3;
    reasons.push(`欠勤率+${absenceIncrease.toFixed(0)}pt`);
  } else if (absenceIncrease >= 15) {
    riskScore += 2;
    reasons.push(`欠勤率+${absenceIncrease.toFixed(0)}pt`);
  }

  // Factor 3: Very high absence rate (高欠勤率)
  if (cast.absenceRate >= 60) {
    riskScore += 3;
    reasons.push(`欠勤率${cast.absenceRate.toFixed(0)}%`);
  } else if (cast.absenceRate >= 50) {
    riskScore += 2;
    reasons.push(`欠勤率${cast.absenceRate.toFixed(0)}%`);
  }

  // Factor 4: Low utilization and declining (稼働率低下)
  if (cast.utilizationRate < 15) {
    riskScore += 1;
    reasons.push("低稼働");
  }

  // Determine risk level
  // High: multiple strong signals (score 5+)
  // Medium: clear warning signs (score 4)
  // Low: minor concern (score 2-3)
  if (riskScore >= 5)
    return {
      level: "high",
      label: "高",
      color: "text-red-400 bg-red-400/20",
      reasons,
    };
  if (riskScore >= 4)
    return {
      level: "medium",
      label: "中",
      color: "text-orange-400 bg-orange-400/20",
      reasons,
    };
  if (riskScore >= 2)
    return {
      level: "low",
      label: "低",
      color: "text-yellow-400 bg-yellow-400/20",
      reasons,
    };
  return { level: "none", label: "-", color: "text-gray-500", reasons: [] };
};

// Calculate judgment based on overall metrics
const getJudgment = (cast: (typeof sampleCastData)[0]) => {
  const totalShimei = cast.honShimei + cast.photoShimei;
  const honShimeiRatio =
    totalShimei > 0 ? (cast.honShimei / totalShimei) * 100 : 0;

  // Scoring system
  let score = 0;
  if (honShimeiRatio >= 70) score += 3;
  else if (honShimeiRatio >= 50) score += 2;
  else if (honShimeiRatio >= 30) score += 1;

  if (cast.repeatRate >= 30) score += 2;
  else if (cast.repeatRate >= 20) score += 1;

  if (cast.extensionRate >= 15) score += 1;
  if (cast.utilizationRate >= 35) score += 1;
  if (cast.absenceRate <= 10) score += 1;
  if (cast.absenceRate >= 45) score -= 2;

  if (score >= 7)
    return { label: "エース", color: "text-yellow-400 bg-yellow-400/20" };
  if (score >= 5)
    return { label: "安定", color: "text-green-400 bg-green-400/20" };
  if (score >= 3)
    return { label: "成長中", color: "text-cyan-400 bg-cyan-400/20" };
  if (cast.absenceRate >= 45)
    return { label: "勤怠△", color: "text-red-400 bg-red-400/20" };
  if (honShimeiRatio < 30)
    return { label: "育成", color: "text-purple-400 bg-purple-400/20" };
  return { label: "様子見", color: "text-gray-400 bg-gray-400/20" };
};

// Calculate type based on metrics
const getType = (cast: (typeof sampleCastData)[0]) => {
  const totalShimei = cast.honShimei + cast.photoShimei;
  const honShimeiRatio =
    totalShimei > 0 ? (cast.honShimei / totalShimei) * 100 : 0;

  if (honShimeiRatio >= 70 && cast.repeatRate >= 25)
    return { label: "リピ型", color: "text-pink-400" };
  if (cast.photoShimei > cast.honShimei)
    return { label: "新規型", color: "text-cyan-400" };
  if (cast.utilizationRate >= 40)
    return { label: "効率型", color: "text-green-400" };
  return { label: "バランス", color: "text-purple-400" };
};

export default function CastAnalysis({
  selectedStore,
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
}: CastAnalysisProps) {
  const [selectedCast, setSelectedCast] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("sales");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [highlightedCasts, setHighlightedCasts] = useState<string[]>([]);
  const attritionRef = useRef<HTMLDivElement>(null);
  const storeName = STORES.find((s) => s.id === selectedStore)?.name || "";
  const { data, prevData, loading } = useReportData(
    selectedStore,
    selectedYear,
    selectedMonth,
  );

  const years = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Transform API data to component format
  const castData = data?.castData
    ? data.castData
        .filter((c) => !c.name.includes("合計"))
        .map((c, i) => {
          const prevCast = prevData?.castData?.find((pc) => pc.name === c.name);
          return {
            id: i + 1,
            name: c.name,
            sales: c.sales,
            prevSales: prevCast?.sales || c.sales,
            honShimei: c.honShimei,
            photoShimei: c.photoShimei,
            repeatRate: c.repeatRate,
            extensionRate: c.extensionRate,
            utilizationRate: c.utilizationRate,
            absenceRate: c.absenceRate,
            prevAbsenceRate: prevCast?.absenceRate || c.absenceRate,
            trend:
              (prevCast && c.sales >= prevCast.sales) || !prevCast
                ? ("up" as const)
                : ("down" as const),
          };
        })
    : sampleCastData;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedCasts = [...castData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortOrder === "desc"
      ? (bVal as number) - (aVal as number)
      : (aVal as number) - (bVal as number);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Radar data for selected cast
  const getRadarData = (cast: (typeof castData)[0]) => {
    const maxSales = Math.max(...castData.map((c) => c.sales));
    const maxHonShimei = Math.max(...castData.map((c) => c.honShimei));
    const maxExtension = Math.max(...castData.map((c) => c.extensionRate));

    return [
      {
        metric: "売上",
        value: maxSales > 0 ? (cast.sales / maxSales) * 100 : 0,
      },
      {
        metric: "本指名",
        value: maxHonShimei > 0 ? (cast.honShimei / maxHonShimei) * 100 : 0,
      },
      { metric: "リピート率", value: cast.repeatRate * 2 },
      {
        metric: "延長率",
        value: maxExtension > 0 ? (cast.extensionRate / maxExtension) * 100 : 0,
      },
      { metric: "稼働率", value: cast.utilizationRate * 1.5 },
      { metric: "勤怠", value: 100 - cast.absenceRate },
    ];
  };

  const selectedCastDataItem = selectedCast
    ? castData.find((c) => c.id === selectedCast)
    : null;

  // Calculate alerts based on overall metrics
  const getAlerts = () => {
    const alerts: {
      type: "warning" | "success" | "info" | "danger";
      message: string;
      casts: string[];
      icon?: string;
    }[] = [];

    // Attrition risk - HIGH priority (only show high, not medium)
    const highRiskCasts = castData.filter(
      (c) => getAttritionRisk(c).level === "high",
    );
    if (highRiskCasts.length > 0) {
      alerts.push({
        type: "danger",
        message: "離脱リスク高",
        casts: highRiskCasts.map((c) => c.name),
        icon: "attrition",
      });
    }

    // Medium attrition risk (only show if 3 or fewer to avoid clutter)
    const mediumRiskCasts = castData.filter(
      (c) => getAttritionRisk(c).level === "medium",
    );
    if (mediumRiskCasts.length > 0 && mediumRiskCasts.length <= 3) {
      alerts.push({
        type: "warning",
        message: "離脱リスク注意",
        casts: mediumRiskCasts.map((c) => c.name),
        icon: "attrition",
      });
    }

    // Low hon-shimei ratio - only for casts with enough data (10+ shimei total)
    const lowHonRatio = castData.filter((c) => {
      const total = c.honShimei + c.photoShimei;
      return total >= 10 && c.photoShimei > c.honShimei * 1.5;
    });
    if (lowHonRatio.length > 0) {
      alerts.push({
        type: "info",
        message: "本指名転換の余地あり",
        casts: lowHonRatio.map((c) => c.name),
      });
    }

    // Top performers
    const topPerformers = castData.filter((c) => {
      const total = c.honShimei + c.photoShimei;
      return total > 0 && c.honShimei / total >= 0.7 && c.repeatRate >= 25;
    });
    if (topPerformers.length > 0) {
      alerts.push({
        type: "success",
        message: "本指名率70%超＆高リピート",
        casts: topPerformers.map((c) => c.name),
      });
    }

    // Low repeat rate but high sales (stricter thresholds)
    const lowRepeat = castData.filter(
      (c) => c.repeatRate < 15 && c.sales >= 300000,
    );
    if (lowRepeat.length > 0) {
      alerts.push({
        type: "warning",
        message: "売上あるがリピート率低",
        casts: lowRepeat.map((c) => c.name),
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  const SortHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <th
      className="px-3 py-3 cursor-pointer hover:bg-dark-200 transition-colors select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortKey === sortKeyName &&
          (sortOrder === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          ))}
      </div>
    </th>
  );

  // Hon-shimei ratio ranking
  const honShimeiRanking = [...castData]
    .map((c) => ({
      ...c,
      honRatio:
        c.honShimei + c.photoShimei > 0
          ? (c.honShimei / (c.honShimei + c.photoShimei)) * 100
          : 0,
    }))
    .filter((c) => c.honShimei + c.photoShimei >= 5)
    .sort((a, b) => b.honRatio - a.honRatio)
    .slice(0, 8);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">キャスト分析</h1>
          <p className="text-gray-400 mt-1">
            {storeName} - {selectedYear}年{selectedMonth}月
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

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">総キャスト</span>
            </div>
            <p className="text-xl font-bold">{castData.length}名</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs">平均売上</span>
            </div>
            <p className="text-xl font-bold">
              {castData.length > 0
                ? formatCurrency(
                    castData.reduce((sum, c) => sum + c.sales, 0) /
                      castData.length,
                  )
                : "¥0"}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">平均本指名</span>
            </div>
            <p className="text-xl font-bold text-pink-400">
              {castData.length > 0
                ? (
                    castData.reduce((sum, c) => sum + c.honShimei, 0) /
                    castData.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">エース</span>
            </div>
            <p className="text-xl font-bold text-yellow-400">
              {castData.filter((c) => getJudgment(c).label === "エース").length}
              名
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">要注意</span>
            </div>
            <p className="text-xl font-bold text-orange-400">
              {
                castData.filter((c) =>
                  ["勤怠△", "育成"].includes(getJudgment(c).label),
                ).length
              }
              名
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <UserMinus className="w-4 h-4" />
              <span className="text-xs">離脱リスク</span>
            </div>
            <p className="text-xl font-bold text-red-400">
              {
                castData.filter((c) =>
                  ["high", "medium"].includes(getAttritionRisk(c).level),
                ).length
              }
              名
            </p>
          </div>
        </div>
      )}

      {/* Alerts - Horizontal compact layout (clickable) */}
      {data && alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <button
              key={i}
              onClick={() => {
                setHighlightedCasts(alert.casts);
                attritionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 cursor-pointer hover:brightness-125 transition-all ${
                alert.type === "danger"
                  ? "bg-red-500/10 border-red-500/30"
                  : alert.type === "warning"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : alert.type === "success"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-cyan-500/10 border-cyan-500/30"
              }`}
            >
              {alert.type === "danger" ? (
                <UserMinus className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : alert.type === "warning" ? (
                alert.icon === "attrition" ? (
                  <UserMinus className="w-4 h-4 text-orange-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                )
              ) : alert.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <Target className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              )}
              <span
                className={`text-xs font-medium ${alert.type === "danger" ? "text-red-400" : alert.type === "warning" ? "text-orange-400" : alert.type === "success" ? "text-green-400" : "text-cyan-400"}`}
              >
                {alert.message}
              </span>
              <span className="text-xs text-gray-400">
                ({alert.casts.length}名)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Attrition Risk Section */}
      {data && castData.some((c) => getAttritionRisk(c).level !== "none") && (
        <div ref={attritionRef} className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold">離脱リスク予測</h3>
            </div>
            {highlightedCasts.length > 0 && (
              <button
                onClick={() => setHighlightedCasts([])}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-dark-200"
              >
                ハイライト解除
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {castData
              .filter((c) => {
                if (highlightedCasts.length > 0) {
                  return highlightedCasts.includes(c.name);
                }
                return getAttritionRisk(c).level !== "none";
              })
              .sort((a, b) => {
                const riskOrder = { high: 0, medium: 1, low: 2, none: 3 };
                return (
                  riskOrder[
                    getAttritionRisk(a).level as keyof typeof riskOrder
                  ] -
                  riskOrder[getAttritionRisk(b).level as keyof typeof riskOrder]
                );
              })
              .map((cast) => {
                const risk = getAttritionRisk(cast);
                const isHighlighted = highlightedCasts.includes(cast.name);
                return (
                  <div
                    key={cast.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isHighlighted
                        ? "ring-2 ring-accent-purple ring-offset-1 ring-offset-dark-300"
                        : ""
                    } ${
                      risk.level === "high"
                        ? "bg-red-500/10 border-red-500/30"
                        : risk.level === "medium"
                          ? "bg-orange-500/10 border-orange-500/30"
                          : risk.level === "none"
                            ? "bg-dark-200 border-white/10"
                            : "bg-yellow-500/10 border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cast.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${risk.color}`}
                      >
                        リスク{risk.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {risk.reasons.map((reason, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-gray-400"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 text-xs text-gray-500">
                      売上: {formatCurrency(cast.sales)} (前月比
                      {cast.sales >= cast.prevSales ? "+" : ""}
                      {(
                        ((cast.sales - cast.prevSales) / cast.prevSales) *
                        100
                      ).toFixed(0)}
                      %)
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cast List */}
      {data && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold">
              キャスト一覧（ヘッダークリックでソート）
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-300 text-gray-400">
                <tr className="text-left">
                  <th className="px-3 py-3">キャスト</th>
                  <SortHeader label="売上" sortKeyName="sales" />
                  <SortHeader label="本指名" sortKeyName="honShimei" />
                  <SortHeader label="写真" sortKeyName="photoShimei" />
                  <SortHeader label="リピ率" sortKeyName="repeatRate" />
                  <SortHeader label="延長率" sortKeyName="extensionRate" />
                  <SortHeader label="稼働率" sortKeyName="utilizationRate" />
                  <SortHeader label="欠勤率" sortKeyName="absenceRate" />
                  <th className="px-3 py-3">タイプ</th>
                  <th className="px-3 py-3">判定</th>
                </tr>
              </thead>
              <tbody>
                {sortedCasts.map((cast, index) => {
                  const judgment = getJudgment(cast);
                  const type = getType(cast);
                  return (
                    <tr
                      key={cast.id}
                      className={`border-b border-white/5 hover:bg-dark-100 cursor-pointer transition-colors ${selectedCast === cast.id ? "bg-accent-purple/10" : ""}`}
                      onClick={() =>
                        setSelectedCast(
                          selectedCast === cast.id ? null : cast.id,
                        )
                      }
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-dark-200"}`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">{cast.name}</span>
                          {cast.trend === "up" ? (
                            <ArrowUpRight className="w-3 h-3 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatCurrency(cast.sales)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          <span>{cast.honShimei}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>{cast.photoShimei}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            cast.repeatRate >= 30
                              ? "text-green-400"
                              : cast.repeatRate >= 20
                                ? "text-yellow-400"
                                : "text-red-400"
                          }
                        >
                          {cast.repeatRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              cast.extensionRate >= 20
                                ? "text-purple-400"
                                : "text-gray-400"
                            }
                          >
                            {cast.extensionRate.toFixed(1)}%
                          </span>
                          {cast.extensionRate >= 20 && (
                            <Zap className="w-3 h-3 text-purple-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            cast.utilizationRate >= 40
                              ? "text-green-400"
                              : cast.utilizationRate >= 25
                                ? "text-yellow-400"
                                : "text-gray-400"
                          }
                        >
                          {cast.utilizationRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            cast.absenceRate <= 10
                              ? "text-green-400"
                              : cast.absenceRate <= 20
                                ? "text-yellow-400"
                                : "text-red-400"
                          }
                        >
                          {cast.absenceRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={type.color}>{type.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${judgment.color}`}
                        >
                          {judgment.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hon-shimei Ratio Ranking */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              本指名率ランキング（5件以上）
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={honShimeiRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  type="number"
                  stroke="#888"
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  width={70}
                  fontSize={12}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x - 65}
                      y={y}
                      dy={4}
                      fill="#888"
                      fontSize={12}
                      textAnchor="start"
                    >
                      {payload.value}
                    </text>
                  )}
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
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="honRatio" name="本指名率" radius={[0, 4, 4, 0]}>
                  {honShimeiRanking.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.honRatio >= 70
                          ? "#ec4899"
                          : entry.honRatio >= 50
                            ? "#a855f7"
                            : "#6b7280"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                70%以上
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                50-70%
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                50%未満
              </span>
            </div>
          </div>

          {/* Radar Chart for Selected Cast */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              キャスト詳細分析
              {selectedCastDataItem && (
                <span className="text-purple-400 ml-2">
                  {selectedCastDataItem.name}
                </span>
              )}
            </h3>
            {selectedCastDataItem ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={getRadarData(selectedCastDataItem)}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis
                    dataKey="metric"
                    stroke="#888"
                    fontSize={12}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" />
                  <Radar
                    name={selectedCastDataItem.name}
                    dataKey="value"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">
                上の表からキャストを選択してください
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

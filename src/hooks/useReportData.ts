"use client";

import { useState, useEffect } from "react";

export interface ReportData {
  store: string;
  year: number;
  month: number;
  uploadedAt: string;
  salesData: {
    date: string;
    sales: number;
    expenses: number;
    profit: number;
  }[];
  castData: {
    name: string;
    sales: number;
    honShimei: number;
    photoShimei: number;
    staffRecommend: number;
    repeatRate: number;
    utilizationRate: number;
    absenceRate: number;
    lateRate: number;
    extensionRate: number;
    totalCustomers: number;
    repeatCustomers: number;
  }[];
  serviceData: {
    name: string;
    sales: number;
  }[];
  hourlyData: {
    hour: number;
    count: number;
    castCount: number;
    utilizationRate: number;
  }[];
  mediaData: {
    name: string;
    sales: number;
    count: number;
    percentage: number;
  }[];
  customerSegment: {
    segment: string;
    count: number;
    percentage: number;
  }[];
}

export function useReportData(store: string, year: number, month: number) {
  const [data, setData] = useState<ReportData | null>(null);
  const [prevData, setPrevData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch current month
        const res = await fetch(`/api/data?store=${store}&year=${year}&month=${month}`);
        const json = await res.json();

        if (json.reports && json.reports.length > 0) {
          setData(json.reports[0]);
        } else {
          setData(null);
        }

        // Fetch previous month for comparison
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth < 1) {
          prevMonth = 12;
          prevYear = year - 1;
        }

        const prevRes = await fetch(`/api/data?store=${store}&year=${prevYear}&month=${prevMonth}`);
        const prevJson = await prevRes.json();

        if (prevJson.reports && prevJson.reports.length > 0) {
          setPrevData(prevJson.reports[0]);
        } else {
          setPrevData(null);
        }
      } catch (err) {
        setError(String(err));
        setData(null);
        setPrevData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [store, year, month]);

  return { data, prevData, loading, error };
}

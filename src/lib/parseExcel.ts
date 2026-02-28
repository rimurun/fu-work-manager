import * as XLSX from "xlsx";

// Per-sheet column configuration
export interface SheetColumnConfig {
  startRow: number;
  columns: Record<string, number>;
}

export type ParseConfig = {
  sales: SheetColumnConfig;
  castSales: SheetColumnConfig;
  shimei: SheetColumnConfig;
  repeatRate: SheetColumnConfig;
  utilization: SheetColumnConfig;
  absence: SheetColumnConfig;
  late: SheetColumnConfig;
  extension: SheetColumnConfig;
  service: SheetColumnConfig;
  hourly: SheetColumnConfig;
  media: SheetColumnConfig;
  customerSegment: SheetColumnConfig;
};

export const DEFAULT_PARSE_CONFIG: ParseConfig = {
  sales: {
    startRow: 1,
    columns: { date: 0, sales: 1, expenses: 2, profit: 3 },
  },
  castSales: {
    startRow: 1,
    columns: { name: 0, sales: 1 },
  },
  shimei: {
    startRow: 1,
    columns: {
      name: 0,
      photoNew: 2,
      staffRecommend: 5,
      photoMember: 6,
      honShimei: 7,
    },
  },
  repeatRate: {
    startRow: 2,
    columns: { name: 0, totalCustomers: 1, repeatCustomers: 2, repeatRate: 4 },
  },
  utilization: {
    startRow: 2,
    columns: { name: 0, rate: 3 },
  },
  absence: {
    startRow: 2,
    columns: { name: 0, rate: 3 },
  },
  late: {
    startRow: 2,
    columns: { name: 0, rate: 3 },
  },
  extension: {
    startRow: 2,
    columns: { name: 0, rate: 3 },
  },
  service: {
    startRow: 1,
    columns: { name: 0, sales: 1 },
  },
  hourly: {
    startRow: 1,
    columns: { hour: 0, count: 1, castCount: 2, rate: 3 },
  },
  media: {
    startRow: 1,
    columns: { name: 0, sales: 1, percentage: 2, count: 3 },
  },
  customerSegment: {
    startRow: 1,
    columns: { segment: 0, percentage: 1, count: 2 },
  },
};

export interface ParsedData {
  salesData: {
    date: Date;
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

export function parseExcelFile(
  buffer: Buffer,
  config: ParseConfig = DEFAULT_PARSE_CONFIG,
): ParsedData {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const result: ParsedData = {
    salesData: [],
    castData: [],
    serviceData: [],
    hourlyData: [],
    mediaData: [],
    customerSegment: [],
  };

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (sheetName.includes("売上") && sheetName.includes("推移")) {
      result.salesData = parseSalesSheet(data, config.sales);
    } else if (sheetName.includes("コンパニオン別売上")) {
      result.castData = parseCastSalesSheet(
        data,
        result.castData,
        config.castSales,
      );
    } else if (sheetName.includes("サービス別")) {
      result.serviceData = parseServiceSheet(data, config.service);
    } else if (sheetName.includes("時間帯別")) {
      result.hourlyData = parseHourlySheet(data, config.hourly);
    } else if (sheetName.includes("媒体")) {
      result.mediaData = parseMediaSheet(data, config.media);
    } else if (sheetName.includes("顧客区分")) {
      result.customerSegment = parseCustomerSegmentSheet(
        data,
        config.customerSegment,
      );
    } else if (sheetName.includes("指名集計表") && !sheetName.includes("率")) {
      result.castData = parseShimeiSheet(data, result.castData, config.shimei);
    } else if (sheetName.includes("リピート率")) {
      result.castData = parseRepeatRateSheet(
        data,
        result.castData,
        config.repeatRate,
      );
    } else if (sheetName.includes("稼働率")) {
      result.castData = parseRateSheet(
        data,
        result.castData,
        config.utilization,
        "utilizationRate",
      );
    } else if (sheetName.includes("欠勤率")) {
      result.castData = parseRateSheet(
        data,
        result.castData,
        config.absence,
        "absenceRate",
      );
    } else if (sheetName.includes("遅刻率")) {
      result.castData = parseRateSheet(
        data,
        result.castData,
        config.late,
        "lateRate",
      );
    } else if (sheetName.includes("延長率")) {
      result.castData = parseRateSheet(
        data,
        result.castData,
        config.extension,
        "extensionRate",
      );
    }
  });

  return result;
}

function parseSalesSheet(
  data: any[][],
  cfg: SheetColumnConfig,
): ParsedData["salesData"] {
  const result: ParsedData["salesData"] = [];
  const c = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row[c.date] === undefined) continue;

    const dateValue = row[c.date];
    let date: Date | null = null;

    if (typeof dateValue === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateValue);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        date = new Date(parsed.y, parsed.m - 1, parsed.d);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === "string") {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (!date) continue;

    result.push({
      date,
      sales: Number(row[c.sales]) || 0,
      expenses: Number(row[c.expenses]) || 0,
      profit: Number(row[c.profit]) || 0,
    });
  }

  return result;
}

function parseCastSalesSheet(
  data: any[][],
  existing: ParsedData["castData"],
  cfg: SheetColumnConfig,
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;

    const name = String(row[col.name]).trim();
    if (name.includes("合計")) continue;
    const sales = Number(row[col.sales]) || 0;

    if (!castMap.has(name)) {
      castMap.set(name, {
        name,
        sales: 0,
        honShimei: 0,
        photoShimei: 0,
        staffRecommend: 0,
        repeatRate: 0,
        utilizationRate: 0,
        absenceRate: 0,
        lateRate: 0,
        extensionRate: 0,
        totalCustomers: 0,
        repeatCustomers: 0,
      });
    }

    const cast = castMap.get(name)!;
    cast.sales = sales;
  }

  return Array.from(castMap.values());
}

function parseShimeiSheet(
  data: any[][],
  existing: ParsedData["castData"],
  cfg: SheetColumnConfig,
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;

    const name = String(row[col.name]).trim();
    if (name.includes("合計")) continue;

    if (!castMap.has(name)) {
      castMap.set(name, {
        name,
        sales: 0,
        honShimei: 0,
        photoShimei: 0,
        staffRecommend: 0,
        repeatRate: 0,
        utilizationRate: 0,
        absenceRate: 0,
        lateRate: 0,
        extensionRate: 0,
        totalCustomers: 0,
        repeatCustomers: 0,
      });
    }

    const cast = castMap.get(name)!;
    cast.staffRecommend = Number(row[col.staffRecommend]) || 0;
    cast.photoShimei =
      (Number(row[col.photoNew]) || 0) + (Number(row[col.photoMember]) || 0);
    cast.honShimei = Number(row[col.honShimei]) || 0;
  }

  return Array.from(castMap.values());
}

function parseRepeatRateSheet(
  data: any[][],
  existing: ParsedData["castData"],
  cfg: SheetColumnConfig,
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;

    const name = String(row[col.name]).trim();
    if (name.includes("合計")) continue;

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.totalCustomers = Number(row[col.totalCustomers]) || 0;
      cast.repeatCustomers = Number(row[col.repeatCustomers]) || 0;
      cast.repeatRate = Number(row[col.repeatRate]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Generic rate sheet parser (utilization, absence, late, extension)
function parseRateSheet(
  data: any[][],
  existing: ParsedData["castData"],
  cfg: SheetColumnConfig,
  field: "utilizationRate" | "absenceRate" | "lateRate" | "extensionRate",
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;

    const name = String(row[col.name]).trim();
    if (name.includes("合計")) continue;

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast[field] = Number(row[col.rate]) || 0;
    }
  }

  return Array.from(castMap.values());
}

function parseServiceSheet(
  data: any[][],
  cfg: SheetColumnConfig,
): ParsedData["serviceData"] {
  const result: ParsedData["serviceData"] = [];
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;

    result.push({
      name: String(row[col.name]).trim(),
      sales: Number(row[col.sales]) || 0,
    });
  }

  return result;
}

function parseHourlySheet(
  data: any[][],
  cfg: SheetColumnConfig,
): ParsedData["hourlyData"] {
  const result: ParsedData["hourlyData"] = [];
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row[col.hour] === undefined) continue;

    const hourStr = String(row[col.hour]).replace("時", "");
    const hour = parseInt(hourStr, 10);

    if (isNaN(hour)) continue;

    result.push({
      hour,
      count: Number(row[col.count]) || 0,
      castCount: Number(row[col.castCount]) || 0,
      utilizationRate: Number(row[col.rate]) || 0,
    });
  }

  return result;
}

function parseMediaSheet(
  data: any[][],
  cfg: SheetColumnConfig,
): ParsedData["mediaData"] {
  const result: ParsedData["mediaData"] = [];
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.name]) continue;
    if (String(row[col.name]).includes("合計")) continue;

    result.push({
      name: String(row[col.name]).trim(),
      sales: Number(row[col.sales]) || 0,
      percentage: Number(row[col.percentage]) || 0,
      count: Number(row[col.count]) || 0,
    });
  }

  return result;
}

function parseCustomerSegmentSheet(
  data: any[][],
  cfg: SheetColumnConfig,
): ParsedData["customerSegment"] {
  const result: ParsedData["customerSegment"] = [];
  const col = cfg.columns;

  for (let i = cfg.startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col.segment]) continue;
    if (String(row[col.segment]).includes("合計")) continue;

    result.push({
      segment: String(row[col.segment]).trim(),
      percentage: Number(row[col.percentage]) || 0,
      count: Number(row[col.count]) || 0,
    });
  }

  return result;
}

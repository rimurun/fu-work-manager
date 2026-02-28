import * as XLSX from "xlsx";

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

export function parseExcelFile(buffer: Buffer): ParsedData {
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
      result.salesData = parseSalesSheet(data);
    } else if (sheetName.includes("コンパニオン別売上")) {
      result.castData = parseCastSalesSheet(data, result.castData);
    } else if (sheetName.includes("サービス別")) {
      result.serviceData = parseServiceSheet(data);
    } else if (sheetName.includes("時間帯別")) {
      result.hourlyData = parseHourlySheet(data);
    } else if (sheetName.includes("媒体")) {
      result.mediaData = parseMediaSheet(data);
    } else if (sheetName.includes("顧客区分")) {
      result.customerSegment = parseCustomerSegmentSheet(data);
    } else if (sheetName.includes("指名集計表") && !sheetName.includes("率")) {
      result.castData = parseShimeiSheet(data, result.castData);
    } else if (sheetName.includes("リピート率")) {
      result.castData = parseRepeatRateSheet(data, result.castData);
    } else if (sheetName.includes("稼働率")) {
      result.castData = parseUtilizationSheet(data, result.castData);
    } else if (sheetName.includes("欠勤率")) {
      result.castData = parseAbsenceSheet(data, result.castData);
    } else if (sheetName.includes("遅刻率")) {
      result.castData = parseLateSheet(data, result.castData);
    } else if (sheetName.includes("延長率")) {
      result.castData = parseExtensionSheet(data, result.castData);
    }
  });

  return result;
}

// Excel layout:
// Row 0: ["日付","売上[円]","支出[円]","粗利[円]"]
// Row 1+: [excelDate, sales, expenses, profit]
function parseSalesSheet(data: any[][]): ParsedData["salesData"] {
  const result: ParsedData["salesData"] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row[0] === undefined) continue;

    const dateValue = row[0];
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
      sales: Number(row[1]) || 0,
      expenses: Number(row[2]) || 0,
      profit: Number(row[3]) || 0,
    });
  }

  return result;
}

// Excel layout:
// Row 0: ["コンパニオン","売上[円]"]
// Row 1+: [name, sales]
function parseCastSalesSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();
    const sales = Number(row[1]) || 0;

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

// Excel layout:
// Row 0: ["コンパニオン","フリー(新規)","写真指名(新規)","---","フリー(会員)","スタッフオススメ(会員)","写真指名(会員)","本指名(会員)","---","延長","指名合計","フリー本数","売上本数"]
// Row 1+: [name, freeNew, photoNew, sep, freeMember, staffRec, photoMember, honShimei, sep, extension, total, freeCount, salesCount]
function parseShimeiSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

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
    cast.staffRecommend = Number(row[5]) || 0; // スタッフオススメ(会員)
    cast.photoShimei = (Number(row[2]) || 0) + (Number(row[6]) || 0); // 写真指名(新規) + 写真指名(会員)
    cast.honShimei = Number(row[7]) || 0; // 本指名(会員)
  }

  return Array.from(castMap.values());
}

// Excel layout (2-row header):
// Row 0: ["店舗：xxx"]
// Row 1: ["コンパニオン","客数[人]（全期間）","リピート数[人]（全期間）","リピート数[人]（指定期間内）","リピート率[%]（全期間）","リピート率[%]（指定期間内）"]
// Row 2+: [name, totalCustomers, repeatAll, repeatPeriod, repeatRateAll, repeatRatePeriod]
function parseRepeatRateSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.totalCustomers = Number(row[1]) || 0;
      cast.repeatCustomers = Number(row[2]) || 0;
      cast.repeatRate = Number(row[4]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Excel layout (2-row header):
// Row 0: ["店舗：xxx"]
// Row 1: ["コンパニオン","接客時間[分]","出勤時間[分]","稼働率[%]"]
// Row 2+: [name, serviceTime, workTime, utilizationRate]
function parseUtilizationSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.utilizationRate = Number(row[3]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Excel layout (2-row header):
// Row 0: ["店舗：xxx"]
// Row 1: ["コンパニオン","欠勤日数[日]","シフト日数[日]","欠勤率[%]"]
// Row 2+: [name, absenceDays, shiftDays, absenceRate]
function parseAbsenceSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.absenceRate = Number(row[3]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Excel layout (2-row header):
// Row 0: ["店舗：xxx"]
// Row 1: ["コンパニオン","遅刻日数[日]","シフト日数[日]","遅刻率[%]"]
// Row 2+: [name, lateDays, shiftDays, lateRate]
function parseLateSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.lateRate = Number(row[3]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Excel layout (2-row header):
// Row 0: ["店舗：xxx"]
// Row 1: ["コンパニオン","延長本数","売上本数","延長率[%]"]
// Row 2+: [name, extensionCount, salesCount, extensionRate]
function parseExtensionSheet(
  data: any[][],
  existing: ParsedData["castData"],
): ParsedData["castData"] {
  const castMap = new Map(existing.map((c) => [c.name, c]));

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();

    if (castMap.has(name)) {
      const cast = castMap.get(name)!;
      cast.extensionRate = Number(row[3]) || 0;
    }
  }

  return Array.from(castMap.values());
}

// Excel layout:
// Row 0: ["サービス","売上[円]"]
// Row 1+: [name, sales]
function parseServiceSheet(data: any[][]): ParsedData["serviceData"] {
  const result: ParsedData["serviceData"] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    result.push({
      name: String(row[0]).trim(),
      sales: Number(row[1]) || 0,
    });
  }

  return result;
}

// Excel layout:
// Row 0: ["時間帯","売上[件数]","ｺﾝﾊﾟﾆｵﾝ出勤[人]","稼働率[%]"]
// Row 1+: ["5時", count, castCount, utilizationRate]
function parseHourlySheet(data: any[][]): ParsedData["hourlyData"] {
  const result: ParsedData["hourlyData"] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row[0] === undefined) continue;

    const hourStr = String(row[0]).replace("時", "");
    const hour = parseInt(hourStr, 10);

    if (isNaN(hour)) continue;

    result.push({
      hour,
      count: Number(row[1]) || 0,
      castCount: Number(row[2]) || 0,
      utilizationRate: Number(row[3]) || 0,
    });
  }

  return result;
}

// Excel layout:
// Row 0: ["媒体","売上[円]","内訳[%]","内訳[人]","合計[人]"]
// Row 1+: [name, sales, percentage, count, total]
function parseMediaSheet(data: any[][]): ParsedData["mediaData"] {
  const result: ParsedData["mediaData"] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    if (String(row[0]).includes("合計")) continue;

    result.push({
      name: String(row[0]).trim(),
      sales: Number(row[1]) || 0,
      percentage: Number(row[2]) || 0,
      count: Number(row[3]) || 0,
    });
  }

  return result;
}

// Excel layout:
// Row 0: ["顧客区分","内訳[%]","内訳[人]","合計[人]"]
// Row 1+: [segment, percentage, count, total]
function parseCustomerSegmentSheet(
  data: any[][],
): ParsedData["customerSegment"] {
  const result: ParsedData["customerSegment"] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    if (String(row[0]).includes("合計")) continue;

    result.push({
      segment: String(row[0]).trim(),
      percentage: Number(row[1]) || 0,
      count: Number(row[2]) || 0,
    });
  }

  return result;
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const store = searchParams.get("store");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!store) {
      return NextResponse.json(
        { message: "店舗IDが必要です" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: Record<string, unknown> = { store };
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);

    const reports = await MonthlyReport.find(query)
      .sort({ year: -1, month: -1 })
      .lean();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Data fetch error:", error);
    return NextResponse.json(
      { message: "データ取得に失敗しました", error: String(error) },
      { status: 500 }
    );
  }
}

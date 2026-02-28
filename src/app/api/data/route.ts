import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userStoreIds = (session?.user as any)?.storeIds as
      | string[]
      | undefined;

    const searchParams = request.nextUrl.searchParams;
    const store = searchParams.get("store");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!store) {
      return NextResponse.json(
        { message: "店舗IDが必要です" },
        { status: 400 },
      );
    }

    // Store role can only access own store data
    if (userRole === "store" && !userStoreIds?.includes(store)) {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
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
      { status: 500 },
    );
  }
}

// DELETE /api/data - Delete monthly report (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const store = searchParams.get("store");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!store || !year || !month) {
      return NextResponse.json(
        { message: "store, year, month は必須です" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const result = await MonthlyReport.findOneAndDelete({
      store,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
    });

    if (!result) {
      return NextResponse.json(
        { message: "データが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("Data delete error:", error);
    return NextResponse.json(
      { message: "削除に失敗しました" },
      { status: 500 },
    );
  }
}

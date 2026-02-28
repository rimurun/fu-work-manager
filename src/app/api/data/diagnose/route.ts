import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport, Store, User } from "@/lib/models";

// GET /api/data/diagnose - Show store ID mapping between MonthlyReport and Store collections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
      );
    }

    await connectToDatabase();

    // Get all unique store values from MonthlyReport
    const reportStores: string[] = await MonthlyReport.distinct("store");

    // Get all reports grouped by store
    const reportSummary = await MonthlyReport.aggregate([
      {
        $group: {
          _id: "$store",
          count: { $sum: 1 },
          months: {
            $push: { year: "$year", month: "$month" },
          },
        },
      },
    ]);

    // Get all stores from Store collection
    const stores = await Store.find().lean();
    const storeMap = stores.map((s) => ({
      storeId: (s as any).storeId,
      name: (s as any).name,
    }));

    // Find orphaned report store IDs (not matching any Store)
    const storeIds = new Set(storeMap.map((s) => s.storeId));
    const orphaned = reportStores.filter((rs) => !storeIds.has(rs));

    // Get user storeIds assignments
    const users = await User.find(
      {},
      { username: 1, role: 1, storeIds: 1 },
    ).lean();
    const userInfo = users.map((u: any) => ({
      username: u.username,
      role: u.role,
      storeIds: u.storeIds,
    }));

    return NextResponse.json({
      reportStores: reportSummary.map((r) => ({
        storeId: r._id,
        reportCount: r.count,
        months: r.months,
      })),
      dbStores: storeMap,
      orphanedReportStores: orphaned,
      users: userInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "診断に失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

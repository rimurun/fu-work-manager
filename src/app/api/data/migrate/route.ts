import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport, Store } from "@/lib/models";

// POST /api/data/migrate - Remap orphaned MonthlyReport store IDs to current Store IDs
// Body: { mapping: { "oldStoreId": "newStoreId", ... } }
// Or: { auto: true } to auto-match by name similarity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
      );
    }

    await connectToDatabase();
    const body = await request.json();

    if (body.auto) {
      // Auto-migrate: match old default IDs to current Store entries by name keywords
      const stores = await Store.find().lean();
      const reportStoreIds: string[] = await MonthlyReport.distinct("store");
      const storeIds = new Set(stores.map((s: any) => s.storeId));
      const orphaned = reportStoreIds.filter((rs) => !storeIds.has(rs));

      // Keyword mapping for default store IDs
      const KEYWORD_MAP: Record<string, string[]> = {
        omiya: ["大宮"],
        nishikawaguchi: ["西川口"],
        nagoya: ["名古屋"],
        store4: ["店舗4"],
        store5: ["店舗5"],
      };

      const results: { from: string; to: string; count: number }[] = [];

      for (const oldId of orphaned) {
        const keywords = KEYWORD_MAP[oldId];
        if (!keywords) continue;

        // Find matching store by name keywords
        const match = stores.find((s: any) =>
          keywords.some((kw) => s.name.includes(kw)),
        );
        if (!match) continue;

        const newId = (match as any).storeId;
        if (oldId === newId) continue;

        // Check if target already has data for same year/month
        const oldReports = await MonthlyReport.find({ store: oldId }).lean();
        let migratedCount = 0;

        for (const report of oldReports) {
          const r = report as any;
          const existing = await MonthlyReport.findOne({
            store: newId,
            year: r.year,
            month: r.month,
          });

          if (existing) {
            // Target already has data for this month, skip (don't overwrite)
            continue;
          }

          await MonthlyReport.updateOne(
            { _id: r._id },
            { $set: { store: newId } },
          );
          migratedCount++;
        }

        results.push({ from: oldId, to: newId, count: migratedCount });
      }

      return NextResponse.json({
        message: "自動マイグレーション完了",
        results,
      });
    }

    // Manual mapping
    const mapping = body.mapping as Record<string, string>;
    if (!mapping || typeof mapping !== "object") {
      return NextResponse.json(
        { message: "mapping は必須です" },
        { status: 400 },
      );
    }

    const results: { from: string; to: string; count: number }[] = [];

    for (const [oldId, newId] of Object.entries(mapping)) {
      const result = await MonthlyReport.updateMany(
        { store: oldId },
        { $set: { store: newId } },
      );
      results.push({
        from: oldId,
        to: newId,
        count: result.modifiedCount,
      });
    }

    return NextResponse.json({
      message: "マイグレーション完了",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "マイグレーションに失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

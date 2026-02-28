import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport, ParseConfig } from "@/lib/models";
import { parseExcelFile, DEFAULT_PARSE_CONFIG } from "@/lib/parseExcel";
import type { ParseConfig as ParseConfigType } from "@/lib/parseExcel";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userStoreIds = (session?.user as any)?.storeIds as
      | string[]
      | undefined;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const store = formData.get("store") as string;
    const year = parseInt(formData.get("year") as string, 10);
    const month = parseInt(formData.get("month") as string, 10);

    if (!file || !store || !year || !month) {
      return NextResponse.json(
        { message: "必須パラメータが不足しています" },
        { status: 400 },
      );
    }

    // Store role can only upload to their own store
    if (userRole === "store" && !userStoreIds?.includes(store)) {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Connect to MongoDB
    await connectToDatabase();

    // Fetch store-specific parse config
    const configDoc = await ParseConfig.findOne({ storeId: store }).lean();
    const parseConfig: ParseConfigType = configDoc
      ? (configDoc as any).config
      : DEFAULT_PARSE_CONFIG;

    // Parse Excel with store-specific config
    const parsedData = parseExcelFile(buffer, parseConfig);

    // Upsert report (use $set explicitly to avoid replacing other documents)
    await MonthlyReport.findOneAndUpdate(
      { store, year, month },
      {
        $set: {
          store,
          year,
          month,
          uploadedAt: new Date(),
          ...parsedData,
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      message: "アップロード成功",
      data: {
        store,
        year,
        month,
        salesCount: parsedData.salesData.length,
        castCount: parsedData.castData.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "アップロードに失敗しました", error: String(error) },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyReport } from "@/lib/models";
import { parseExcelFile } from "@/lib/parseExcel";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const store = formData.get("store") as string;
    const year = parseInt(formData.get("year") as string, 10);
    const month = parseInt(formData.get("month") as string, 10);

    if (!file || !store || !year || !month) {
      return NextResponse.json(
        { message: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel
    const parsedData = parseExcelFile(buffer);

    // Connect to MongoDB
    await connectToDatabase();

    // Upsert report
    await MonthlyReport.findOneAndUpdate(
      { store, year, month },
      {
        store,
        year,
        month,
        uploadedAt: new Date(),
        ...parsedData,
      },
      { upsert: true, new: true }
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
      { status: 500 }
    );
  }
}

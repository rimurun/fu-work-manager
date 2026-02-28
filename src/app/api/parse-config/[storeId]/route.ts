import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParseConfig } from "@/lib/models";
import { DEFAULT_PARSE_CONFIG } from "@/lib/parseExcel";

// GET /api/parse-config/[storeId]
export async function GET(
  _request: Request,
  { params }: { params: { storeId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "権限がありません" }, { status: 403 });
    }

    await connectToDatabase();
    const doc = await ParseConfig.findOne({ storeId: params.storeId }).lean();

    return NextResponse.json({
      storeId: params.storeId,
      config: doc ? (doc as any).config : DEFAULT_PARSE_CONFIG,
      isDefault: !doc,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "設定の取得に失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

// PUT /api/parse-config/[storeId]
export async function PUT(
  request: Request,
  { params }: { params: { storeId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "権限がありません" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const config = body.config;

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { message: "config は必須です" },
        { status: 400 },
      );
    }

    await ParseConfig.findOneAndUpdate(
      { storeId: params.storeId },
      { $set: { config } },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      storeId: params.storeId,
      config,
      message: "設定を保存しました",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "設定の保存に失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

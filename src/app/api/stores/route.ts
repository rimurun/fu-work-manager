import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Store } from "@/lib/models";
import { DEFAULT_STORES } from "@/lib/stores";

// GET /api/stores - List all stores
export async function GET() {
  try {
    await connectToDatabase();
    let stores = await Store.find().sort({ storeId: 1 }).lean();

    // Seed default stores if none exist
    if (stores.length === 0) {
      await Store.insertMany(
        DEFAULT_STORES.map((s) => ({ storeId: s.id, name: s.name })),
      );
      stores = await Store.find().sort({ storeId: 1 }).lean();
    }

    return NextResponse.json({
      stores: stores.map((s) => ({ id: s.storeId, name: s.name })),
    });
  } catch (error) {
    console.error("Store fetch error:", error);
    return NextResponse.json(
      { message: "店舗データの取得に失敗しました" },
      { status: 500 },
    );
  }
}

// POST /api/stores - Create a new store
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { message: "店舗IDと名前は必須です" },
        { status: 400 },
      );
    }

    const existing = await Store.findOne({ storeId: id });
    if (existing) {
      return NextResponse.json(
        { message: "この店舗IDは既に使用されています" },
        { status: 409 },
      );
    }

    await Store.create({ storeId: id, name });
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (error) {
    console.error("Store create error:", error);
    return NextResponse.json(
      { message: "店舗の作成に失敗しました" },
      { status: 500 },
    );
  }
}

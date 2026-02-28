import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Store } from "@/lib/models";

// PUT /api/stores/[id] - Update store name
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "店舗名は必須です" },
        { status: 400 },
      );
    }

    const store = await Store.findOneAndUpdate(
      { storeId: params.id },
      { name },
      { new: true },
    );

    if (!store) {
      return NextResponse.json(
        { message: "店舗が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ id: store.storeId, name: store.name });
  } catch (error) {
    console.error("Store update error:", error);
    return NextResponse.json(
      { message: "店舗の更新に失敗しました" },
      { status: 500 },
    );
  }
}

// DELETE /api/stores/[id] - Delete a store
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();
    const store = await Store.findOneAndDelete({ storeId: params.id });

    if (!store) {
      return NextResponse.json(
        { message: "店舗が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("Store delete error:", error);
    return NextResponse.json(
      { message: "店舗の削除に失敗しました" },
      { status: 500 },
    );
  }
}

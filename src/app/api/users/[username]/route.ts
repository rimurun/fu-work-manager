import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

// PUT /api/users/[username] - Update user storeIds (admin only)
export async function PUT(
  request: Request,
  { params }: { params: { username: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { message: "権限がありません" },
        { status: 403 },
      );
    }

    await connectToDatabase();
    const { storeIds } = await request.json();

    if (!Array.isArray(storeIds)) {
      return NextResponse.json(
        { message: "storeIds は配列で指定してください" },
        { status: 400 },
      );
    }

    const user = await User.findOneAndUpdate(
      { username: params.username },
      { $set: { storeIds } },
      { new: true },
    ).select("username role storeIds");

    if (!user) {
      return NextResponse.json(
        { message: "ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      username: user.username,
      role: user.role,
      storeIds: user.storeIds,
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { message: "ユーザーの更新に失敗しました" },
      { status: 500 },
    );
  }
}

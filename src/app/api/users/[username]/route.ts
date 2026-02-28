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
    const body = await request.json();
    const storeIds = body.storeIds;

    if (!Array.isArray(storeIds)) {
      return NextResponse.json(
        { message: "storeIds は配列で指定してください" },
        { status: 400 },
      );
    }

    // Use updateOne for explicit control
    const result = await User.updateOne(
      { username: params.username },
      { $set: { storeIds } },
    );

    console.log(
      `[USER UPDATE] ${params.username}: storeIds=${JSON.stringify(storeIds)}, matched=${result.matchedCount}, modified=${result.modifiedCount}`,
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    // Read back from DB to confirm
    const updated = await User.findOne({ username: params.username })
      .select("username role storeIds")
      .lean();

    console.log(
      `[USER UPDATE CONFIRM] ${params.username}: storeIds=${JSON.stringify((updated as any)?.storeIds)}`,
    );

    return NextResponse.json({
      username: (updated as any).username,
      role: (updated as any).role,
      storeIds: (updated as any).storeIds,
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { message: "ユーザーの更新に失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

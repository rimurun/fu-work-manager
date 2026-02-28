import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

export const dynamic = "force-dynamic";

// GET /api/users - List all users (admin only)
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
    const users = await User.find()
      .select("username role storeIds")
      .sort({ role: 1, username: 1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User list error:", error);
    return NextResponse.json(
      { message: "ユーザー一覧の取得に失敗しました" },
      { status: 500 },
    );
  }
}

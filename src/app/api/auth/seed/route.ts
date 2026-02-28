import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

export const dynamic = "force-dynamic";

const SEED_ACCOUNTS = [
  {
    username: "admin",
    password: "fumanager2026",
    role: "admin" as const,
    storeIds: [] as string[],
  },
  {
    username: "omiya",
    password: "omiya2026",
    role: "store" as const,
    storeIds: ["omiya"],
  },
  {
    username: "nishikawaguchi",
    password: "nishi2026",
    role: "store" as const,
    storeIds: ["nishikawaguchi"],
  },
  {
    username: "nagoya",
    password: "nagoya2026",
    role: "store" as const,
    storeIds: ["nagoya"],
  },
];

export async function GET() {
  try {
    await connectToDatabase();
    const created: string[] = [];
    const skipped: string[] = [];

    for (const account of SEED_ACCOUNTS) {
      const existing = await User.findOne({ username: account.username });
      if (existing) {
        skipped.push(account.username);
        continue;
      }
      const hashedPassword = await hash(account.password, 12);
      await User.create({
        username: account.username,
        password: hashedPassword,
        role: account.role,
        storeIds: account.storeIds,
      });
      created.push(account.username);
    }

    return NextResponse.json({ created, skipped });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { message: "シード処理に失敗しました" },
      { status: 500 },
    );
  }
}

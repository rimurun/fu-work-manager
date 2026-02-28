import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Store, ParseConfig } from "@/lib/models";
import { DEFAULT_PARSE_CONFIG } from "@/lib/parseExcel";
import type { ParseConfig as ParseConfigType } from "@/lib/parseExcel";

// Shimei column patterns per store type
const SHIMEI_OMIYA = {
  startRow: 1,
  columns: { name: 0, staffRecommend: 1, photoMember: 2, honShimei: 3, photoNew: 5 },
};

const SHIMEI_NISHIKAWA_PUYO = {
  startRow: 1,
  columns: { name: 0, photoNew: 2, staffRecommend: 99, photoMember: 4, honShimei: 5 },
};

const SHIMEI_NAGOYA = {
  startRow: 1,
  columns: { name: 0, photoNew: 2, staffRecommend: 99, photoMember: 5, honShimei: 6 },
};

function getConfigForStore(storeName: string): ParseConfigType | null {
  const n = storeName;

  // Both 大宮 stores (ぷよステ & 最終章) share the same layout
  if (n.includes("大宮")) {
    return { ...DEFAULT_PARSE_CONFIG, shimei: SHIMEI_OMIYA };
  }

  // 西川口ぷよステ has no staffRecommend, different column order
  if (n.includes("西川口") && n.includes("ぷよ")) {
    return { ...DEFAULT_PARSE_CONFIG, shimei: SHIMEI_NISHIKAWA_PUYO };
  }

  // 名古屋 has no staffRecommend, slightly different column order
  if (n.includes("名古屋")) {
    return { ...DEFAULT_PARSE_CONFIG, shimei: SHIMEI_NAGOYA };
  }

  // 西川口最終章 = default config, no override needed
  return null;
}

// GET /api/parse-config/seed
export async function GET() {
  try {
    await connectToDatabase();
    const stores = await Store.find().lean();
    const results: { storeId: string; name: string; action: string }[] = [];

    for (const store of stores) {
      const name = (store as any).name;
      const storeId = (store as any).storeId;
      const config = getConfigForStore(name);

      if (config) {
        await ParseConfig.findOneAndUpdate(
          { storeId },
          { $set: { config } },
          { upsert: true },
        );
        results.push({ storeId, name, action: "custom config set" });
      } else {
        // Remove any custom config, will use default
        await ParseConfig.deleteOne({ storeId });
        results.push({ storeId, name, action: "using default" });
      }
    }

    return NextResponse.json({
      message: "パース設定を初期化しました",
      stores: results,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "初期化に失敗しました: " + String(error) },
      { status: 500 },
    );
  }
}

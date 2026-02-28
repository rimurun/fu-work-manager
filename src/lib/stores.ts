export type Store = {
  id: string;
  name: string;
};

// Default stores (used for initial seeding)
export const DEFAULT_STORES: Store[] = [
  { id: "omiya", name: "大宮" },
  { id: "nishikawaguchi", name: "西川口" },
  { id: "nagoya", name: "名古屋" },
  { id: "store4", name: "店舗4" },
  { id: "store5", name: "店舗5" },
];

// Kept for backward compatibility during loading
export const STORES: Store[] = DEFAULT_STORES;

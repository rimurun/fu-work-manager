import mongoose, { Schema, Document } from "mongoose";

// Monthly Report Schema
export interface IMonthlyReport extends Document {
  store: string;
  year: number;
  month: number;
  uploadedAt: Date;
  salesData: {
    date: Date;
    sales: number;
    expenses: number;
    profit: number;
  }[];
  castData: {
    name: string;
    sales: number;
    honShimei: number;
    photoShimei: number;
    staffRecommend: number;
    repeatRate: number;
    utilizationRate: number;
    absenceRate: number;
    lateRate: number;
    extensionRate: number;
    totalCustomers: number;
    repeatCustomers: number;
  }[];
  serviceData: {
    name: string;
    sales: number;
  }[];
  hourlyData: {
    hour: number;
    count: number;
    castCount: number;
    utilizationRate: number;
  }[];
  mediaData: {
    name: string;
    sales: number;
    count: number;
    percentage: number;
  }[];
  customerSegment: {
    segment: string;
    count: number;
    percentage: number;
  }[];
}

const MonthlyReportSchema = new Schema<IMonthlyReport>({
  store: { type: String, required: true, index: true },
  year: { type: Number, required: true, index: true },
  month: { type: Number, required: true, index: true },
  uploadedAt: { type: Date, default: Date.now },
  salesData: [
    {
      date: Date,
      sales: Number,
      expenses: Number,
      profit: Number,
    },
  ],
  castData: [
    {
      name: String,
      sales: Number,
      honShimei: Number,
      photoShimei: Number,
      staffRecommend: Number,
      repeatRate: Number,
      utilizationRate: Number,
      absenceRate: Number,
      lateRate: Number,
      extensionRate: Number,
      totalCustomers: Number,
      repeatCustomers: Number,
    },
  ],
  serviceData: [
    {
      name: String,
      sales: Number,
    },
  ],
  hourlyData: [
    {
      hour: Number,
      count: Number,
      castCount: Number,
      utilizationRate: Number,
    },
  ],
  mediaData: [
    {
      name: String,
      sales: Number,
      count: Number,
      percentage: Number,
    },
  ],
  customerSegment: [
    {
      segment: String,
      count: Number,
      percentage: Number,
    },
  ],
});

// Compound unique index
MonthlyReportSchema.index({ store: 1, year: 1, month: 1 }, { unique: true });

export const MonthlyReport =
  mongoose.models.MonthlyReport ||
  mongoose.model<IMonthlyReport>("MonthlyReport", MonthlyReportSchema);

// Store Schema
export interface IStore extends Document {
  storeId: string;
  name: string;
}

const StoreSchema = new Schema<IStore>({
  storeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

export const Store =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

// User Schema
export interface IUser extends Document {
  username: string;
  password: string;
  role: "admin" | "store";
  storeIds: string[];
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "store"], required: true },
  storeIds: [{ type: String }],
});

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Parse Config Schema (per-store Excel column mappings)
export interface IParseConfig extends Document {
  storeId: string;
  config: Record<string, any>;
}

const ParseConfigSchema = new Schema<IParseConfig>({
  storeId: { type: String, required: true, unique: true },
  config: { type: Schema.Types.Mixed, required: true },
});

export const ParseConfig =
  mongoose.models.ParseConfig ||
  mongoose.model<IParseConfig>("ParseConfig", ParseConfigSchema);

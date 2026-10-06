import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import DiscountSetting from "@/models/DiscountSetting";
import { DISCOUNT_TYPES } from "@/lib/discount";
import { getDiscountSetting } from "@/lib/todaysOffer";

// Today's discount settings (see models/DiscountSetting.ts).
//
//   GET    public: { todaysDiscount } — what the offer popup shows.
//          With the admin key: also actualDiscount, isDefault, updatedAt.
//   POST   admin: create the setting (both discounts required)
//   PATCH  admin: change either or both discounts
//
// Admin calls send the header  x-admin-key: <DISCOUNT_ADMIN_KEY>.

export const dynamic = "force-dynamic";

const ADMIN_HEADER = "x-admin-key";

const discountSchema = z
  .object({
    type: z.enum(DISCOUNT_TYPES),
    value: z.number().finite().min(0),
  })
  .refine((d) => d.type !== "percent" || d.value <= 100, { message: "A percent discount can't be more than 100" });

const createSchema = z.object({ todaysDiscount: discountSchema, actualDiscount: discountSchema });
const patchSchema = z
  .object({ todaysDiscount: discountSchema.optional(), actualDiscount: discountSchema.optional() })
  .refine((d) => d.todaysDiscount || d.actualDiscount, { message: "Send todaysDiscount and/or actualDiscount" });

function isAdmin(request: Request) {
  const expected = process.env.DISCOUNT_ADMIN_KEY;
  const given = request.headers.get(ADMIN_HEADER);
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireAdmin(request: Request) {
  if (!process.env.DISCOUNT_ADMIN_KEY) {
    return NextResponse.json({ error: "DISCOUNT_ADMIN_KEY is not configured on the server" }, { status: 503 });
  }
  if (!isAdmin(request)) {
    return NextResponse.json({ error: `Missing or wrong ${ADMIN_HEADER} header` }, { status: 401 });
  }
  return null;
}

async function readBody<T>(request: Request, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 }) };
  }
  return { data: parsed.data };
}

export async function GET(request: Request) {
  const setting = await getDiscountSetting();
  if (isAdmin(request)) return NextResponse.json(setting);
  return NextResponse.json({ todaysDiscount: setting.todaysDiscount });
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { data, error } = await readBody(request, createSchema);
  if (error) return error;

  await connectDB();
  if (await DiscountSetting.exists({ key: "current" })) {
    return NextResponse.json({ error: "Discount is already set — use PATCH to change it" }, { status: 409 });
  }
  await DiscountSetting.create({ key: "current", ...data });
  return NextResponse.json(await getDiscountSetting(), { status: 201 });
}

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { data, error } = await readBody(request, patchSchema);
  if (error) return error;

  await connectDB();
  const updated = await DiscountSetting.findOneAndUpdate({ key: "current" }, { $set: data }, { new: true });
  if (!updated) {
    return NextResponse.json({ error: "No discount set yet — create it with POST first" }, { status: 404 });
  }
  return NextResponse.json(await getDiscountSetting());
}

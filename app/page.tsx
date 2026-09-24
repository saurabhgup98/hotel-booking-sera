import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import HotelListClient from "./HotelListClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const hotels = await Hotel.find({}).lean<any[]>();

  return (
    <div className="space-y-8">
      <section className="space-y-2 py-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Find your next stay</h1>
        <p className="mx-auto max-w-md text-slate-500">
          Hand-picked hotels in top destinations, with easy booking and instant confirmation.
        </p>
      </section>

      <HotelListClient hotels={JSON.parse(JSON.stringify(hotels))} />
    </div>
  );
}

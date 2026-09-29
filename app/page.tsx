import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import { HERO_IMAGE } from "@/lib/constants";
import HotelListClient from "./HotelListClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const hotels = await Hotel.find({}).lean<any[]>();

  return (
    <div>
      <section className="relative h-[440px] overflow-hidden sm:h-[500px]">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 pb-16 text-white sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-white/85">SERA HOTELS AND RESORTS</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">Stays worth the journey</h1>
          <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">
            Handpicked hotels and resorts in top destinations, with easy booking and instant confirmation.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-20 max-w-6xl px-4 sm:px-6">
        <HotelListClient hotels={JSON.parse(JSON.stringify(hotels))} />
      </div>
    </div>
  );
}

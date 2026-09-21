import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import BookForm from "./BookForm";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({ params }: { params: { hotelId: string } }) {
  if (!mongoose.isValidObjectId(params.hotelId)) notFound();

  await connectDB();
  const hotel = await Hotel.findById(params.hotelId).lean<any>();
  if (!hotel) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hotel.name}</h1>
        <p className="text-gray-500">{hotel.city}</p>
        <p className="mt-2">{hotel.description}</p>
      </div>

      <div className="space-y-4">
        {hotel.roomTypes.map((rt: any, idx: number) => (
          <div key={rt._id.toString()} id={`room-type-${rt._id.toString()}`} className="rounded border bg-white p-4">
            <h2 className="font-semibold">{rt.name}</h2>
            <p className="text-sm text-gray-500">Up to {rt.capacity} guests</p>
            <p className="text-sm">{rt.description}</p>
            <p className="mt-1 font-medium">₹{rt.pricePerNight} / night</p>
            <BookForm hotelId={params.hotelId} roomTypeId={rt._id.toString()} isFirst={idx === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

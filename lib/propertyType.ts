import Hotel from "@/models/Hotel";
import { DEFAULT_PROPERTY_TYPE, type PropertyType } from "@/lib/constants";

// The property type of a booking's hotel, for the data-property-type markers
// on the review / payment / confirmation pages (APTI's SDK rules copy it into
// each event as property_category). Read from the hotel rather than stored on
// the booking, so bookings made before property types existed work too.
export async function getPropertyType(hotelId: unknown): Promise<PropertyType> {
  const hotel = await Hotel.findById(hotelId).select("propertyType").lean<{ propertyType?: PropertyType }>();
  return hotel?.propertyType ?? DEFAULT_PROPERTY_TYPE;
}

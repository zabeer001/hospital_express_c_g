import { prisma } from "../../../config/database.js";
import { toBookingResponse } from "../../../utils/response-mappers.js";
import { validateBooking } from "../../../validators/booking.validator.js";
import { bookingInclude } from "./utils/bookingInclude.util.js";
import { ensureBookingRelationsExist } from "./utils/ensureBookingRelations.util.js";

export async function createBookingService(body) {
  const data = await validateBooking(body);
  await ensureBookingRelationsExist(data);
  const booking = await prisma.booking.create({ data, include: bookingInclude });
  return toBookingResponse(booking);
}

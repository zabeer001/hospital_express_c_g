import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toBookingResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { bookingInclude } from "./utils/bookingInclude.util.js";

export async function getBookingService(id) {
  const bookingId = await validateId(id);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
  if (!booking) throw new ApiError(404, "Booking not found");
  return toBookingResponse(booking);
}

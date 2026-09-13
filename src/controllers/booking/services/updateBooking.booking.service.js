import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toBookingResponse } from "../../../utils/response-mappers.js";
import { validateBooking } from "../../../validators/booking.validator.js";
import { bookingInclude } from "./utils/bookingInclude.util.js";
import { ensureBookingRelationsExist } from "./utils/ensureBookingRelations.util.js";
import { getBookingService } from "./getBooking.booking.service.js";

export async function updateBookingService(id, body) {
  const existing = await getBookingService(id);
  const data = await validateBooking(body, { partial: true });
  if (!Object.keys(data).length) {
    throw new ApiError(422, "Provide at least one booking field to update");
  }
  await ensureBookingRelationsExist(data);
  const booking = await prisma.booking.update({
    where: { id: existing.id },
    data,
    include: bookingInclude,
  });
  return toBookingResponse(booking);
}

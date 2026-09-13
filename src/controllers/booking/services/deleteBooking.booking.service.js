import { prisma } from "../../../config/database.js";
import { getBookingService } from "./getBooking.booking.service.js";

export async function deleteBookingService(id) {
  const booking = await getBookingService(id);
  await prisma.booking.delete({ where: { id: booking.id } });
}

import { sendSuccess } from "../../utils/api-response.js";
import { createBookingService } from "./services/createBooking.booking.service.js";
import { deleteBookingService } from "./services/deleteBooking.booking.service.js";
import { getBookingService } from "./services/getBooking.booking.service.js";
import { getBookingsService } from "./services/getBookings.booking.service.js";
import { updateBookingService } from "./services/updateBooking.booking.service.js";

export async function getBookings(req, res) {
  const { data, meta } = await getBookingsService(req.query);
  return sendSuccess(res, { message: "Bookings retrieved successfully", data, meta });
}

export async function getBooking(req, res) {
  return sendSuccess(res, {
    message: "Booking retrieved successfully",
    data: await getBookingService(req.params.id),
  });
}

export async function createBooking(req, res) {
  return sendSuccess(res, {
    statusCode: 201,
    message: "Booking created successfully",
    data: await createBookingService(req.body),
  });
}

export async function updateBooking(req, res) {
  return sendSuccess(res, {
    message: "Booking updated successfully",
    data: await updateBookingService(req.params.id, req.body),
  });
}

export async function deleteBooking(req, res) {
  await deleteBookingService(req.params.id);
  return sendSuccess(res, { message: "Booking deleted successfully" });
}

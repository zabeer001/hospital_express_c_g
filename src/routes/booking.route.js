import express from "express";
import {
  createBooking,
  deleteBooking,
  getBooking,
  getBookings,
  updateBooking,
} from "../controllers/booking/booking.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("bookings.index"), getBookings);
router.post("/", authorize("bookings.create"), createBooking);
router.get("/:id", authorize("bookings.show"), getBooking);
router.patch("/:id", authorize("bookings.update"), updateBooking);
router.delete("/:id", authorize("bookings.delete"), deleteBooking);

export default router;

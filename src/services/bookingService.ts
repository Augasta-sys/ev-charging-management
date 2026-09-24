import api from "./api";
import type { Booking } from "../types";

export const getBookings = async (): Promise<Booking[]> => {
  const response = await api.get<Booking[]>("/bookings");
  return response.data;
};

export const getBookingById = async (
  id: string
): Promise<Booking> => {
  const response = await api.get<Booking>(`/bookings/${id}`);
  return response.data;
};

export const createBooking = async (
  booking: Booking
): Promise<Booking> => {
  const response = await api.post<Booking>("/bookings", booking);
  return response.data;
};

export const updateBooking = async (
  id: string,
  booking: Partial<Booking>
): Promise<Booking> => {
  const response = await api.patch<Booking>(
    `/bookings/${id}`,
    booking
  );

  return response.data;
};

export const deleteBooking = async (
  id: string
): Promise<void> => {
  await api.delete(`/bookings/${id}`);
};
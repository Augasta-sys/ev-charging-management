import api from "./api";
import type { Station } from "../types";

export const getStations = async (): Promise<Station[]> => {
  const response = await api.get<Station[]>("/stations");
  return response.data;
};

export const getStationById = async (
  id: string
): Promise<Station> => {
  const response = await api.get<Station>(`/stations/${id}`);
  return response.data;
};

export const createStation = async (
  station: Station
): Promise<Station> => {
  const response = await api.post<Station>("/stations", station);
  return response.data;
};

export const updateStation = async (
  id: string,
  station: Partial<Station>
): Promise<Station> => {
  const response = await api.patch<Station>(
    `/stations/${id}`,
    station
  );

  return response.data;
};

export const deleteStation = async (
  id: string
): Promise<void> => {
  await api.delete(`/stations/${id}`);
};
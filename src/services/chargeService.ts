import api from "./api";
import type { Charger } from "../types";

export const getChargers = async (): Promise<Charger[]> => {
  const response = await api.get<Charger[]>("/chargers");
  return response.data;
};

export const getChargerById = async (
  id: string
): Promise<Charger> => {
  const response = await api.get<Charger>(`/chargers/${id}`);
  return response.data;
};

export const createCharger = async (
  charger: Charger
): Promise<Charger> => {
  const response = await api.post<Charger>("/chargers", charger);
  return response.data;
};

export const updateCharger = async (
  id: string,
  charger: Partial<Charger>
): Promise<Charger> => {
  const response = await api.patch<Charger>(
    `/chargers/${id}`,
    charger
  );

  return response.data;
};

export const deleteCharger = async (
  id: string
): Promise<void> => {
  await api.delete(`/chargers/${id}`);
};
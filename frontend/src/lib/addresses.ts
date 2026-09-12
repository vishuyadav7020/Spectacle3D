import { api } from "./api";

export interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export type AddressInput = Omit<Address, "id">;

export async function listAddresses() {
  const { data } = await api.get<Address[]>("/users/addresses/");
  return data;
}

export async function addAddress(payload: Partial<AddressInput>) {
  const { data } = await api.post<Address>("/users/addresses/", payload);
  return data;
}

export async function updateAddress(id: string, payload: Partial<AddressInput>) {
  const { data } = await api.patch<Address>(`/users/addresses/${id}/`, payload);
  return data;
}

export async function deleteAddress(id: string) {
  await api.delete(`/users/addresses/${id}/`);
}

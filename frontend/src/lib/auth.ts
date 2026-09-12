import { api } from "./api";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "customer" | "admin";
  phone_number: string | null;
  profile_photo: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  status: "pending" | "verified" | "rejected";
  is_verified: boolean;
  is_active: boolean;
  addresses: unknown[];
  wishlist: string[];
  cart: string | null;
  last_login: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface TokenPair {
  access: string;
  refresh: string;
}

interface AuthResponse extends TokenPair {
  message: string;
  user: AuthUser;
}

export async function signUp(payload: {
  full_name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>("/users/signup/", payload);
  return data;
}

export async function signIn(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/users/signin/", payload);
  return data;
}

export async function logoutRequest(refresh: string) {
  await api.post("/users/logout/", { refresh });
}

export async function getMe() {
  const { data } = await api.get<AuthUser>("/users/me/");
  return data;
}

export async function updateMe(payload: Partial<AuthUser>) {
  const { data } = await api.patch<AuthUser>("/users/me/", payload);
  return data;
}

export async function deleteMe() {
  const { data } = await api.delete<{ message: string }>("/users/me/");
  return data;
}

export async function changePassword(payload: {
  old_password: string;
  new_password: string;
}) {
  const { data } = await api.post<{ message: string }>(
    "/users/me/change-password/",
    payload,
  );
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>(
    "/users/password/forgot/",
    { email },
  );
  return data;
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  new_password: string;
}) {
  const { data } = await api.post<{ message: string }>(
    "/users/password/reset/",
    payload,
  );
  return data;
}

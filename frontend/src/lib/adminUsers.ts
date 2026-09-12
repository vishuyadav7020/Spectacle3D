import { api } from "./api";
import type { AuthUser } from "./auth";

export interface UserListResponse {
  count: number;
  page: number;
  page_size: number;
  results: AuthUser[];
}

export interface UserListParams {
  role?: string;
  status?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export async function listUsers(params: UserListParams = {}) {
  const { data } = await api.get<UserListResponse>("/users/admin/", { params });
  return data;
}

export async function setUserActive(userId: string, is_active: boolean) {
  const { data } = await api.patch<AuthUser>(`/users/admin/${userId}/`, { is_active });
  return data;
}

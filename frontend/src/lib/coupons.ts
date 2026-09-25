import { api } from "./api";

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  value: number;
  max_discount_amount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  usage_limit_per_user: number;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponListResponse {
  count: number;
  page: number;
  page_size: number;
  results: Coupon[];
}

export interface CouponInput {
  code: string;
  description?: string;
  discount_type: DiscountType;
  value: number;
  max_discount_amount?: number | null;
  min_order_value?: number;
  usage_limit?: number | null;
  usage_limit_per_user?: number;
  valid_from?: string;
  valid_until?: string | null;
}

export interface CouponValidationResult {
  code: string;
  discount_amount: number;
  total_after_discount: number;
}

export async function validateCoupon(code: string, subtotal: number) {
  const { data } = await api.post<CouponValidationResult>("/coupons/validate/", {
    code,
    subtotal,
  });
  return data;
}

export async function listCoupons(
  params: { is_active?: boolean; search?: string; page?: number; page_size?: number } = {},
) {
  const { data } = await api.get<CouponListResponse>("/coupons/admin/", { params });
  return data;
}

export async function getCoupon(id: string) {
  const { data } = await api.get<Coupon>(`/coupons/admin/${id}/`);
  return data;
}

export async function createCoupon(payload: CouponInput) {
  const { data } = await api.post<Coupon>("/coupons/admin/", payload);
  return data;
}

export async function updateCoupon(id: string, payload: Partial<CouponInput> & { is_active?: boolean }) {
  const { data } = await api.patch<Coupon>(`/coupons/admin/${id}/`, payload);
  return data;
}

export async function deleteCoupon(id: string) {
  await api.delete(`/coupons/admin/${id}/`);
}

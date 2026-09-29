import { api } from "./api";

export const REVIEW_SORT_OPTIONS = ["newest", "oldest", "highest", "lowest"] as const;
export type ReviewSort = (typeof REVIEW_SORT_OPTIONS)[number];

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewListResponse {
  count: number;
  page: number;
  page_size: number;
  results: Review[];
}

export async function listReviews(
  productId: string,
  params: { sort?: ReviewSort; page?: number; page_size?: number } = {},
) {
  const { data } = await api.get<ReviewListResponse>(`/products/${productId}/reviews/`, { params });
  return data;
}

export async function createReview(productId: string, payload: { rating: number; comment: string }) {
  const { data } = await api.post<Review>(`/products/${productId}/reviews/`, payload);
  return data;
}

export async function updateReview(
  productId: string,
  reviewId: string,
  payload: Partial<{ rating: number; comment: string }>,
) {
  const { data } = await api.patch<Review>(`/products/${productId}/reviews/${reviewId}/`, payload);
  return data;
}

export async function deleteReview(productId: string, reviewId: string) {
  await api.delete(`/products/${productId}/reviews/${reviewId}/`);
}

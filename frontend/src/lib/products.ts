import { api } from "./api";

export const PRINT_TECHNOLOGIES = ["FDM", "SLA", "SLS"] as const;
export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;

export interface Dimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

export interface Variant {
  id: string;
  material: string;
  color: string;
  price: number;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  print_technology: (typeof PRINT_TECHNOLOGIES)[number];
  material: string | null;
  available_colors: string[];
  dimensions: Dimensions | null;
  weight_grams: number | null;
  scale: string | null;
  is_made_to_order: boolean;
  base_price: number;
  discount_price: number | null;
  currency: string;
  sku: string | null;
  stock_quantity: number;
  variants: Variant[];
  rating_avg: number;
  rating_count: number;
  total_sold: number;
  status: (typeof PRODUCT_STATUSES)[number];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Partial<
  Omit<
    Product,
    | "id"
    | "variants"
    | "rating_avg"
    | "rating_count"
    | "total_sold"
    | "created_by"
    | "created_at"
    | "updated_at"
  >
>;

export interface ProductListResponse {
  count: number;
  page: number;
  page_size: number;
  results: Product[];
}

export interface ProductListParams {
  status?: string;
  category?: string;
  material?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
}

export async function listProducts(params: ProductListParams = {}) {
  const { data } = await api.get<ProductListResponse>("/products/", { params });
  return data;
}

export async function getProduct(id: string) {
  const { data } = await api.get<Product>(`/products/${id}/`);
  return data;
}

export async function createProduct(payload: ProductInput) {
  const { data } = await api.post<Product>("/products/", payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductInput) {
  const { data } = await api.patch<Product>(`/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}/`);
}

export interface VariantInput {
  material: string;
  color: string;
  price: number;
  stock_quantity?: number;
  sku?: string | null;
}

export async function addVariant(productId: string, payload: VariantInput) {
  const { data } = await api.post<Variant>(`/products/${productId}/variants/`, payload);
  return data;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  payload: Partial<VariantInput> & { is_active?: boolean },
) {
  const { data } = await api.patch<Variant>(
    `/products/${productId}/variants/${variantId}/`,
    payload,
  );
  return data;
}

export async function deleteVariant(productId: string, variantId: string) {
  await api.delete(`/products/${productId}/variants/${variantId}/`);
}

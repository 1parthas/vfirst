export const VFIRST_API_BASE =
  process.env.NEXT_PUBLIC_VFIRST_API_BASE ?? "https://vfirst-api.chatloom.in";

export type VFirstSku = {
  id: number;
  product_id: number;
  weight: string;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  sku_code: string;
  in_stock: boolean;
  is_active: boolean;
};

export type VFirstCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
};

export type VFirstProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category_id: number;
  image_url: string | null;
  images: string[] | string | null;
  rating: string;
  total_reviews: number;
  is_featured: boolean;
  is_active: boolean;
  on_sale: boolean;
  category?: VFirstCategory | null;
  skus: VFirstSku[];
};

export type VFirstPagination = {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type VFirstProductResponse = {
  success: boolean;
  data: VFirstProduct[];
  pagination: VFirstPagination;
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  onSale?: boolean;
};

export function buildProductsUrl(query: ProductQuery = {}) {
  const url = new URL("/api/products", VFIRST_API_BASE);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    const apiKey = key === "onSale" ? "onSale" : key;
    url.searchParams.set(apiKey, String(value));
  });

  return url.toString();
}

export async function fetchVFirstProducts(
  query: ProductQuery = {}
): Promise<VFirstProductResponse> {
  const response = await fetch(buildProductsUrl(query), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    next: {
      revalidate: 300
    }
  });

  if (!response.ok) {
    throw new Error(`VFirst API responded with ${response.status}`);
  }

  const payload = (await response.json()) as VFirstProductResponse;

  if (!payload.success || !Array.isArray(payload.data)) {
    throw new Error("VFirst API returned an invalid product payload");
  }

  return payload;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  image: string | null;
  image_url: string | null;
  is_active: boolean;
  category: number;
  category_name: string;
  owner: number;
  owner_username: string;
  created_at: string;
  sold_quantity: number;
  sold_value: number;
}

export interface Category {
  id: number;
  name: string;
  products_count: number;
}

export interface MarketplaceStats {
  total_products: number;
  active_products: number;
  total_categories: number;
  average_price: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  can_sell: boolean;
  date_joined: string;
}

export type UserRole = 'buyer' | 'seller';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface RegisterPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole;
}

export interface ProductCreatePayload {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: number | null;
  is_active: boolean;
}

export interface CartEntry {
  id: number;
  product: Product;
  quantity: number;
  total_price: number;
}

export interface CartSummary {
  items: CartEntry[];
  total_items: number;
  total_price: number;
}

export interface FavoriteEntry {
  id: number;
  product: Product;
  created_at: string;
}

export interface SellerStats {
  products_count: number;
  sold_quantity: number;
  sold_value: number;
  products: Product[];
}

export interface OrderHistoryEntry {
  id: number;
  product: Product;
  count: number;
  unit_price: string;
  created_at: string;
  buyer_username: string;
  seller_username: string;
  total_price: number;
}

export interface ReviewEntry {
  id: number;
  product: number;
  author: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewCreatePayload {
  rating: number;
  comment: string;
}

export type Role = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
export type Gender = "MEN" | "WOMEN" | "UNISEX";
export type Concentration = "EDC" | "EDT" | "EDP" | "PARFUM" | "OIL";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";
export type PaymentMethod = "STRIPE" | "PAYPAL" | "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER" | "COD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  position: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  volumeMl: number;
  price: string;
  salePrice: string | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string | null;
  gender: Gender;
  concentration: Concentration;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string | null;
  projection: string | null;
  occasion: string[];
  season: string[];
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isLimitedEdition: boolean;
  categoryId: string | null;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserProfile extends AuthUser {
  phone: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CartItemVariant extends ProductVariant {
  product: {
    id: string;
    name: string;
    slug: string;
    images: ProductImage[];
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant: CartItemVariant;
}

export interface Cart {
  id: string;
  userId: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  currency: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  customerNote: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  dispatchedAt: string | null;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  user?: { id: string; email: string; firstName: string; lastName: string };
}

export interface OrderStats {
  totalSales: number;
  totalOrders: number;
  incompleteOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
}

export interface SiteSettings {
  shippingBannerText: string;
  [key: string]: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string;
  images: string[];
  isVerified: boolean;
  status: ReviewStatus;
  adminReply: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface CouponValidation {
  coupon: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: string;
  };
  discountAmount: number;
}

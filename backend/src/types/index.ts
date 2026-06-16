export interface JwtPayload {
    id: string;
    role: 'user' | 'admin' | 'deliveryPartner';
}

export interface OrderItemInput {
    product: string;
    quantity: number;
}

export interface OrderItem {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    unit: string;
}

export interface AddressInput {
    label: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    isDefault?: boolean;
    lat: number;
    lng: number;
}

export interface ProductInput {
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    unit?: string;
    stock?: number;
    isOrganic?: boolean;
}

export interface ProductUpdateInput {
    name?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    image?: string;
    category?: string;
    unit?: string;
    stock?: number;
    isOrganic?: boolean;
}

export interface PartnerUpdateInput {
    name?: string;
    phone?: string;
    vehicleType?: string;
    isActive?: boolean;
}

export interface CreateOrderInput {
    items: OrderItemInput[];
    shippingAddress: AddressInput;
    paymentMethod: 'card' | 'cash';
}

export interface ProductQueryFilters {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price-low' | 'price-high' | 'newest';
    page?: number;
    limit?: number;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export const ORDER_STATUS = {
    PLACED: 'Placed',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Assigned',
    PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
    [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PACKED]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
};

export const ALLOWED_PRODUCT_FIELDS = [
    'name',
    'description',
    'price',
    'originalPrice',
    'image',
    'category',
    'unit',
    'stock',
    'isOrganic',
] as const;

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    addresses: Address[];
    isAdmin?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    id: string;
    label: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
    lat: number;
    lng: number;
}

export interface Category {
    slug: string;
    name: string;
    image: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    image: string;
    category: string;
    unit: string;
    stock: number;
    isOrganic: boolean;
    rating: number;
    reviewCount: number;
    discount: number;
    createdAt: string;
}

export interface CartItem {
    product: Product;
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

export interface DeliveryPartner {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    vehicleType: 'bike' | 'scooter' | 'car';
    isActive: boolean;
    createdAt: string;
}

export interface Order {
    id: string;
    user: string | { id: string; name: string; email: string; phone?: string };
    items: OrderItem[];
    shippingAddress: Omit<Address, 'id' | 'isDefault'>;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    status: OrderStatus;
    statusHistory: StatusHistoryEntry[];
    deliveryPartner: DeliveryPartner | null;
    deliveryOtp: string;
    isPaid: boolean;
    liveLocation?: { lat: number; lng: number; updatedAt: string } | null;
    createdAt: string;
}

export type OrderStatus =
    | 'Placed'
    | 'Confirmed'
    | 'Assigned'
    | 'Packed'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';

export interface StatusHistoryEntry {
    status: OrderStatus;
    timestamp?: string;
    updatedAt?: string;
    note: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

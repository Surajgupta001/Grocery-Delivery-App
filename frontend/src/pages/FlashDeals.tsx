import { useEffect, useState } from "react";
import type { Product } from "../types";
import { dummyProducts } from "../assets/assets";
import { Zap } from "lucide-react";

export function FlashDeals() {

    const [products, setProducts] = useState<Product[] | null>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setProducts(dummyProducts.filter((p: Product) => p.stock > 0));
        setTimeout(() => setLoading(false), 1000);
    }, []);

    return (
        <div className="min-h-screen bg-app-cream">
            {/* Banner */}
            <div className="bg-linear-to-r from-app-orange to-app-orange-dark text-white py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex-center gap-2 mb-3">
                        <Zap className="size-6 fill-white" />
                        <h1 className="text-3xl font-semibold">Flash Deals!</h1>
                        <Zap className="size-6 fill-white" />
                    </div>
                    <p className="text-white/80 max-w-md mx-auto">Limited-time offers on your favorite organic products. Grab them before they're gone!</p>
                </div>
            </div>
        </div>
    );
}

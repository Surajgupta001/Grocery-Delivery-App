import { useEffect, useState } from "react";
import type { Product } from "../../types";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { ProductCard } from "../ProductCard";
import api from "../../config/api";
import toast from "react-hot-toast";

export function PopularProducts() {

    const [products, setProducts] = useState<Product[] | null>([]);

    useEffect(() => {
        // Fetch popular products from the API
        api.get('/products?&sort=rating').then(({ data }) => {
            setProducts(data.data.products);
        }).catch((error: any) => {
            toast.error(error.response?.data?.message || error.message);
        })
    }, []);

    return (
        <section className="pb-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold">Popular Products</h2>
                        <p className="text-sm text-app-text-light">Top-rated products loved by our customers</p>
                    </div>
                    <Link to='/products' className='text-sm font-semibold text-app-orange hover:text-app-orange-dark flex items-center gap-1 transition-colors'>
                        View All <ArrowRightIcon className="size-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
                    {products?.slice(0, 10).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
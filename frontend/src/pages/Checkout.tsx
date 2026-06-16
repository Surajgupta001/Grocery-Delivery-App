import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useState, useEffect } from "react";
import type { Address } from "../types";
import { ArrowLeft, CheckIcon, ChevronRightIcon, CreditCardIcon, MapPinIcon } from "lucide-react";
import CheckoutAddress from "../components/Checkout/CheckoutAddress";
import CheckoutPayment from "../components/Checkout/CheckoutPayment";
import CheckoutReview from "../components/Checkout/CheckoutReview";
import api from "../config/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";

export function Checkout() {

    const navigate = useNavigate();
    const currency = import.meta.env.VITE_APP_CURRENCY_SYMBOL || "$";

    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();

    const [step, setStep] = useState('address');
    const [loading, setLoading] = useState(false);

    const [address, setAddress] = useState<Address>({
        id: '',
        label: 'Home',
        address: '',
        city: '',
        state: '',
        zip: '',
        isDefault: false,
        lat: 0,
        lng: 0
    });

    const [paymentMethod, setPaymentMethod] = useState('card');

    const deliveryFee = cartTotal > 20 ? 0 : 5; // Free delivery for orders over $20
    const tax = 0.08 * cartTotal; // 8% tax
    const total = cartTotal + deliveryFee + tax;

    interface StepProps {
        key: string;
        label: string;
        icon: typeof MapPinIcon
    };

    const steps: StepProps[] = [
        { key: 'address', label: 'Delivery Address', icon: MapPinIcon },
        { key: 'payment', label: 'Payment Method', icon: CreditCardIcon },
        { key: 'review', label: 'Review Order', icon: CheckIcon }
    ]

    const handlePlaceOrder = async () => {
        setLoading(true);
        
        try {
            const orderData = {
                items: items.map((item) => ({
                    product: item.product.id,
                    quantity: item.quantity,
                })),
                shippingAddress: address,
                paymentMethod,
            }

            const { data } = await api.post("/orders", orderData);
            // console.log("Order placed successfully:", data);

            if (data.url) {
                window.location.href = data.url; // Redirect to the payment gateway
                return;
            }
            clearCart();
            toast.success("Order placed successfully!");
            navigate(`/orders/${data.data.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false);
            scrollTo(0, 0); // Scroll to top after placing order
        }
    };

    // Populate address from user's default address
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user?.addresses?.length) {
                const defaultAddr = user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
                if (defaultAddr) {
                    setAddress({
                        id: defaultAddr.id || '',
                        label: defaultAddr.label || 'Home',
                        address: defaultAddr.address || '',
                        city: defaultAddr.city || '',
                        state: defaultAddr.state || '',
                        zip: defaultAddr.zip || '',
                        isDefault: defaultAddr.isDefault || false,
                        lat: defaultAddr.lat || 0,
                        lng: defaultAddr.lng || 0
                    });
                }
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-app-cream flex-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-app-green mb-2">Your cart is empty</h2>
                    <p className='text-sm text-app-text-light mb-4'>Add some products to checkout</p>
                    <button onClick={() => navigate('/products')} className='px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-xl hover:bg-app-green-light transition-colors'>
                        Browse Products
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-app-cream">
            <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

                {/* Back Button */}
                <button onClick={() => navigate(-1)} className='flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors'>
                    <ArrowLeft className='size-4' /> Back
                </button>
                <h1 className="text-2xl font-semibold text-app-green mb-8">Checkout</h1>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-8">
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-2">
                            <button onClick={() => setStep(s.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === s.key ? 'bg-app-green text-white' : 'bg-white text-app-text-light'}`}>
                                <s.icon className="size-4" />
                                {s.label}
                                {i < steps.length - 1 && <ChevronRightIcon className="size-4 text-app-text-light" />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="md:col-span-2">
                        {step === 'address' && (
                            <CheckoutAddress address={address} setAddress={setAddress} setStep={setStep} user={user!} />
                        )}
                        {step === 'payment' && (
                            <CheckoutPayment paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} setStep={setStep} />
                        )}
                        {step === 'review' && (
                            <CheckoutReview address={address} items={items} handlePlaceOrder={handlePlaceOrder} loading={loading} total={total} />
                        )}
                    </div>
                    {/* Order summary Sidebar */}
                    <div className="bg-white rounded-2xl p-5 h-fit sticky top-24">
                        <h3 className="text-sm font-semibold text-app-green mb-4">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className='flex justify-between'>
                                <span className="text-app-text-light">Subtotal ({items.length} items)</span>
                                <span>{currency}{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className="text-app-text-light">Delivery</span>
                                <span>{deliveryFee === 0 ? <span className="text-app-success">Free</span> : <span>{currency}{deliveryFee.toFixed(2)}</span>}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className="text-app-text-light">Tax</span>
                                <span>{currency}{tax.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between pt-3 border-t border-app-border text-base font-semibold'>
                                <span>Total</span>
                                <span className="text-app-green">{currency}{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

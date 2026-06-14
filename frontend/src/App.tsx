import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Address } from "./pages/Address";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminProducts from "./pages/admin/AdminProducts";
import { AppLayout } from "./pages/AppLayout";
import { Checkout } from "./pages/Checkout";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryLayout from "./pages/delivery/DeliveryLayout";
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
import { FlashDeals } from "./pages/FlashDeals";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { MyOrders } from "./pages/MyOrders";
import { OrderTracking } from "./pages/OrderTracking";
import { ProductPage } from "./pages/ProductPage";
import { Products } from "./pages/Products";
import { SearchResults } from "./pages/SearchResults";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1B3022",
            color: "#fff",
            borderRadius: '12px',
            fontSize: '14px'
          }
        }}
      />
      <Routes>
        {/* Auth Pages - No Navbar/Footer */}
        <Route path="/login" element={<Login />} />

        {/* Main Pages - with Navbar/Footer */}
        <Route path="/" element={<AppLayout />} >
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="deals" element={<FlashDeals />} />
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderTracking />} />
            <Route path="addresses" element={<Address />} />
          </Route>
        </Route>

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />} >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
        </Route>

        {/* Delivery Partner Pages */}
        <Route path='/delivery/login' element={<DeliveryLogin />} />
        <Route path='/delivery' element={<DeliveryLayout />}>
          <Route index element={<DeliveryDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

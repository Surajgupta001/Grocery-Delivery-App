import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { AppLayout } from "./pages/AppLayout";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductPage } from "./pages/ProductPage";
import { SearchResults } from "./pages/SearchResults";
import { FlashDeals } from "./pages/FlashDeals";
import { Checkout } from "./pages/Checkout";
import { Address } from "./pages/Address";
import { OrderTracking } from "./pages/OrderTracking";
import { MyOrders } from "./pages/MyOrders";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "1B3022",
            color: "fff",
            borderRadius: '12px',
            fontSize: '14px'
          }
        }}
      />
      <Routes>
        {/* Auth Pages - No Navbar/Footer */}
        <Route path="/login" element={<Login />} />
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
      </Routes>
    </>
  );
}

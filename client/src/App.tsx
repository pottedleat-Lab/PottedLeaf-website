import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/Guards';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import Vlogs from './pages/Vlogs';
import FeedbackPage from './pages/Feedback';
import Gallery from './pages/Gallery';
import About from './pages/About';
import { Login, NotFound, Signup } from './pages/Auth';
import { Contact, Privacy, RefundPolicy, ShippingPolicy, Terms } from './pages/Policies';
import AdminLayout from './pages/admin/AdminLayout';
import AddProduct from './pages/admin/AddProduct';
import Inventory from './pages/admin/Inventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminGallery from './pages/admin/AdminGallery';
import AdminVlogs from './pages/admin/AdminVlogs';
import AdminFeedback from './pages/admin/AdminFeedback';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:category" element={<Shop />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="vlogs" element={<Vlogs />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
        <Route path="shipping-policy" element={<ShippingPolicy />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* Login required */}
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="order-success/:id" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
        <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />

        {/* Admin only */}
        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AddProduct />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="vlogs" element={<AdminVlogs />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

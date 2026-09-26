import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AdminRoute } from "./auth/AdminRoute";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Layout } from "./components/layout/Layout";
import { LoadingGrid } from "./components/ui/LoadingGrid";
import "./styles/storefront.css";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const CategoryPage = lazy(() =>
  import("./pages/CategoryPage").then((m) => ({ default: m.CategoryPage }))
);
const ProductsPage = lazy(() =>
  import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const AccountPage = lazy(() =>
  import("./pages/AccountPage").then((m) => ({ default: m.AccountPage }))
);
const CartPage = lazy(() =>
  import("./pages/CartPage").then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const OrderHistoryPage = lazy(() =>
  import("./pages/OrderHistoryPage").then((m) => ({ default: m.OrderHistoryPage }))
);
const OrderDetailPage = lazy(() =>
  import("./pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminOrdersPage").then((m) => ({ default: m.AdminOrdersPage }))
);
const AdminOrderDetailPage = lazy(() =>
  import("./pages/admin/AdminOrderDetailPage").then((m) => ({
    default: m.AdminOrderDetailPage,
  }))
);
const AdminCategoriesPage = lazy(() =>
  import("./pages/admin/AdminCategoriesPage").then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage").then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminProductDetailPage = lazy(() =>
  import("./pages/admin/AdminProductDetailPage").then((m) => ({
    default: m.AdminProductDetailPage,
  }))
);

function PageFallback() {
  return <LoadingGrid count={4} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageFallback />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="categories/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <CategoryPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="products/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProductDetailPage />
              </Suspense>
            }
          />
          <Route
            path="login"
            element={
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="register"
            element={
              <Suspense fallback={<PageFallback />}>
                <RegisterPage />
              </Suspense>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route
              path="account"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AccountPage />
                </Suspense>
              }
            />
            <Route
              path="cart"
              element={
                <Suspense fallback={<PageFallback />}>
                  <CartPage />
                </Suspense>
              }
            />
            <Route
              path="checkout"
              element={
                <Suspense fallback={<PageFallback />}>
                  <CheckoutPage />
                </Suspense>
              }
            />
            <Route
              path="account/orders"
              element={
                <Suspense fallback={<PageFallback />}>
                  <OrderHistoryPage />
                </Suspense>
              }
            />
            <Route
              path="account/orders/:id"
              element={
                <Suspense fallback={<PageFallback />}>
                  <OrderDetailPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="orders"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminOrdersPage />
                  </Suspense>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminOrderDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="categories"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminCategoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="products"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductsPage />
                  </Suspense>
                }
              />
              <Route
                path="products/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductDetailPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

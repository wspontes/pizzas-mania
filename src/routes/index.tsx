import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout, AuthLayout, AdminLayout, KitchenLayout } from '@/layouts'
import { ProtectedRoute } from '@/components/shared'

const Home = lazy(() => import('@/pages/public/Home'))
const Menu = lazy(() => import('@/pages/public/Menu'))
const Login = lazy(() => import('@/pages/public/Login'))
const Register = lazy(() => import('@/pages/public/Register'))
const Cart = lazy(() => import('@/pages/public/Cart'))
const Checkout = lazy(() => import('@/pages/public/Checkout'))
const OrderConfirmed = lazy(() => import('@/pages/public/OrderConfirmed'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/Products'))
const AdminProductForm = lazy(() => import('@/pages/admin/ProductForm'))
const AdminCategories = lazy(() => import('@/pages/admin/Categories'))
const AdminOrders = lazy(() => import('@/pages/admin/OrdersAdmin'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const KitchenDashboard = lazy(() => import('@/pages/kitchen/Dashboard'))
const Seed = lazy(() => import('@/pages/dev/Seed'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={['admin', 'manager', 'attendant']}>{children}</ProtectedRoute>
}

function ProtectedKitchen({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={['admin', 'kitchen']}>{children}</ProtectedRoute>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: 'cardapio', element: <Suspense fallback={<PageLoader />}><Menu /></Suspense> },
      { path: 'carrinho', element: <Suspense fallback={<PageLoader />}><Cart /></Suspense> },
      { path: 'checkout', element: <Suspense fallback={<PageLoader />}><Checkout /></Suspense> },
      { path: 'pedido/confirmacao', element: <Suspense fallback={<PageLoader />}><OrderConfirmed /></Suspense> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedAdmin><AdminLayout /></ProtectedAdmin>,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
      { path: 'pedidos', element: <Suspense fallback={<PageLoader />}><AdminOrders /></Suspense> },
      { path: 'produtos', element: <Suspense fallback={<PageLoader />}><AdminProducts /></Suspense> },
      { path: 'produtos/novo', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'produtos/:id/editar', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'categorias', element: <Suspense fallback={<PageLoader />}><AdminCategories /></Suspense> },
      { path: 'configuracoes', element: <Suspense fallback={<PageLoader />}><AdminSettings /></Suspense> },
    ],
  },
  {
    path: '/cozinha',
    element: <ProtectedKitchen><KitchenLayout /></ProtectedKitchen>,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><KitchenDashboard /></Suspense> },
    ],
  },
  {
    path: '/seed',
    element: <Suspense fallback={<PageLoader />}><Seed /></Suspense>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

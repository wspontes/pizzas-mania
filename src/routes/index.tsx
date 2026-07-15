import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout, AuthLayout, AdminLayout } from '@/layouts'

const Home = lazy(() => import('@/pages/public/Home'))
const Menu = lazy(() => import('@/pages/public/Menu'))
const Login = lazy(() => import('@/pages/public/Login'))
const Register = lazy(() => import('@/pages/public/Register'))
const Cart = lazy(() => import('@/pages/public/Cart'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: 'cardapio', element: <Suspense fallback={<PageLoader />}><Menu /></Suspense> },
      { path: 'carrinho', element: <Suspense fallback={<PageLoader />}><Cart /></Suspense> },
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
    element: <AdminLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

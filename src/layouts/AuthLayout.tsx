import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Pizzas Mania</h1>
          <p className="mt-2 text-muted">Faça login para continuar</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

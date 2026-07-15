import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-brand-black">
      <aside className="w-64 border-r border-border bg-surface p-4">
        <h2 className="text-lg font-bold text-white">Admin</h2>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

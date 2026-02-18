import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const adminUser = session.admin_users as { name: string; email: string; role: string }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar user={adminUser} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

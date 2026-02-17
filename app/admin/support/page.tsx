import { requireAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function SupportPage() {
  const session = await requireAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Support</h1>
        <p className="text-slate-400 text-sm mt-1">Customer support queue</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-500 text-sm">Support queue — coming soon</p>
      </div>
    </div>
  )
}

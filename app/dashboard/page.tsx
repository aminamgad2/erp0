export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardModules from '@/components/DashboardModules';
import DashboardStats from '@/components/DashboardStats';
import { Building2 } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              مرحباً، {session.name}
            </h1>
            <p className="text-slate-600 mt-1 text-sm md:text-base">
              {session.role === 'super-admin' && 'مدير النظام العام'}
              {session.role === 'owner' && 'مالك الشركة'}
              {session.role === 'staff' && 'موظف'}
            </p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <Building2 className="w-5 h-5 text-slate-500" />
            <span className="text-slate-600">
              {session.role === 'super-admin' ? 'إدارة النظام' : 'نظام إدارة الأعمال'}
            </span>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats userId={session.userId} companyId={session.companyId} />

        {/* Dashboard Modules */}
        <DashboardModules modules={session.modules} />
      </div>
    </DashboardLayout>
  );
}
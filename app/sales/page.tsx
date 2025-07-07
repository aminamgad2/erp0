export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession, checkModuleAccess } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import SalesManager from '@/components/SalesManager';

export default async function SalesPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Check if user has access to Sales module
  if (!checkModuleAccess(session.modules, 'sales')) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المبيعات والفواتير</h1>
          <p className="text-slate-600 mt-1">
            إدارة الفواتير والمبيعات ومتابعة المدفوعات
          </p>
        </div>
        
        <SalesManager 
          userRole={session.role}
          companyId={session.companyId}
        />
      </div>
    </DashboardLayout>
  );
}
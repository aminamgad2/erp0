export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession, checkModuleAccess } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import ModuleContent from '@/components/ModuleContent';

interface ModulePageProps {
  params: {
    module: string;
  };
}

const moduleNames = {
  crm: 'إدارة العملاء',
  hr: 'الموارد البشرية',
  inventory: 'إدارة المخزون',
  sales: 'المبيعات'
};

export default async function ModulePage({ params }: ModulePageProps) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Check if user has access to this module
  if (!checkModuleAccess(session.modules, params.module as keyof typeof session.modules)) {
    redirect('/dashboard');
  }

  const moduleName = moduleNames[params.module as keyof typeof moduleNames];

  if (!moduleName) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{moduleName}</h1>
          <p className="text-slate-600 mt-1">
            إدارة وتتبع {moduleName.toLowerCase()}
          </p>
        </div>
        
        <ModuleContent 
          module={params.module} 
          userRole={session.role}
          companyId={session.companyId}
        />
      </div>
    </DashboardLayout>
  );
}
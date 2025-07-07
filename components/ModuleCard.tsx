'use client';

import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Module {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  enabled: boolean;
}

interface ModuleCardProps {
  module: Module;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const Icon = module.icon;
  const router = useRouter();

  const handleModuleClick = () => {
    // Navigate to the specific module
    router.push(`/modules/${module.key}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
      <CardHeader className="pb-3 p-4 md:p-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`${module.color} p-2 md:p-3 rounded-lg text-white group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            <CardDescription className="text-xs md:text-sm">{module.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <Button 
          onClick={handleModuleClick}
          className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 text-sm md:text-base"
          variant="outline"
        >
          فتح الوحدة
        </Button>
      </CardContent>
    </Card>
  );
}
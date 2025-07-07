'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, User, Mail, Building2, Edit, Trash2, Shield } from 'lucide-react';
import { User as UserType } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';

export default function UsersManager() {
  const [users, setUsers] = useState<(UserType & { companyName?: string })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'super-admin' | 'owner' | 'staff',
    companyId: '',
    modules: {
      crm: false,
      hr: false,
      inventory: false,
      sales: false,
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser._id}`
        : '/api/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || undefined,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId?.toString() || '',
      modules: user.modules,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      companyId: '',
      modules: {
        crm: false,
        hr: false,
        inventory: false,
        sales: false,
      },
    });
    setEditingUser(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleModuleChange = (module: keyof typeof formData.modules, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: checked,
      },
    }));
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المستخدمون</h2>
          <p className="text-slate-600">عدد المستخدمين: {users.length}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'قم بتعديل بيانات المستخدم وصلاحياته'
                  : 'أدخل بيانات المستخدم الجديد وحدد صلاحياته'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    {editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للاحتفاظ بالحالية)' : 'كلمة المرور'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="role">الصلاحية</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">مدير النظام</SelectItem>
                      <SelectItem value="owner">مالك الشركة</SelectItem>
                      <SelectItem value="staff">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.role !== 'super-admin' && (
                <div>
                  <Label htmlFor="company">الشركة</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData({...formData, companyId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company._id?.toString()} value={company._id!.toString()}>
                          {company.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label className="text-base font-medium">صلاحيات الوحدات</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="crm"
                      checked={formData.modules.crm}
                      onCheckedChange={(checked) => handleModuleChange('crm', checked as boolean)}
                    />
                    <Label htmlFor="crm">إدارة العملاء</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="hr"
                      checked={formData.modules.hr}
                      onCheckedChange={(checked) => handleModuleChange('hr', checked as boolean)}
                    />
                    <Label htmlFor="hr">الموارد البشرية</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="inventory"
                      checked={formData.modules.inventory}
                      onCheckedChange={(checked) => handleModuleChange('inventory', checked as boolean)}
                    />
                    <Label htmlFor="inventory">المخزون</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="sales"
                      checked={formData.modules.sales}
                      onCheckedChange={(checked) => handleModuleChange('sales', checked as boolean)}
                    />
                    <Label htmlFor="sales">المبيعات</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingUser ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user._id?.toString()} className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="pb-3 p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-primary text-primary-foreground p-2 rounded-lg flex-shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg truncate">{user.name}</CardTitle>
                    <CardDescription className="text-xs md:text-sm truncate">{user.email}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                  <Badge variant="outline">
                    {user.role === 'super-admin' && 'مدير النظام'}
                    {user.role === 'owner' && 'مالك'}
                    {user.role === 'staff' && 'موظف'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6 pt-0">
              {user.companyName && (
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{user.companyName}</span>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">الوحدات المتاحة:</p>
                <div className="flex flex-wrap gap-1 text-xs">
                  {user.modules.crm && <Badge variant="secondary">العملاء</Badge>}
                  {user.modules.hr && <Badge variant="secondary">الموارد البشرية</Badge>}
                  {user.modules.inventory && <Badge variant="secondary">المخزون</Badge>}
                  {user.modules.sales && <Badge variant="secondary">المبيعات</Badge>}
                  {!Object.values(user.modules).some(Boolean) && (
                    <span className="text-xs text-slate-500">لا توجد وحدات</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(user)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(user._id!.toString())}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
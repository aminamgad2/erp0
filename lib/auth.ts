import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb } from './mongodb';
import { User, ModuleAccess } from './models/User';
import { ObjectId } from 'mongodb';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'super-admin' | 'owner' | 'staff';
  companyId?: string;
  modules: ModuleAccess;
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  userId: '',
  email: '',
  name: '',
  role: 'staff',
  modules: {
    crm: false,
    hr: false,
    inventory: false,
    sales: false,
  },
  isLoggedIn: false,
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), {
    cookieName: 'erp_session',
    password: process.env.SESSION_SECRET || 'your-secret-key-min-32-chars-long',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    },
  });

  if (!session.isLoggedIn) {
    session.userId = defaultSession.userId;
    session.email = defaultSession.email;
    session.name = defaultSession.name;
    session.role = defaultSession.role;
    session.companyId = defaultSession.companyId;
    session.modules = defaultSession.modules;
    session.isLoggedIn = defaultSession.isLoggedIn;
  }

  return session;
}

export async function login(email: string, password: string) {
  try {
    const db = await getDb();
    const user = await db.collection<User>('users').findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return { success: false, message: 'بيانات الدخول غير صحيحة' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { success: false, message: 'بيانات الدخول غير صحيحة' };
    }

    const session = await getSession();
    session.userId = user._id!.toString();
    session.email = user.email;
    session.name = user.name;
    session.role = user.role;
    session.companyId = user.companyId?.toString();
    session.modules = user.modules;
    session.isLoggedIn = true;

    await session.save();

    return { success: true, user: { ...user, password: undefined } };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
  }
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function checkModuleAccess(userModules: ModuleAccess, requiredModule: keyof ModuleAccess): boolean {
  return userModules[requiredModule] === true;
}

export function isSuperAdmin(role: string): boolean {
  return role === 'super-admin';
}

export function isOwner(role: string): boolean {
  return role === 'owner';
}

export function canAccessAdmin(role: string): boolean {
  return role === 'super-admin';
}
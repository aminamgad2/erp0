import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'نظام إدارة الأعمال العربي',
  description: 'نظام شامل لإدارة الأعمال والشركات',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic antialiased">
        {children}
      </body>
    </html>
  );
}
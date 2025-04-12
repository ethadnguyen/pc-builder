import './globals.css';
import type { Metadata } from 'next';

import { AuthProvider } from '@/hooks/use-auth';
import { ClientLayout } from '@/components/layout/client-layout';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'A comprehensive admin dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='vi'>
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

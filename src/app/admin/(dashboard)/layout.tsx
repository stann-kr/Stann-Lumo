'use client';
import { ReactNode } from 'react';
import ProtectedRoute from '@/components/feature/ProtectedRoute';
import AdminContentGate from '@/components/feature/AdminContentGate';
import AdminLayout from '@/components/feature/AdminLayout';
import { ContentProvider } from '@/contexts/ContentContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ContentProvider>
        <AdminContentGate>
          <AdminLayout>{children}</AdminLayout>
        </AdminContentGate>
      </ContentProvider>
    </ProtectedRoute>
  );
}

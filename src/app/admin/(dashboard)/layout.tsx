'use client';
import { ReactNode } from 'react';
import ProtectedRoute from '@/components/feature/ProtectedRoute';
import AdminLayout from '@/components/feature/AdminLayout';
import { ContentProvider } from '@/contexts/ContentContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ContentProvider>
        <AdminLayout>{children}</AdminLayout>
      </ContentProvider>
    </ProtectedRoute>
  );
}

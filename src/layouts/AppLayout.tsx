import type { ReactNode } from 'react';
import { Header } from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-base-950)]">
      <Header />
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}
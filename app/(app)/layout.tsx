import { StoreProvider } from '@/lib/store';
import Navbar from '@/components/layout/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 min-h-[calc(100vh-57px)]">
        {children}
      </main>
    </StoreProvider>
  );
}

import { StoreProvider } from '@/lib/store';
import Navbar from '@/components/layout/Navbar';
import SignalPrefetcher from '@/components/intelligence/SignalPrefetcher';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      {/* Silently warms the signal DB cache in the background */}
      <SignalPrefetcher />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 min-h-[calc(100vh-57px)]">
        {children}
      </main>
    </StoreProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the Login page immediately on render
    router.push('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-500">Redirecting to login portal...</span>
      </div>
    </div>
  );
}

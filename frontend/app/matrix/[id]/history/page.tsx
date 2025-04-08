"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../components/auth/authContext';
import HistoryTable from '../../../../components/history/historyTable';
import Link from 'next/link';

export default function MatrixHistoryPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matrixId = params.id as string;

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || !isAdmin())) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Don't render anything until authentication check is complete
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Don't render content if not authenticated or not admin
  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <main className="flex-grow container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Matrix History</h2>
          <Link href={`/matrix/${matrixId}`} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
            Back to Matrix
          </Link>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            This page shows the history of all changes made to this specific matrix.
            Each entry includes the user who made the change and the action taken.
          </p>
        </div>
        <HistoryTable matrixId={matrixId} />
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HistoryTable from "../../components/history/historyTable";

export default function HistoryPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Get username from token (simplified for demo)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username || "User");
    } catch (error) {
      console.error("Error parsing token:", error);
      setUsername("User");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-green-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Matrix Consierge</h1>
          <div className="flex items-center space-x-4">
            <Link href="/matrix" className="hover:underline">
              Matrix
            </Link>
            <Link href="/history" className="hover:underline">
              History
            </Link>
            <div className="flex items-center">
              <span className="mr-2">Welcome, {username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Change History</h2>
          <div className="mb-4">
            <p className="text-gray-600">
              This page shows the history of all changes made to the dependency matrix.
              Each entry includes the user who made the change, the affected cell, and the old and new values.
            </p>
          </div>
          <HistoryTable />
        </div>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        &copy; {new Date().getFullYear()} Matrix Consierge. All rights reserved.
      </footer>
    </div>
  );
}
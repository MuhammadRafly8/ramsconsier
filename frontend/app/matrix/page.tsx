"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatrixTable from "../../components/matrix/matrixTable";

export default function MatrixPage() {
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
      <header className="bg-green-800 text-white py-2 px-4">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-xl font-bold text-yellow-300">DEPENDENCY MATRIX</h1>
          <div className="flex items-center space-x-3">
            <Link href="/matrix" className="hover:underline text-sm">
              Matrix
            </Link>
            <Link href="/history" className="hover:underline text-sm">
              History
            </Link>
            <div className="flex items-center">
              <span className="mr-2 text-sm">{username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-0 overflow-auto">
        <div className="w-full overflow-x-auto">
          <MatrixTable />
        </div>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        &copy; {new Date().getFullYear()} Matrix Consierge. All rights reserved.
      </footer>
    </div>
  );
}
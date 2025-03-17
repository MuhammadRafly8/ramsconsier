"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

interface HistoryItem {
  id: number;
  matrixId: number;
  userId: number;
  oldValue: boolean;
  newValue: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  matrix: {
    id: number;
    rowId: number;
    columnId: number;
    rowName: string;
    columnName: string;
  };
}

const HistoryTable = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
      setError("Failed to load history data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading history data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  if (history.length === 0) {
    return <div className="p-8">No history data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-100">Date</th>
            <th className="border p-2 bg-gray-100">User</th>
            <th className="border p-2 bg-gray-100">Row</th>
            <th className="border p-2 bg-gray-100">Column</th>
            <th className="border p-2 bg-gray-100">Old Value</th>
            <th className="border p-2 bg-gray-100">New Value</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">
                {format(new Date(item.createdAt), "MMM d, yyyy HH:mm")}
              </td>
              <td className="border p-2">{item.user.username}</td>
              <td className="border p-2">{item.matrix.rowName}</td>
              <td className="border p-2">{item.matrix.columnName}</td>
              <td className="border p-2 text-center">
                <span className={`inline-block w-5 h-5 rounded-full ${
                  item.oldValue ? "bg-green-600" : "bg-gray-300"
                }`}></span>
              </td>
              <td className="border p-2 text-center">
                <span className={`inline-block w-5 h-5 rounded-full ${
                  item.newValue ? "bg-green-600" : "bg-gray-300"
                }`}></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
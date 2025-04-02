"use client";

import { useState, useEffect, Fragment } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import historyService, { HistoryEntry } from "../../services/historyService";

interface StructuredMatrix {
  rows: { id: number; name: string; category: string }[];
  columns: { id: number; name: string }[];
  dependencies: Record<string, boolean>;
}

interface HistoryTableProps {
  matrixId?: string; // Optional matrixId to filter history for a specific matrix
}

const HistoryTable = ({ matrixId }: HistoryTableProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  useEffect(() => {
    // Fetch history from API instead of localStorage
    const fetchHistory = async () => {
      try {
        let data;
        if (matrixId) {
          // If matrixId is provided, fetch history for that specific matrix
          data = await historyService.getHistoryByMatrixId(matrixId);
        } else {
          // Otherwise, fetch all history
          data = await historyService.getAllHistory();
        }
        
        // Sort by timestamp (newest first)
        setHistory(data.sort((a: HistoryEntry, b: HistoryEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error("Error loading history:", error);
        toast.error("Failed to load history data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [matrixId]);

  const viewMatrix = (matrixSnapshot: string) => {
    try {
      const matrix = JSON.parse(matrixSnapshot);
      setSelectedMatrix(matrix);
      setShowMatrixModal(true);
    } catch (error) {
      console.error("Error parsing matrix snapshot:", error);
      toast.error("Failed to load matrix data. The format might be invalid.");
    }
  };

  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    if (!id) {
      toast.error("Cannot delete entry without ID");
      return;
    }
    
    if (confirm("Are you sure you want to delete this history entry?")) {
      try {
        await historyService.deleteHistoryEntry(id);
        
        // Update state by removing the deleted entry
        setHistory(history.filter(entry => entry.id !== id));
        
        toast.success("History entry deleted successfully");
      } catch (error) {
        console.error("Error deleting history entry:", error);
        toast.error("Failed to delete history entry");
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading history data...</div>;
  }

  if (history.length === 0) {
    return <div className="p-8 text-center text-gray-500">No history data available</div>;
  }

  // Rest of the component remains the same
  return (
    <>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Time</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">User</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Role</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Matrix</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Action</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Details</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">View</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} className="bg-white hover:bg-gray-50">
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">{entry.userId}</td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded-full text-xs ${
                    entry.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.userRole}
                  </span>
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">{entry.matrixId}</td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded-full text-xs ${
                    entry.action === 'add' ? 'bg-green-100 text-green-800' : 
                    entry.action === 'remove' ? 'bg-red-100 text-red-800' : 
                    entry.action === 'submit_matrix' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {entry.action === 'add' ? 'Added dependency' : 
                     entry.action === 'remove' ? 'Removed dependency' : 
                     entry.action === 'submit_matrix' ? 'Submitted matrix' :
                     'Edited matrix'}
                  </span>
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {entry.action === 'edit_matrix' ? (
                    entry.details
                  ) : entry.action === 'submit_matrix' ? (
                    entry.details
                  ) : (
                    <>
                      {entry.action === 'add' ? 'Added' : 'Removed'} dependency between 
                      <span className="font-semibold"> {entry.rowName} </span> 
                      and 
                      <span className="font-semibold"> {entry.columnName}</span>
                    </>
                  )}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-center">
                  {entry.matrixSnapshot && (
                    <button
                      onClick={() => entry.matrixSnapshot ? viewMatrix(entry.matrixSnapshot) : null}
                      className="px-2 py-0.5 md:px-3 md:py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
                    >
                      View
                    </button>
                  )}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-center">
                  <button
                    onClick={() => entry.id && handleDeleteHistoryEntry(entry.id)}
                    className="px-2 py-0.5 md:px-3 md:py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matrix Modal */}
      {showMatrixModal && selectedMatrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-0">
          <div className="bg-white rounded-lg p-3 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h3 className="text-base md:text-xl font-bold">Submitted Matrix</h3>
              <button 
                onClick={closeMatrixModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Matrix view content remains the same */}
            {/* ... */}
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryTable;
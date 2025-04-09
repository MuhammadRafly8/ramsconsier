"use client";

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/auth/authContext';
import AdminRoute from '../../../../components/auth/adminRoute';
import { toast } from "react-toastify";
import { format } from "date-fns";
import historyService, { HistoryEntry } from "../../../../services/historyService";
import Link from 'next/link';
import React from 'react';

interface StructuredMatrix {
  rows: { id: number; name: string; category: string }[];
  columns: { id: number; name: string }[];
  dependencies: Record<string, boolean>;
}

export default function MatrixSubmissionsPage() {
  const [submissions, setSubmissions] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const router = useRouter();

  // In your useEffect function for fetching submissions
  useEffect(() => {
    // Fetch all submissions from history
    const fetchSubmissions = async () => {
      try {
        console.log('Fetching submissions history...');
        // Get all history entries
        const data = await historyService.getAllHistory();
        console.log('History data received:', data);
        
        // Filter to only show submissions
        const submissionEntries = Array.isArray(data) 
          ? data.filter(entry => entry.action === 'submit_matrix')
          : [];
        
        console.log('Filtered submission entries:', submissionEntries.length);
        
        // Sort by timestamp (newest first)
        setSubmissions(submissionEntries.sort((a: HistoryEntry, b: HistoryEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error("Error loading submissions:", error);
        toast.error("Failed to load submission data");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSubmissions();
  }, []);

  const viewMatrix = (matrixSnapshot: string) => {
    try {
      console.log("Attempting to parse matrix snapshot...");
      
      // Parse the JSON data
      const parsedData = JSON.parse(matrixSnapshot);
      console.log("Successfully parsed JSON data:", Object.keys(parsedData));
      
      // Handle different matrix data structures
      let matrix: StructuredMatrix;
      
      // Check if the matrix has a data property (new format)
      if (parsedData.data) {
        console.log("Found data property with keys:", Object.keys(parsedData.data));
        
        // Check if data contains the required properties
        if (Array.isArray(parsedData.data.rows) && 
            Array.isArray(parsedData.data.columns) && 
            typeof parsedData.data.dependencies === 'object') {
          matrix = {
            rows: [...parsedData.data.rows],
            columns: [...parsedData.data.columns],
            dependencies: {...parsedData.data.dependencies}
          };
          console.log("Using nested data format with", matrix.rows.length, "rows and", matrix.columns.length, "columns");
        } else {
          console.error("Invalid nested data structure:", 
            "rows:", Array.isArray(parsedData.data.rows), 
            "columns:", Array.isArray(parsedData.data.columns),
            "dependencies:", typeof parsedData.data.dependencies);
          toast.error("Invalid matrix data structure");
          return;
        }
      }
      // Check if matrix has direct properties (old format)
      else if (Array.isArray(parsedData.rows) && 
               Array.isArray(parsedData.columns) && 
               typeof parsedData.dependencies === 'object') {
        matrix = {
          rows: [...parsedData.rows],
          columns: [...parsedData.columns],
          dependencies: {...parsedData.dependencies}
        };
        console.log("Using direct data format with", matrix.rows.length, "rows and", matrix.columns.length, "columns");
      } else {
        console.error("Matrix data is missing required properties:", Object.keys(parsedData));
        toast.error("Invalid matrix data format");
        return;
      }
      
      // Additional validation to ensure we have valid data
      if (!matrix.rows.length || !matrix.columns.length) {
        console.error("Matrix has empty rows or columns");
        toast.error("Matrix data is incomplete");
        return;
      }
      
      // Set the selected matrix and show the modal
      setSelectedMatrix(matrix);
      setShowMatrixModal(true);
      console.log("Matrix loaded successfully with", matrix.rows.length, "rows");
    } catch (error) {
      console.error("Error parsing matrix snapshot:", error);
      toast.error("Failed to load matrix data. The format might be invalid.");
    }
  };

  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!id) {
      toast.error("Cannot delete submission without ID");
      return;
    }
    
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        await historyService.deleteHistoryEntry(id);
        
        // Update state by removing the deleted entry
        setSubmissions(submissions.filter(entry => entry.id !== id));
        
        toast.success("Submission deleted successfully");
      } catch (error) {
        console.error("Error deleting submission:", error);
        toast.error("Failed to delete submission");
      }
    }
  };

  const viewMatrixDetails = (matrixId: string) => {
    router.push(`/matrix/${matrixId}`);
  };

  return (
    <AdminRoute>
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Matrix Submissions</h2>
            <Link href="/admin/matrix" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
              Back to Matrices
            </Link>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              This page shows all user submissions for matrices. Each submission includes the user who submitted it and any comments they provided.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-4">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Time</th>
                    <th className="border border-gray-300 p-2">User</th>
                    <th className="border border-gray-300 p-2">Role</th>
                    <th className="border border-gray-300 p-2">Matrix ID</th>
                    <th className="border border-gray-300 p-2">Details</th>
                    <th className="border border-gray-300 p-2">View Matrix</th>
                    <th className="border border-gray-300 p-2">View Snapshot</th>
                    <th className="border border-gray-300 p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((entry) => (
                    <tr key={entry.id} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="border border-gray-300 p-2">{entry.userId}</td>
                      <td className="border border-gray-300 p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.userRole}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2">{entry.matrixId}</td>
                      <td className="border border-gray-300 p-2">
                        {entry.details}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          onClick={() => entry.matrixId ? viewMatrixDetails(entry.matrixId) : null}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
                        >
                          View Matrix
                        </button>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {entry.matrixSnapshot && (
                          <button
                            onClick={() => entry.matrixSnapshot ? viewMatrix(entry.matrixSnapshot) : null}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
                          >
                            View Snapshot
                          </button>
                        )}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          onClick={() => entry.id && handleDeleteSubmission(entry.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Matrix Modal */}
        {showMatrixModal && selectedMatrix && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-[98vw] h-[98vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">
                  Matrix Snapshot 
                  <span className="text-sm ml-2 text-gray-600">
                    ({selectedMatrix.rows.length} sub-attributes × {selectedMatrix.columns.length} columns)
                  </span>
                </h3>
                <button 
                  onClick={closeMatrixModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <div className="mb-2 text-xs text-gray-600">
                <p>This is a snapshot of the matrix at the time of submission.</p>
              </div>
              
              <div className="overflow-auto flex-grow">
                <table className="border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1 text-center sticky left-0 top-0 bg-gray-100 z-20 min-w-[40px]">ID</th>
                      <th className="border border-gray-300 p-1 text-left sticky left-[40px] top-0 bg-gray-100 z-20 min-w-[180px]">Sub-Attribute</th>
                      <th className="border border-gray-300 p-1 text-center sticky left-[220px] top-0 bg-gray-100 z-20 min-w-[100px]">Category</th>
                      {selectedMatrix.columns.map((column) => (
                        <th key={column.id} className="border border-gray-300 p-1 text-center sticky top-0 bg-gray-100 z-10 w-8">
                          {column.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        // Group rows by category
                        const rowsByCategory = selectedMatrix.rows.reduce((acc, row) => {
                          const category = row.category || 'Uncategorized';
                          if (!acc[category]) {
                            acc[category] = [];
                          }
                          acc[category].push(row);
                          return acc;
                        }, {} as Record<string, typeof selectedMatrix.rows>);
                        
                        return Object.entries(rowsByCategory).map(([category, rows]) => (
                          <Fragment key={category}>
                            {rows.map((row, rowIndex) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-1 text-center sticky left-0 bg-white z-10">{row.id}</td>
                                <td className="border border-gray-300 p-1 text-left sticky left-[40px] bg-white z-10 max-w-[180px] truncate">
                                  {row.name}
                                </td>
                                {rowIndex === 0 ? (
                                  <td 
                                    className="border border-gray-300 p-1 text-center font-bold sticky left-[220px] bg-white z-10" 
                                    rowSpan={rows.length}
                                  >
                                    {category}
                                  </td>
                                ) : null}
                                {selectedMatrix.columns.map((column) => {
                                  const key = `${row.id}_${column.id}`;
                                  // Use Boolean conversion to handle undefined/null values
                                  const value = Boolean(selectedMatrix.dependencies[key]);
                                  const isDisabled = row.id === column.id || row.id > column.id;
                                  const isGreen = row.id > column.id;
                                  
                                  return (
                                    <td 
                                      key={key} 
                                      className={`border border-gray-300 p-0 text-center ${
                                        isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                                      }`}
                                      style={{ width: '24px', height: '24px', minWidth: '24px' }}
                                    >
                                      {value && !isDisabled ? 'x' : ''}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </Fragment>
                        ));
                      } catch (error) {
                        console.error("Error rendering matrix:", error);
                        return (
                          <tr>
                            <td colSpan={3 + selectedMatrix.columns.length} className="text-center text-red-500 p-4">
                              Error rendering matrix. Please check console for details.
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminRoute>
  );
}
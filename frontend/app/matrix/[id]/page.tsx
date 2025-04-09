"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MatrixItem, StructuredMatrix } from "../../../types/matrix";
import { useAuth } from "../../../components/auth/authContext";
import { matrixService, historyService } from "../../../services/api";
import Link from 'next/link';

export default function MatrixDetailPage() {
  const [matrix, setMatrix] = useState<MatrixItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowTotals, setRowTotals] = useState<Record<number, number>>({});
  const [columnTotals, setColumnTotals] = useState<Record<number, number>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [showKeywordModal, setShowKeywordModal] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [keywordError, setKeywordError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const params = useParams();
  const matrixId = params.id as string;
  const { isAuthenticated, userId, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load matrix from API instead of localStorage
    const fetchMatrix = async () => {
      try {
        const data = await matrixService.getMatrixById(matrixId);
        setMatrix(data);
        calculateTotals(data.data);
        
        // Check if user is admin or already authorized via backend
        if (isAdmin() || data.createdBy === userId || data.authorized === true) {
          setIsAuthorized(true);
          setShowKeywordModal(false);
        }
      } catch (error) {
        console.error("Error fetching matrix:", error);
        toast.error("Failed to load matrix");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMatrix();
    }
  }, [matrixId, isAdmin, userId, isAuthenticated]);

  const handleCellChange = async (rowId: number, colId: number) => {
    if (!matrix || !isAuthenticated || !isAuthorized) return;
    
    const key = `${rowId}_${colId}`;
    const newValue = !matrix.data.dependencies[key];
    
    try {
      // Create a copy of the matrix to update
      const updatedMatrix = {
        ...matrix,
        data: {
          ...matrix.data,
          dependencies: {
            ...matrix.data.dependencies,
            [key]: newValue
          }
        }
      };
      
      // Update local state for better UX
      setMatrix(updatedMatrix);
      calculateTotals(updatedMatrix.data);
      
      // Send only the necessary data to the backend
      const updatePayload = {
        title: matrix.title,
        description: matrix.description,
        keyword: matrix.keyword,
        data: updatedMatrix.data
      };
      
      // Save changes to API
      await matrixService.updateMatrix(matrixId, updatePayload);
      
      // We're removing the history entry creation for regular cell changes
      // This way only submissions will appear in history
      
      toast.success(newValue ? "Dependency added" : "Dependency removed");
    } catch (error) {
      console.error("Error updating matrix:", error);
      toast.error("Failed to update matrix");
      
      // If there's an error, revert to the original matrix
      if (matrix) {
        setMatrix({...matrix});
        calculateTotals(matrix.data);
      }
    }
  };

  const calculateTotals = (data: StructuredMatrix) => {
    const rowTotals: Record<number, number> = {};
    const columnTotals: Record<number, number> = {};
    const categoryTotals: Record<string, number> = {};

    // Initialize totals
    data.rows.forEach(row => {
      rowTotals[row.id] = 0;
      if (!categoryTotals[row.category]) {
        categoryTotals[row.category] = 0;
      }
    });
    
    data.columns.forEach(col => {
      columnTotals[col.id] = 0;
    });

    // Calculate totals
    Object.entries(data.dependencies).forEach(([key, value]) => {
      if (value) {
        const [rowId, colId] = key.split('_').map(Number);
        rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
        columnTotals[colId] = (columnTotals[colId] || 0) + 1;
        
        // Find the category for this row
        const row = data.rows.find(r => r.id === rowId);
        if (row) {
          categoryTotals[row.category] = (categoryTotals[row.category] || 0) + 1;
        }
      }
    });

    setRowTotals(rowTotals);
    setColumnTotals(columnTotals);
    setCategoryTotals(categoryTotals);
  };

  const verifyKeyword = async () => {
    if (!matrix) return;
    
    setKeywordError("");
    
    if (!keyword.trim()) {
      setKeywordError("Keyword is required");
      return;
    }
    
    try {
      // Verify keyword through backend API
      const response = await matrixService.verifyMatrixAccess(matrixId, keyword);
      
      if (response.authorized) {
        setIsAuthorized(true);
        setShowKeywordModal(false);
        toast.success("Access granted!");
      } else {
        setKeywordError("Invalid keyword. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying keyword:", error);
      setKeywordError("Failed to verify keyword. Please try again.");
    }
  };

  // Add this near the top of the file with other state variables
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionComment, setSubmissionComment] = useState("");
  
  const handleSubmitMatrix = async () => {
    if (!matrix || !isAuthenticated || !isAuthorized) return;
    
    try {
      // Create a complete matrix snapshot with the correct structure
      // Make sure we include all necessary fields and maintain the exact structure
      const matrixData = {
        id: matrix.id,
        title: matrix.title,
        description: matrix.description,
        keyword: matrix.keyword,
        createdBy: matrix.createdBy,
        createdAt: matrix.createdAt,
        updatedAt: new Date().toISOString(),
        data: {
          rows: matrix.data.rows,
          columns: matrix.data.columns,
          dependencies: matrix.data.dependencies
        }
      };
      
      // Create a snapshot of the current matrix state with all dependencies
      const matrixSnapshot = JSON.stringify(matrixData);
      
      // Calculate totals for the submission record
      const rowTotalValues = Object.values(rowTotals);
      const totalDependencies = rowTotalValues.reduce((sum, val) => sum + val, 0);
      
      // Create a more detailed history entry
      const historyEntry = {
        userId: userId || 'unknown',
        userRole: isAdmin() ? 'admin' : 'user',
        timestamp: new Date().toISOString(),
        action: 'submit_matrix',
        matrixId: matrixId,
        details: submissionComment 
          ? `User submitted matrix "${matrix.title}" with comment: ${submissionComment}`
          : `User submitted matrix "${matrix.title}" with ${totalDependencies} dependencies`,
        matrixSnapshot: matrixSnapshot,
        matrixTitle: matrix.title,
        matrixDescription: matrix.description,
        adminOnly: true // Make sure this is only visible to admins
      };
      
      // Save to API
      await historyService.createHistoryEntry(historyEntry);
      
      // Show success message
      toast.success("Matrix submitted successfully");
      
      // Close modal
      setShowSubmitModal(false);
      setSubmissionComment("");
      
      // If admin, redirect to history page for this matrix
      if (isAdmin()) {
        router.push(`/matrix/${matrixId}/history`);
      }
    } catch (error) {
      console.error("Error submitting matrix:", error);
      toast.error("Failed to submit matrix");
    }
  };
  
  if (loading) {
    return (
      <div className="flex-grow container mx-auto p-4 text-center">
        Loading matrix data...
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex-grow container mx-auto p-4 text-center">
        Matrix not found
      </div>
    );
  }

  // Group rows by category
  const rowsByCategory = matrix.data.rows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {} as Record<string, typeof matrix.data.rows>);

  return (
    <main className="flex-grow container mx-auto p-4">
      {showKeywordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Enter Access Keyword</h3>
            <p className="mb-4 text-gray-600">
              This matrix is protected. Please enter the access keyword to continue.
            </p>
            
            {keywordError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {keywordError}
              </div>
            )}
            
            <div className="mb-4">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter keyword"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={verifyKeyword}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Submit Modal here */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Submit Matrix</h3>
            <p className="mb-4">
              Are you sure you want to submit this matrix? This will create a record for admin review.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                rows={3}
                value={submissionComment}
                onChange={(e) => setSubmissionComment(e.target.value)}
                placeholder="Add any comments about your submission..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMatrix}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{matrix.title}</h2>
          <div className="flex space-x-2">
            {!isAdmin() && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!isAuthorized}
              >
                Submit Matrix
              </button>
            )}
            {isAdmin() && (
              <>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!isAuthorized}
                >
                  Submit Matrix
                </button>
                <Link 
                  href={`/matrix/${matrixId}/history`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  View History
                </Link>
                <Link 
                  href={`/admin/matrix/submissions`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  All Submissions
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 text-center">ID</th>
                <th className="border border-gray-300 p-1 text-left">Sub-Attribute</th>
                <th className="border border-gray-300 p-1 text-center">Category</th>
                {matrix.data.columns.map((column) => (
                  <th key={column.id} className="border border-gray-300 p-1 text-center">
                    {column.id}
                  </th>
                ))}
                <th className="border border-gray-300 p-1 text-center">Total</th>
                <th className="border border-gray-300 p-1 text-center">Category Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rowsByCategory).map(([category, rows], categoryIndex) => (
                <Fragment key={category}>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      <td className="border border-gray-300 p-1 text-center text-xs md:text-sm">{row.id}</td>
                      <td className="border border-gray-300 p-1 text-left text-xs md:text-sm">
                        {row.name}
                      </td>
                      {rowIndex === 0 ? (
                        <td 
                          className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm" 
                          rowSpan={rows.length}
                        >
                          {category}
                        </td>
                      ) : null}
                      {matrix.data.columns.map((column) => {
                        const key = `${row.id}_${column.id}`;
                        const value = matrix.data.dependencies[key] || false;
                        const isDisabled = row.id === column.id || row.id > column.id;
                        const isGreen = row.id > column.id;
                        
                        return (
                          <td 
                            key={key} 
                            className={`border border-gray-300 p-0 text-center ${
                              isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                            }`}
                            onClick={() => isAuthorized && !isDisabled && handleCellChange(row.id, column.id)}
                            style={{ cursor: isAuthorized && !isDisabled ? 'pointer' : 'not-allowed', width: '20px', height: '20px', maxWidth: '30px' }}
                          >
                            {value && !isDisabled ? 'x' : ''}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm">
                        {rowTotals[row.id] || 0}
                      </td>
                      {rowIndex === 0 ? (
                        <td 
                          className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm" 
                          rowSpan={rows.length}
                        >
                          {categoryTotals[category] || 0}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
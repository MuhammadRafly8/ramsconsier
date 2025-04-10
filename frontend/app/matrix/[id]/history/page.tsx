"use client";

import { useEffect, useState, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../components/auth/authContext';
import HistoryTable from '../../../../components/history/historyTable';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { StructuredMatrix } from '../../../../types/matrix';

export default function MatrixHistoryPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matrixId = params.id as string;
  
  // Add state variables inside the component
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);

  // Add the viewMatrix function inside the component
  const viewMatrix = (matrixSnapshot: string) => {
    try {
      console.log("Parsing matrix snapshot...");
      const parsedData = JSON.parse(matrixSnapshot);
      
      // Handle different matrix data structures
      let matrix;
      
      // Check if the matrix has a data property (new format)
      if (parsedData.data && parsedData.data.rows && parsedData.data.columns && parsedData.data.dependencies) {
        // Extract the structured data from the nested format
        matrix = {
          rows: parsedData.data.rows,
          columns: parsedData.data.columns,
          dependencies: parsedData.data.dependencies
        };
      } 
      // Check if matrix has direct properties (old format)
      else if (parsedData.rows && parsedData.columns && parsedData.dependencies) {
        matrix = parsedData;
      }
      // If neither format is valid
      else {
        console.error("Matrix data is missing required properties:", parsedData);
        toast.error("Invalid matrix data format");
        return;
      }
      
      setSelectedMatrix(matrix);
      setShowMatrixModal(true);
    } catch (error) {
      console.error("Error parsing matrix snapshot:", error);
      toast.error("Failed to parse matrix data");
    }
  };

  // Add the closeMatrixModal function inside the component
  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };

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
        <HistoryTable matrixId={matrixId} viewMatrix={viewMatrix} />
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
              <div className="min-w-max">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1 text-center">ID</th>
                      <th className="border border-gray-300 p-1 text-left">Sub-Attribute</th>
                      <th className="border border-gray-300 p-1 text-center">Category</th>
                      <th className="border border-gray-300 p-1 text-center">Relation To</th>
                      {selectedMatrix.columns.map((column) => (
                        <th 
                          key={column.id} 
                          className={`border border-gray-300 p-1 text-center ${
                            column.id % 5 === 0 ? 'border-r-2 border-r-gray-500' : ''
                          }`}
                        >
                          {column.id}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-1 text-center">Total</th>
                      <th className="border border-gray-300 p-1 text-center">Category Total</th>
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
                        
                        // Calculate row totals
                        const rowTotals: Record<number, number> = {};
                        selectedMatrix.rows.forEach(row => {
                          rowTotals[row.id] = 0;
                        });
                        
                        Object.entries(selectedMatrix.dependencies).forEach(([key, value]) => {
                          if (value) {
                            const [rowId] = key.split('_').map(Number);
                            rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
                          }
                        });
                        
                        // Calculate category totals
                        const categoryTotals: Record<string, number> = {};
                        Object.entries(rowsByCategory).forEach(([category, rows]) => {
                          categoryTotals[category] = rows.reduce((sum, row) => sum + (rowTotals[row.id] || 0), 0);
                        });
                        
                        // Calculate subtotals for each row
                        const calculateSubtotals = (rowId: number) => {
                          let count = 0;
                          selectedMatrix.columns.forEach(column => {
                            const key = `${rowId}_${column.id}`;
                            if (selectedMatrix.dependencies[key] && column.id < rowId) {
                              count++;
                            }
                          });
                          return count;
                        };
                        
                        return Object.entries(rowsByCategory).map(([category, rows]) => (
                          <Fragment key={category}>
                            {rows.map((row, rowIndex) => (
                              <tr key={row.id} className={row.id % 5 === 0 ? 'border-b-2 border-b-gray-500' : ''}>
                                <td className="border border-gray-300 p-1 text-center">{row.id}</td>
                                <td className="border border-gray-300 p-1 text-left">
                                  {row.name}
                                </td>
                                {rowIndex === 0 ? (
                                  <td 
                                    className="border border-gray-300 p-1 text-center font-bold" 
                                    rowSpan={rows.length}
                                  >
                                    {category}
                                  </td>
                                ) : null}
                                <td className="border border-gray-300 p-1 text-center">
                                  {calculateSubtotals(row.id)}
                                </td>
                                {selectedMatrix.columns.map((column) => {
                                  const key = `${row.id}_${column.id}`;
                                  const value = Boolean(selectedMatrix.dependencies[key]);
                                  const isDisabled = row.id === column.id || row.id > column.id;
                                  const isGreen = row.id > column.id;
                                  
                                  // Add a visual separator at the diagonal
                                  const isDiagonal = row.id === column.id;
                                  const isNearDiagonal = Math.abs(row.id - column.id) <= 1;
                                  
                                  return (
                                    <td 
                                      key={key} 
                                      className={`border border-gray-300 p-0 text-center ${
                                        isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                                      } ${
                                        isDiagonal ? 'border-2 border-red-500' : ''
                                      } ${
                                        isNearDiagonal ? 'border-r border-r-red-300' : ''
                                      } ${
                                        column.id % 5 === 0 ? 'border-r-2 border-r-gray-500' : ''
                                      }`}
                                      style={{ width: '20px', height: '20px', maxWidth: '30px' }}
                                    >
                                      {value && !isDisabled ? 'x' : ''}
                                    </td>
                                  );
                                })}
                                <td className="border border-gray-300 p-1 text-center font-bold">
                                  {rowTotals[row.id] || 0}
                                </td>
                                {rowIndex === 0 ? (
                                  <td 
                                    className="border border-gray-300 p-1 text-center font-bold" 
                                    rowSpan={rows.length}
                                  >
                                    {categoryTotals[category] || 0}
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                          </Fragment>
                        ));
                      } catch (error) {
                        console.error("Error rendering matrix:", error);
                        return (
                          <tr>
                            <td colSpan={5 + selectedMatrix.columns.length} className="text-center text-red-500 p-4">
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
        </div>
      )}
    </main>
  );
}
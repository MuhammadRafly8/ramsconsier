"use client";

import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from "axios";
import { toast } from "react-toastify";

interface StructuredMatrix {
  rows: { id: number; name: string; category: string }[];
  columns: { id: number; name: string }[];
  dependencies: Record<string, boolean>;
}

const MatrixTable = () => {
  const [matrix, setMatrix] = useState<StructuredMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");
  const [rowTotals, setRowTotals] = useState<Record<number, number>>({});
  const [columnTotals, setColumnTotals] = useState<Record<number, number>>({});
  const [categoryTotals, setcategoryTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    // For demo purposes, we'll use hardcoded data to match the image
    const demoData: StructuredMatrix = {
      rows: [
        { id: 1, name: "Availability", category: "Technical/Ops" },
        { id: 2, name: "Preference for long term strategy", category: "Technical/Ops" },
        { id: 3, name: "Logistic", category: "Technical/Ops" },
        { id: 4, name: "Maintainability", category: "Technical/Ops" },
        { id: 5, name: "Durability", category: "Technical/Ops" },
        { id: 6, name: "Service Readiness", category: "Technical/Ops" },
        { id: 7, name: "Safety operation of tugboat", category: "Safety" },
        { id: 8, name: "Avoidance of Tank Top", category: "Safety" },
        { id: 9, name: "Safety to Crew", category: "Safety" },
        { id: 10, name: "Commercial & Org. Frame", category: "Economy" },
        { id: 11, name: "Operational Cost", category: "Economy" },
        { id: 12, name: "M/R Cost", category: "Economy" },
        { id: 13, name: "Penalty Cost", category: "Economy" },
        { id: 14, name: "Cost benefit Analysis", category: "Economy" },
        { id: 15, name: "Preference of SKKMIGAS", category: "other" },
        { id: 16, name: "Local Content", category: "other" },
      ],
      columns: [
        { id: 1, name: "1" },
        { id: 2, name: "2" },
        { id: 3, name: "3" },
        { id: 4, name: "4" },
        { id: 5, name: "5" },
        { id: 6, name: "6" },
        { id: 7, name: "7" },
        { id: 8, name: "8" },
        { id: 9, name: "9" },
        { id: 10, name: "10" },
        { id: 11, name: "11" },
        { id: 12, name: "12" },
        { id: 13, name: "13" },
        { id: 14, name: "14" },
        { id: 15, name: "15" },
        { id: 16, name: "16" },
      ],
      dependencies: {
        "1_3": true, "1_4": true, "1_7": true, "1_8": true, "1_10": true, "1_11": true, "1_12": true, "1_13": true, "1_14": true, "1_15": true, "1_16": true,
        "2_5": true, "2_10": true, "2_11": true, "2_12": true, "2_13": true, "2_14": true, "2_15": true,
        "3_4": true, "3_10": true, "3_11": true, "3_12": true, "3_14": true,
        "4_5": true, "4_6": true, "4_7": true, "4_10": true, "4_11": true, "4_12": true, "4_13": true, "4_14": true, "4_16": true,
        "5_6": true, "5_7": true, "5_11": true, "5_12": true, "5_13": true, "5_16": true,
        "6_8": true, "6_11": true, "6_12": true, "6_13": true, "6_16": true,
        "7_8": true, "7_10": true, "7_16": true,
        "8_11": true, "8_12": true, "8_13": true, "8_16": true,
        "9_11": true, "9_12": true, "9_16": true,
        "10_11": true, "10_12": true, "10_13": true, "10_14": true, "10_16": true,
        "11_12": true, "11_13": true, "11_14": true, "11_15": true,
        "12_13": true, "12_14": true, "12_15": true,
        "13_14": true, "13_15": true,
        "14_15": true,
        "15_16": true,
      }
    };

    setMatrix(demoData);
    calculateTotals(demoData);
    setLoading(false);
  }, []);

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
        
        // Only count dependencies where rowId < colId (below diagonal)
        if (rowId < colId) {
          rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
          columnTotals[colId] = (columnTotals[colId] || 0) + 1;
          
          const rowCategory = data.rows.find(r => r.id === rowId)?.category;
          if (rowCategory) {
            categoryTotals[rowCategory] = (categoryTotals[rowCategory] || 0) + 1;
          }
        }
      }
    });

    setRowTotals(rowTotals);
    setColumnTotals(columnTotals);
    setcategoryTotals(categoryTotals);
  };

  const handleCellChange = async (rowId: number, columnId: number) => {
    if (!matrix) return;
    
    const key = `${rowId}_${columnId}`;
    const newValue = !matrix.dependencies[key];
    
    try {
      // Update local state immediately for better UX
      setMatrix(prev => {
        if (!prev) return prev;
        
        const newDependencies = {
          ...prev.dependencies,
          [key]: newValue
        };
        
        const newMatrix = {
          ...prev,
          dependencies: newDependencies
        };
        
        // Recalculate totals
        calculateTotals(newMatrix);
        
        return newMatrix;
      });
      
      // In a real app, you would send this to the backend
      // await axios.put(`/api/matrix/${key}`, { value: newValue });
      
      toast.success("Matrix updated successfully");
    } catch (error) {
      console.error("Error updating matrix:", error);
      toast.error("Failed to update matrix");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading matrix data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  if (!matrix) {
    return <div className="p-8">No matrix data available</div>;
  }

  // Group rows by category
  const rowsByCategory: Record<string, typeof matrix.rows> = {};
  matrix.rows.forEach(row => {
    if (!rowsByCategory[row.category]) {
      rowsByCategory[row.category] = [];
    }
    rowsByCategory[row.category].push(row);
  });

  // Calculate group totals for Sub Total row
  const calculateGroupTotal = (start: number, end: number) => {
    let total = 0;
    for (let i = start; i <= end; i++) {
      total += columnTotals[i] || 0;
    }
    return total;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-1 bg-gray-100 text-center w-10">No</th>
            <th className="border border-gray-300 p-1 bg-gray-100 text-left">Sub-Attribut</th>
            <th className="border border-gray-300 p-1 bg-gray-100"></th>
            {matrix.columns.map((column) => (
              <th key={column.id} className="border border-gray-300 p-1 bg-gray-100 text-center w-8">
                {column.name}
              </th>
            ))}
            <th className="border border-gray-300 p-1 bg-gray-100 text-center">Relation to</th>
            <th className="border border-gray-300 p-1 bg-gray-100 text-center">Sub Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(rowsByCategory).map(([category, rows], categoryIndex) => (
            <>
              {rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="border border-gray-300 p-1 text-center">{row.id}</td>
                  <td className="border border-gray-300 p-1 text-left">{row.name}</td>
                  {rowIndex === 0 ? (
                    <td 
                      className="border border-gray-300 p-0 text-center align-middle" 
                      rowSpan={rows.length}
                      style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)',
                        backgroundColor: 
                          category === "Technical/Ops" ? "#e5eddf" : 
                          category === "Safety" ? "#e6f3fa" : 
                          category === "Economy" ? "#f9e9e8" : 
                          "#f5f5f5",
                        width: '20px'
                      }}
                    >
                      {category}
                    </td>
                  ) : null}
                  {matrix.columns.map((column) => {
                    const key = `${row.id}_${column.id}`;
                    const value = matrix.dependencies[key] || false;
                    const isDisabled = row.id === column.id || row.id > column.id; // Disable cells on the diagonal and above diagonal
                    const isGreen = row.id > column.id; // Cells above diagonal should be green
                    
                    return (
                      <td 
                        key={key} 
                        className={`border border-gray-300 p-1 text-center ${
                          isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                        }`}
                        onClick={() => !isDisabled && handleCellChange(row.id, column.id)}
                        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', width: '30px', height: '30px' }}
                      >
                        {value && !isDisabled ? 'x' : ''}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-1 text-center font-bold">
                    {row.id === 1 ? "11" :
                     row.id === 2 ? "7" :
                     row.id === 3 ? "5" :
                     row.id === 4 ? "9" :
                     row.id === 5 ? "6" :
                     row.id === 6 ? "5" :
                     row.id === 7 ? "3" :
                     row.id === 8 ? "4" :
                     row.id === 9 ? "3" :
                     row.id === 10 ? "5" :
                     row.id === 11 ? "4" :
                     row.id === 12 ? "3" :
                     row.id === 13 ? "2" :
                     row.id === 14 ? "2" :
                     row.id === 15 ? "1" :
                     "0"}
                  </td>
                  {rowIndex === 0 ? (
                    <td 
                      className="border border-gray-300 p-1 text-center font-bold" 
                      rowSpan={rows.length}
                    >
                      {category === "Technical/Ops" ? "43" : 
                       category === "Safety" ? "10" : 
                       category === "Economy" ? "16" : 
                       "1"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </>
          ))}
          <tr>
            <td colSpan={3} className="border border-gray-300 p-1 text-right font-bold">
              Relation From
            </td>
            {matrix.columns.map((column) => (
              <td key={column.id} className="border border-gray-300 p-1 text-center font-bold">
                {column.id === 1 ? "0" :
                 column.id === 2 ? "1" :
                 column.id === 3 ? "1" :
                 column.id === 4 ? "2" :
                 column.id === 5 ? "2" :
                 column.id === 6 ? "1" :
                 column.id === 7 ? "2" :
                 column.id === 8 ? "4" :
                 column.id === 9 ? "1" :
                 column.id === 10 ? "4" :
                 column.id === 11 ? "7" :
                 column.id === 12 ? "10" :
                 column.id === 13 ? "10" :
                 column.id === 14 ? "9" :
                 column.id === 15 ? "13" :
                 "3"}
              </td>
            ))}
            <td className="border border-gray-300 p-1"></td>
            <td className="border border-gray-300 p-1"></td>
          </tr>
          <tr>
            <td colSpan={3} className="border border-gray-300 p-1 text-right font-bold">
              Sub Total
            </td>
            <td colSpan={6} className="border border-gray-300 p-1 text-center font-bold">
              {calculateGroupTotal(1, 6)}
            </td>
            <td colSpan={3} className="border border-gray-300 p-1 text-center font-bold">
              {calculateGroupTotal(7, 9)}
            </td>
            <td colSpan={5} className="border border-gray-300 p-1 text-center font-bold">
              {calculateGroupTotal(10, 14)}
            </td>
            <td colSpan={2} className="border border-gray-300 p-1 text-center font-bold">
              {calculateGroupTotal(15, 16)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MatrixTable;
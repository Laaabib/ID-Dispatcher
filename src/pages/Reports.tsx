import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import InventoryReports from './InventoryReports';
import AttendanceReports from './AttendanceReports';
import { BarChart2, FileText, Package } from 'lucide-react';

export default function Reports() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState(role === 'admin' ? 'inventory' : 'attendance');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary-600" />
            Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View and export various reports</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory & Consumption
          </button>
        )}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Attendance Reports
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'inventory' && role === 'admin' && (
          <InventoryReports />
        )}
        {activeTab === 'attendance' && (
          <AttendanceReports />
        )}
      </div>
    </div>
  );
}

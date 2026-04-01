import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Calendar, Search, Download, Filter, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { downloadMonthlyAttendancePDF, MonthlyAttendanceData } from '../lib/pdf';

export default function AttendanceReports() {
  const { role, user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [myEmployeeIds, setMyEmployeeIds] = useState<string[]>([]);

  const isAdmin = ['admin', 'admin_approver', 'it_approver'].includes(role || '');

  useEffect(() => {
    // Fetch employees to map IDs to names
    const empQ = query(collection(db, 'employees'));
    const unsubEmp = onSnapshot(empQ, (snapshot) => {
      const empMap: Record<string, any> = {};
      const myIds: string[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        empMap[data.employeeId] = data;
        
        // If not admin, try to find their employee records
        if (!isAdmin && data.name.toLowerCase() === user?.displayName?.toLowerCase()) {
          myIds.push(data.employeeId);
        }
      });
      
      setEmployees(empMap);
      setMyEmployeeIds(myIds);
      
      // Now fetch attendance
      let attQ = query(collection(db, 'attendance'));
      
      // If not admin, we should only show their own attendance
      // Firestore doesn't support 'in' with empty arrays, so handle that
      if (!isAdmin) {
        if (myIds.length > 0) {
          attQ = query(collection(db, 'attendance'), where('employeeId', 'in', myIds));
        } else {
          // No employee profile found for this user
          setAttendance([]);
          setLoading(false);
          return;
        }
      }
      
      const unsubAtt = onSnapshot(attQ, (attSnapshot) => {
        const attData = attSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        // Sort by date descending
        attData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendance(attData);
        setLoading(false);
      });

      return () => unsubAtt();
    });

    return () => unsubEmp();
  }, [isAdmin, user]);

  const filteredAttendance = attendance.filter(record => {
    const emp = employees[record.employeeId];
    const matchesSearch = emp ? (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    ) : record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter ? record.date === dateFilter : true;
    const matchesMonth = monthFilter ? record.date.startsWith(monthFilter) : true;
    const matchesDept = departmentFilter && emp ? emp.department === departmentFilter : true;
    
    return matchesSearch && matchesDate && matchesMonth && matchesDept;
  });

  const departments = Array.from(new Set(Object.values(employees).map(e => e.department).filter(Boolean)));

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Check In', 'Check Out', 'Status'];
    const csvData = filteredAttendance.map(record => {
      const emp = employees[record.employeeId] || {};
      return [
        record.date,
        record.employeeId,
        emp.name || 'Unknown',
        emp.department || 'Unknown',
        record.checkInTime || '-',
        record.checkOutTime || '-',
        record.status
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMonthlyPDF = async () => {
    if (!monthFilter) {
      toast.error("Please select a month to export");
      return;
    }

    // Calculate monthly summary
    const summaryMap: Record<string, MonthlyAttendanceData> = {};

    // Only consider records for the selected month and department
    const monthlyRecords = attendance.filter(record => {
      const emp = employees[record.employeeId];
      const matchesMonth = record.date.startsWith(monthFilter);
      const matchesDept = departmentFilter && emp ? emp.department === departmentFilter : true;
      return matchesMonth && matchesDept;
    });

    if (monthlyRecords.length === 0) {
      toast.error("No attendance records found for the selected criteria");
      return;
    }

    monthlyRecords.forEach(record => {
      const emp = employees[record.employeeId] || { name: 'Unknown', department: 'Unknown' };
      
      if (!summaryMap[record.employeeId]) {
        summaryMap[record.employeeId] = {
          employeeId: record.employeeId,
          name: emp.name,
          department: emp.department,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalDays: 0
        };
      }

      summaryMap[record.employeeId].totalDays++;
      
      if (record.status === 'Present') {
        summaryMap[record.employeeId].presentDays++;
      } else if (record.status === 'Absent') {
        summaryMap[record.employeeId].absentDays++;
      } else if (record.status === 'Late' || record.status === 'Half Day') {
        summaryMap[record.employeeId].lateDays++;
      }
    });

    const summaryData = Object.values(summaryMap).sort((a, b) => a.name.localeCompare(b.name));

    try {
      await downloadMonthlyAttendancePDF(
        monthFilter,
        departmentFilter,
        summaryData,
        user?.displayName || user?.email || 'Admin'
      );
      toast.success("Monthly report exported successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={handleExportMonthlyPDF} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" /> Monthly PDF
            </Button>
          )}
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
                />
              </>
            )}
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="text-slate-500">
                Clear Date
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Employee ID</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Check In</th>
                <th className="pb-3 font-medium">Check Out</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredAttendance.map((record) => {
                const emp = employees[record.employeeId] || {};
                return (
                  <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{record.date}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{record.employeeId}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{emp.name || 'Unknown'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{emp.department || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{record.checkInTime || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{record.checkOutTime || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : record.status === 'Absent'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

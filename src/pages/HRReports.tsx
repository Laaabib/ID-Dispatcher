import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Download, Users, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function HRReports() {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubLeaves = onSnapshot(collection(db, 'leave_applications'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);

    return () => {
      unsubEmployees();
      unsubLeaves();
      unsubAttendance();
    };
  }, []);

  const handleExportEmployees = () => {
    if (employees.length === 0) {
      toast.error("No employee data to export");
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Basic Salary', 'House Allowance', 'Service Charge'];
    const csvData = employees.map(emp => [
      emp.employeeId || '',
      emp.name || '',
      emp.department || '',
      emp.designation || '',
      emp.joiningDate || '',
      emp.basicSalary || '',
      emp.houseAllowance || '',
      emp.serviceCharge || ''
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, 'employee_directory');
  };

  const handleExportLeaves = () => {
    if (leaves.length === 0) {
      toast.error("No leave data to export");
      return;
    }

    const headers = ['Employee ID', 'Name', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status'];
    const csvData = leaves.map(leave => [
      leave.employeeId || '',
      leave.employeeName || '',
      leave.leaveType || '',
      leave.startDate || '',
      leave.endDate || '',
      leave.reason ? `"${leave.reason}"` : '',
      leave.status || ''
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, 'leave_history');
  };

  const handleExportPayroll = () => {
    if (employees.length === 0) {
      toast.error("No employee data to compute payroll");
      return;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const headers = ['Employee ID', 'Name', 'Department', 'Working Days', 'Present Days', 'Earned Basic', 'House Allowance', 'Service Charge', 'Net Pay'];
    
    const csvData = employees.map(emp => {
      const empAttendances = attendance.filter(att => {
        if (!att.date) return false;
        const attDate = new Date(att.date);
        return att.employeeId === emp.id && attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear && att.status === 'Present';
      });

      const presentDays = empAttendances.length;
      const basicSalary = parseFloat(emp.basicSalary || '4000');
      const houseAllowance = parseFloat(emp.houseAllowance || '500');
      const serviceCharge = parseFloat(emp.serviceCharge || '0');

      const basicPerDay = basicSalary / totalDaysInMonth;
      const earnedBasic = basicPerDay * presentDays;
      const grossPay = earnedBasic + houseAllowance;
      const netPay = grossPay + serviceCharge;

      return [
        emp.employeeId || '',
        emp.name || '',
        emp.department || '',
        totalDaysInMonth.toString(),
        presentDays.toString(),
        earnedBasic.toFixed(2),
        houseAllowance.toFixed(2),
        serviceCharge.toFixed(2),
        netPay.toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, 'payroll_report');
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading HR reports...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full">
          <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Employee Directory</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Export complete list of employees with salary details.</p>
        </div>
        <Button onClick={handleExportEmployees} className="w-full mt-2 gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full">
          <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Leave Applications</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Export full leave history for all employees.</p>
        </div>
        <Button onClick={handleExportLeaves} className="w-full mt-2 gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
          <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Payroll</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Export exact payroll calculations based on current attendance.</p>
        </div>
        <Button onClick={handleExportPayroll} className="w-full mt-2 gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>
    </div>
  );
}

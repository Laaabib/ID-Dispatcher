import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDocs, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Briefcase, 
  DollarSign, 
  Calendar, 
  FileText, 
  Edit3, 
  Save, 
  X,
  Clock,
  User as UserIcon,
  Download,
  AlertCircle,
  Calculator,
  Banknote,
  Wallet,
  Coins,
  CheckCircle,
  Clock as ClockIcon,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import LeaveAdmin from './LeaveAdmin';
import LeaveApplication from './LeaveApplication';
import Employees from './Employees';
import Attendance from './Attendance';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LeaveCalendar = ({ leaves, onDayClick }: { leaves: any[], onDayClick: (date: string, dayLeaves: any[]) => void }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="mt-6">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Leave Calendar ({monthName} {currentYear})</h2>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="p-1 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800/20 border border-transparent"></div>
            ))}
            {days.map(day => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Helper to safely check if it is today
              const timeNow = new Date();
              const isToday = currentYear === timeNow.getFullYear() && currentMonth === timeNow.getMonth() && day === timeNow.getDate();
              
              const dayLeaves = leaves.filter(l => l.status === 'Approved by Admin' && dateStr >= l.startDate && dateStr <= l.endDate);
              
              return (
                <div 
                   key={day} 
                   onClick={() => onDayClick(dateStr, dayLeaves)}
                   className={`p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] rounded-lg border flex flex-col cursor-pointer transition-all hover:ring-2 hover:ring-primary-500 hover:ring-opacity-50 ${isToday ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                  <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'} mb-1`}>{day}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                    {dayLeaves.map(l => (
                      <div key={l.id} className="text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 truncate" title={`${l.employeeName} (${l.leaveType})`}>
                        {l.employeeName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PayrollBreakdownModal = ({ employee, calculatedSalary, onClose }: { employee: any, calculatedSalary: any, onClose: () => void }) => {
  if (!employee || !calculatedSalary) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Payroll Breakdown</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm">
           <p className="text-sm font-medium text-slate-500">Calculated for <span className="font-bold text-slate-900 dark:text-white">{employee.name}</span></p>
           
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
             <div className="flex justify-between">
               <span className="text-slate-500">Total Working Days:</span>
               <span className="font-medium text-slate-900 dark:text-white">{calculatedSalary.totalDays}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Days Present:</span>
               <span className="font-medium text-slate-900 dark:text-white">{calculatedSalary.presentDays}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Earned Basic Salary:</span>
               <span className="font-medium text-slate-900 dark:text-white">৳{calculatedSalary.earnedBasic.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">House Allowance:</span>
               <span className="font-medium text-slate-900 dark:text-white">৳{calculatedSalary.houseAllowance.toFixed(2)}</span>
             </div>
             <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold">
               <span className="text-slate-700 dark:text-slate-300">Gross Pay:</span>
               <span className="text-slate-900 dark:text-white">৳{calculatedSalary.grossPay.toFixed(2)}</span>
             </div>
           </div>

           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
             <div className="flex justify-between">
               <span className="text-slate-500">Service Charge:</span>
               <span className="font-medium text-slate-900 dark:text-white">+৳{calculatedSalary.serviceCharge.toFixed(2)}</span>
             </div>
           </div>

           <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex justify-between items-center">
             <span className="font-bold text-emerald-900 dark:text-emerald-100 text-base">Net Pay (Total):</span>
             <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">৳{calculatedSalary.netPay.toFixed(2)}</span>
           </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default function HRManagement() {
  const { user, role } = useAuth();
  const isAdminOrHR = role === 'admin' || role === 'admin_approver' || role === 'hr_manager';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payroll' | 'my_leaves' | 'leave_admin' | 'attendance' | 'employees' | 'attendance_system'>(isAdminOrHR ? 'dashboard' : 'attendance_system');
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [previousLeaves, setPreviousLeaves] = useState<any[]>([]);

  const [salarySetupEmp, setSalarySetupEmp] = useState<any>(null);
  const [salaryForm, setSalaryForm] = useState({ basicSalary: '', houseAllowance: '', serviceCharge: '' });

  const [salaryCalcEmp, setSalaryCalcEmp] = useState<any>(null);
  const [calculatedSalary, setCalculatedSalary] = useState<{
    totalDays: number;
    presentDays: number;
    basicPerDay: number;
    earnedBasic: number;
    houseAllowance: number;
    serviceCharge: number;
    grossPay: number;
    netPay: number;
  } | null>(null);

  const [selectedLeaveDate, setSelectedLeaveDate] = useState<string | null>(null);
  const [selectedDayLeaves, setSelectedDayLeaves] = useState<any[]>([]);
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [newLeaveData, setNewLeaveData] = useState({ employeeId: '', leaveType: 'Casual', reason: '', endDate: '' });

  const handleDayClick = (date: string, dayLeaves: any[]) => {
    setSelectedLeaveDate(date);
    setSelectedDayLeaves(dayLeaves);
    setIsAddingLeave(false);
    setNewLeaveData({ employeeId: '', leaveType: 'Casual', reason: '', endDate: date });
  };

  const handleAddLeaveSubmit = async () => {
    if (!newLeaveData.employeeId || !selectedLeaveDate) return;
    const emp = employees.find(e => e.id === newLeaveData.employeeId);
    if (!emp) return;

    try {
      await addDoc(collection(db, 'leave_applications'), {
        employeeId: emp.id,
        employeeName: emp.name,
        leaveType: newLeaveData.leaveType,
        startDate: selectedLeaveDate,
        endDate: newLeaveData.endDate || selectedLeaveDate,
        reason: newLeaveData.reason || 'Added by HR',
        status: 'Approved by Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Leave added successfully');
      setIsAddingLeave(false);
      setNewLeaveData({ employeeId: '', leaveType: 'Casual', reason: '', endDate: selectedLeaveDate });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add leave');
    }
  };

  // Notify on leave status changes
  useEffect(() => {
    if (previousLeaves.length > 0 && leaves.length > 0) {
      leaves.forEach((leave) => {
        const prev = previousLeaves.find((p) => p.id === leave.id);
        if (prev && prev.status !== leave.status && leave.employeeEmail === user?.email) {
          if (leave.status === 'Approved by Admin') {
            toast.success(`Your leave from ${leave.startDate} to ${leave.endDate} was approved!`);
          } else if (leave.status === 'Rejected') {
            toast.error(`Your leave from ${leave.startDate} to ${leave.endDate} was rejected.`);
          } else if (leave.status === 'Approved by HOD') {
            toast.success(`Your leave from ${leave.startDate} to ${leave.endDate} was approved by HOD.`);
          }
        }
      });
    }
    setPreviousLeaves(leaves);
  }, [leaves, user?.email]);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAttendances = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubLeaves = onSnapshot(collection(db, 'leave_applications'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubEmployees();
      unsubAttendances();
      unsubLeaves();
    };
  }, []);

  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ checkInTime: '', checkOutTime: '', status: '' });

  const handleEditAttendance = (att: any) => {
    setEditingAttendance(att.id);
    setAttendanceForm({
      checkInTime: att.checkInTime || '',
      checkOutTime: att.checkOutTime || '',
      status: att.status || 'Present'
    });
  };

  const handleSaveAttendance = async (attId: string) => {
    try {
      await updateDoc(doc(db, 'attendance', attId), attendanceForm);
      setEditingAttendance(null);
      toast.success("Attendance updated successfully");
    } catch (error) {
      toast.error("Failed to update attendance");
    }
  };

  // Payroll Section logic
  const [payrollData, setPayrollData] = useState<Record<string, any>>({});
  
  const handleOpenSalarySetup = (emp: any) => {
    setSalarySetupEmp(emp);
    setSalaryForm({
      basicSalary: emp.basicSalary || '4000',
      houseAllowance: emp.houseAllowance || '500',
      serviceCharge: emp.serviceCharge || '0'
    });
  };

  const handleSaveSalary = async () => {
    if (!salarySetupEmp) return;
    try {
      await updateDoc(doc(db, 'employees', salarySetupEmp.id), {
        basicSalary: salaryForm.basicSalary,
        houseAllowance: salaryForm.houseAllowance,
        serviceCharge: salaryForm.serviceCharge,
        updatedAt: new Date().toISOString()
      });
      toast.success("Salary structure updated successfully");
      setSalarySetupEmp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "employees");
    }
  };

  const generatePayroll = (empId: string) => {
    const employee = employees.find(e => e.id === empId);
    if (employee) {
      generatePayslipPDF(employee);
      toast.success("Payslip generated successfully");
    }
  };

  const calculateSalary = (empId: string) => {
    const employee = employees.find(e => e.id === empId);
    if (!employee) return;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const empAttendances = attendances.filter(att => {
      if (!att.date) return false;
      const attDate = new Date(att.date);
      return att.employeeId === empId && attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear && att.status === 'Present';
    });

    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const presentDays = empAttendances.length;

    const basicSalary = parseFloat(employee.basicSalary || '4000');
    const houseAllowance = parseFloat(employee.houseAllowance || '500');
    const serviceCharge = parseFloat(employee.serviceCharge || '0');

    const basicPerDay = basicSalary / totalDaysInMonth;
    const earnedBasic = basicPerDay * presentDays;

    const grossPay = earnedBasic + houseAllowance;
    const netPay = grossPay + serviceCharge;

    setCalculatedSalary({
       totalDays: totalDaysInMonth,
       presentDays,
       basicPerDay,
       earnedBasic,
       houseAllowance,
       serviceCharge,
       grossPay,
       netPay
    });
    setSalaryCalcEmp(employee);
  };

  const payrollTotals = useMemo(() => {
    const totalBasic = employees.reduce((sum, e) => sum + parseFloat(e.basicSalary || '4000'), 0);
    const totalHouse = employees.reduce((sum, e) => sum + parseFloat(e.houseAllowance || '500'), 0);
    const totalServiceCharge = employees.reduce((sum, e) => sum + parseFloat(e.serviceCharge || '0'), 0);
    return { totalBasic, totalHouse, totalServiceCharge };
  }, [employees]);

  const payrollExpenseData = useMemo(() => {
    return [
      {
        name: 'Monthly Payroll',
        'Basic Salary': payrollTotals.totalBasic,
        'House Allowance': payrollTotals.totalHouse,
        'Service Charge': payrollTotals.totalServiceCharge,
      }
    ];
  }, [payrollTotals]);

  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    return Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  const leaveStats = useMemo(() => {
    const timeNow = new Date();
    const currentYearStr = timeNow.getFullYear().toString();
    const currentMonthStr = String(timeNow.getMonth() + 1).padStart(2, '0');
    const prefix = `${currentYearStr}-${currentMonthStr}`;

    let approved = 0;
    let pending = 0;
    let rejected = 0;

    leaves.forEach(l => {
      if (l.startDate?.startsWith(prefix) || l.endDate?.startsWith(prefix)) {
        if (l.status === 'Approved by Admin') {
          approved++;
        } else if (l.status === 'Rejected') {
          rejected++;
        } else {
          pending++;
        }
      }
    });

    return { approved, pending, rejected };
  }, [leaves]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#f43f5e'];


  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading HR Data...</div>;
  }

  const TabButton = ({ value, label }: { value: any, label: string }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out outline-none ${
        activeTab === value
          ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 transform scale-[1.02]'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            HR Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage payroll, attendance, and leaves</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex-wrap gap-1">
          {isAdminOrHR && <TabButton value="dashboard" label="Dashboard" />}
          
          {isAdminOrHR && (
            <>
              <TabButton value="employees" label="Employees" />
              <TabButton value="payroll" label="Payroll" />
              <TabButton value="attendance" label="Attendance Adj" />
            </>
          )}

          <TabButton value="attendance_system" label="Attendance" />
          <TabButton value="my_leaves" label="My Leaves" />
          
          {isAdminOrHR && (
            <TabButton value="leave_admin" label="Leave Admin" />
          )}
        </div>
      </div>

      {isAdminOrHR && activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{employees.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Attendance</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {attendances.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Leaves</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {leaves.filter(l => l.status === 'Pending' || l.status === 'Approved by HOD').length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mt-8 mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payroll Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Monthly Salary</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">৳{payrollTotals.totalBasic.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Allowance</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">৳{payrollTotals.totalHouse.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Service Charge</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">৳{payrollTotals.totalServiceCharge.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                    <Coins className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="h-full">
            <Card className="border-slate-200 dark:border-slate-800 h-full">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Monthly Payroll Expenses</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `৳${value}`} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        formatter={(value) => [`৳${value}`, undefined]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="Basic Salary" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                      <Bar dataKey="House Allowance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                      <Bar dataKey="Service Charge" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="h-full">
            <Card className="border-slate-200 dark:border-slate-800 h-full">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Department Distribution</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        formatter={(value) => [`${value} Employees`, undefined]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mt-8 mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leave Summary ({new Date().toLocaleString('default', { month: 'long' })})</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved Leaves</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{leaveStats.approved}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Leaves</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{leaveStats.pending}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="border-slate-200 dark:border-slate-800 transition-all">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected Leaves</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{leaveStats.rejected}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <LeaveCalendar leaves={leaves} onDayClick={handleDayClick} />
      </>)}

      {isAdminOrHR && activeTab === 'attendance' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" /> Attendance Adjustment
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attendances.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(att => {
                  const emp = employees.find(e => e.employeeId === att.employeeId);
                  const isEditing = editingAttendance === att.id;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                        {emp?.name || att.employeeId} <br/> 
                        <span className="text-xs text-slate-500">{att.employeeId}</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{att.date}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {isEditing ? (
                          <input type="time" value={attendanceForm.checkInTime} onChange={(e) => setAttendanceForm({...attendanceForm, checkInTime: e.target.value})} className="px-2 py-1 rounded bg-white dark:bg-slate-900 border" />
                        ) : (att.checkInTime || '--:--')}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {isEditing ? (
                          <input type="time" value={attendanceForm.checkOutTime} onChange={(e) => setAttendanceForm({...attendanceForm, checkOutTime: e.target.value})} className="px-2 py-1 rounded bg-white dark:bg-slate-900 border" />
                        ) : (att.checkOutTime || '--:--')}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                         {isEditing ? (
                           <select value={attendanceForm.status} onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})} className="px-2 py-1 rounded bg-white dark:bg-slate-900 border">
                             <option value="Present">Present</option>
                             <option value="Absent">Absent</option>
                             <option value="Late">Late</option>
                             <option value="Half Day">Half Day</option>
                           </select>
                         ) : (
                           <span className={`px-2 py-1 rounded-full text-xs font-semibold ${att.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{att.status}</span>
                         )}
                      </td>
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                             <Button size="sm" variant="outline" onClick={() => setEditingAttendance(null)}><X className="w-4 h-4"/></Button>
                             <Button size="sm" onClick={() => handleSaveAttendance(att.id)}><Save className="w-4 h-4"/></Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleEditAttendance(att)}><Edit3 className="w-4 h-4"/></Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isAdminOrHR && activeTab === 'payroll' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-600" /> Payroll Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage salaries and generate monthly payslips</p>
          </div>
          <div className="p-6 grid grid-cols-1 gap-4">
             {employees.map(emp => (
               <div key={emp.id} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                 <div>
                   <h3 className="font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                   <p className="text-sm text-slate-500">{emp.department} • {emp.designation}</p>
                 </div>
                 <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                   <Button variant="outline" size="sm" onClick={() => calculateSalary(emp.id)} className="gap-2">
                     <Calculator className="w-4 h-4" /> Calc Salary
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => handleOpenSalarySetup(emp)}>
                     Salary Setup
                   </Button>
                   <Button size="sm" onClick={() => generatePayroll(emp.id)} className="gap-2">
                     <Download className="w-4 h-4" /> Payslip
                   </Button>
                 </div>
               </div>
             ))}
          </div>
        </Card>
      )}

      {activeTab === 'my_leaves' && (
        <div className="space-y-4">
           <LeaveApplication embedded={true} />
        </div>
      )}

      {isAdminOrHR && activeTab === 'leave_admin' && (
        <div className="space-y-4">
           <LeaveAdmin embedded={true} />
        </div>
      )}

      {isAdminOrHR && activeTab === 'employees' && (
        <div className="space-y-4">
           <Employees embedded={true} />
        </div>
      )}

      {activeTab === 'attendance_system' && (
        <div className="space-y-4">
           <Attendance embedded={true} />
        </div>
      )}

      {/* Salary Setup Modal */}
      {salarySetupEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Salary Structure</h2>
              <button onClick={() => setSalarySetupEmp(null)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-4">Configuring for <span className="font-bold text-slate-900 dark:text-white">{salarySetupEmp.name}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Basic Salary (৳)</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={salaryForm.basicSalary} onChange={(e) => setSalaryForm({...salaryForm, basicSalary: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">House Allowance (৳)</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={salaryForm.houseAllowance} onChange={(e) => setSalaryForm({...salaryForm, houseAllowance: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Charge (৳)</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={salaryForm.serviceCharge} onChange={(e) => setSalaryForm({...salaryForm, serviceCharge: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSalarySetupEmp(null)}>Cancel</Button>
              <Button onClick={handleSaveSalary}>Save Structure</Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Day Modal */}
      {selectedLeaveDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Leaves on {selectedLeaveDate}
              </h2>
              <button 
                onClick={() => setSelectedLeaveDate(null)} 
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!isAddingLeave ? (
                <>
                  <div className="space-y-3 mb-6">
                    {selectedDayLeaves.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No approved leaves on this day.</p>
                    ) : (
                      selectedDayLeaves.map(leave => (
                        <div key={leave.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">{leave.employeeName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{leave.leaveType} • {leave.reason}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                            Approved
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <Button onClick={() => setIsAddingLeave(true)} className="w-full">
                    + Add New Leave
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
                    <select
                      value={newLeaveData.employeeId}
                      onChange={(e) => setNewLeaveData({ ...newLeaveData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                    <select
                      value={newLeaveData.leaveType}
                      onChange={(e) => setNewLeaveData({ ...newLeaveData, leaveType: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Annual">Annual Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={selectedLeaveDate}
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-not-allowed rounded-lg text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newLeaveData.endDate}
                        min={selectedLeaveDate}
                        onChange={(e) => setNewLeaveData({ ...newLeaveData, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                    <input
                      type="text"
                      value={newLeaveData.reason}
                      onChange={(e) => setNewLeaveData({ ...newLeaveData, reason: e.target.value })}
                      placeholder="e.g. Added administratively"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsAddingLeave(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleAddLeaveSubmit} disabled={!newLeaveData.employeeId}>
                      Save Leave
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calculated Salary Modal */}
      <PayrollBreakdownModal 
        employee={salaryCalcEmp} 
        calculatedSalary={calculatedSalary} 
        onClose={() => setSalaryCalcEmp(null)} 
      />
    </div>
  );
}

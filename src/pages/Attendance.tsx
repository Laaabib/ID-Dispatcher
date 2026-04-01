import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Attendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [myEmployees, setMyEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employees to let user select which employee they are (or if they are already linked)
  // For simplicity, we'll let them select their employee profile to mark attendance
  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setMyEmployees(emps);
      
      // If user has a linked employee profile, select it automatically
      // For now, we just select the first one if none selected, or let them choose
      if (!selectedEmployeeId && emps.length > 0) {
        // Try to match by name
        const match = emps.find(e => e.name.toLowerCase() === user?.displayName?.toLowerCase());
        if (match) {
          setSelectedEmployeeId(match.employeeId);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch today's attendance for selected employee
  useEffect(() => {
    if (!selectedEmployeeId) {
      setTodayAttendance(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'attendance'), 
      where('employeeId', '==', selectedEmployeeId),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTodayAttendance({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayAttendance(null);
      }
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      toast.error("Please select your employee profile first");
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      await addDoc(collection(db, 'attendance'), {
        employeeId: selectedEmployeeId,
        userId: user?.uid,
        date: today,
        checkInTime: time,
        status: 'Present',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success("Checked in successfully");
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    try {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      await updateDoc(doc(db, 'attendance', todayAttendance.id), {
        checkOutTime: time,
        updatedAt: new Date().toISOString()
      });
      
      toast.success("Checked out successfully");
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          Daily Attendance
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Mark your daily check-in and check-out</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-left">
              Select Your Profile
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
            >
              <option value="">-- Select Employee Profile --</option>
              {myEmployees.map(emp => (
                <option key={emp.id} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId}) - {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="py-6">
            <div className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </div>
            <div className="text-lg text-slate-500 dark:text-slate-400 mt-2">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${todayAttendance?.checkInTime ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Check In</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {todayAttendance?.checkInTime ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    {todayAttendance.checkInTime}
                  </>
                ) : (
                  '--:--:--'
                )}
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border ${todayAttendance?.checkOutTime ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Check Out</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {todayAttendance?.checkOutTime ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    {todayAttendance.checkOutTime}
                  </>
                ) : (
                  '--:--:--'
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 w-full max-w-md">
            {!todayAttendance ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={!selectedEmployeeId}
                className="flex-1 h-14 text-lg bg-green-600/90 hover:bg-green-600 text-white gap-2 shadow-[0_4px_20px_-4px_rgba(22,163,74,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(22,163,74,0.6)] backdrop-blur-md border border-white/10 relative overflow-hidden after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tr after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500"
              >
                <Clock className="w-5 h-5" /> Check In
              </Button>
            ) : !todayAttendance.checkOutTime ? (
              <Button 
                onClick={handleCheckOut} 
                className="flex-1 h-14 text-lg bg-blue-600/90 hover:bg-blue-600 text-white gap-2 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(37,99,235,0.6)] backdrop-blur-md border border-white/10 relative overflow-hidden after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tr after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500"
              >
                <Clock className="w-5 h-5" /> Check Out
              </Button>
            ) : (
              <div className="flex-1 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Attendance Completed for Today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

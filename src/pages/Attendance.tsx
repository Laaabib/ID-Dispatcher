import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Calendar, Clock, CheckCircle2, XCircle, Settings, Cpu, Wifi, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Attendance() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mark' | 'devices'>('mark');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [myEmployees, setMyEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Device State
  const [devices, setDevices] = useState<any[]>([]);
  const [newDeviceIp, setNewDeviceIp] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employees');
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  // Fetch devices
  useEffect(() => {
    const q = query(collection(db, 'attendance_devices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDevices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance_devices');
    });
    return () => unsubscribe();
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceIp || !newDeviceName) return;

    try {
      await addDoc(collection(db, 'attendance_devices'), {
        name: newDeviceName,
        ip: newDeviceIp,
        status: 'Offline',
        lastSync: null,
        createdAt: new Date().toISOString()
      });
      setNewDeviceIp('');
      setNewDeviceName('');
      setIsAddingDevice(false);
      toast.success("Device added successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance_devices');
    }
  };

  const bridgeScript = `
// ZKTeco Bridge Script (Run locally on your PC)
const ZKLib = require('node-zklib');
const axios = require('axios');

const DEVICE_IP = '${devices[0]?.ip || '192.168.1.201'}';
const SERVER_URL = '${window.location.origin}/api/attendance/log';

async function startBridge() {
  const zkInstance = new ZKLib(DEVICE_IP, 4370, 10000, 4000);
  try {
    await zkInstance.createSocket();
    console.log('Connected to ZKTeco device at ' + DEVICE_IP);
    
    // Get real-time logs
    zkInstance.getRealTimeLogs(async (data) => {
      console.log('New log:', data);
      try {
        await axios.post(SERVER_URL, {
          deviceId: DEVICE_IP,
          logs: [data]
        });
      } catch (err) {
        console.error('Failed to send log to server:', err.message);
      }
    });
  } catch (e) {
    console.error('Connection failed:', e.message);
  }
}

startBridge();
  `;

  const handleCopyBridge = () => {
    navigator.clipboard.writeText(bridgeScript);
    toast.success("Bridge script copied to clipboard");
  };

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
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
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
      handleFirestoreError(error, OperationType.UPDATE, 'attendance');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Attendance System
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Mark attendance or manage physical devices</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'mark' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'devices' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Device Settings
          </button>
        </div>
      </div>

      {activeTab === 'mark' ? (
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
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary-600" />
                Linked ZKTeco Devices
              </h2>
              <Button onClick={() => setIsAddingDevice(!isAddingDevice)} size="sm" variant="outline" className="gap-2">
                <Wifi className="w-4 h-4" />
                {isAddingDevice ? 'Cancel' : 'Add Device'}
              </Button>
            </div>

            {isAddingDevice && (
              <form onSubmit={handleAddDevice} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Device Name</label>
                  <input
                    type="text"
                    placeholder="Main Entrance"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Device IP Address</label>
                  <input
                    type="text"
                    placeholder="192.168.1.201"
                    value={newDeviceIp}
                    onChange={(e) => setNewDeviceIp(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Save Device</Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {devices.length > 0 ? (
                devices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${device.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{device.name}</h3>
                        <p className="text-sm text-slate-500 font-mono">{device.ip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold uppercase ${device.status === 'Online' ? 'text-green-600' : 'text-slate-400'}`}>
                        {device.status}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Last Sync: {device.lastSync ? new Date(device.lastSync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  No devices linked yet. Add your ZKTeco device to get started.
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6">
            <h3 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 mb-4">
              <Wifi className="w-5 h-5" />
              How to Link Physical Device
            </h3>
            <div className="space-y-4 text-sm text-amber-900/80 dark:text-amber-400/80">
              <p>
                Since this application is hosted in the cloud, it cannot directly "talk" to a local IP address on your office network. 
                To link your ZKTeco device, you need to run a <strong>Bridge Script</strong> on a local PC connected to the same network as the device.
              </p>
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Bridge Script (Node.js)</span>
                  <Button onClick={handleCopyBridge} size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                <pre className="text-[10px] font-mono overflow-x-auto p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  {bridgeScript}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="font-bold">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Install <strong>Node.js</strong> on a local PC.</li>
                  <li>Create a new folder and run <code>npm install node-zklib axios</code>.</li>
                  <li>Create a file named <code>bridge.js</code> and paste the script above.</li>
                  <li>Run <code>node bridge.js</code>.</li>
                  <li>The script will listen for fingerprint logs and send them to this app in real-time.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { CheckCircle2, Circle, Clock, Plus, Trash2, X, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { downloadDailyWorksPDF } from '../lib/pdf';

interface DailyWork {
  id: string;
  userId: string;
  title: string;
  description?: string;
  taskTime?: string;
  taskDate?: string;
  reason?: string;
  timesNeeded?: string;
  remarks?: string;
  status: 'queued' | 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
}

export default function DailyWorks({ isAdding: externalIsAdding, setIsAdding: externalSetIsAdding }: { isAdding?: boolean, setIsAdding?: (val: boolean) => void }) {
  const { user } = useAuth();
  const [works, setWorks] = useState<DailyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskReason, setNewTaskReason] = useState('');
  const [newTaskTimesNeeded, setNewTaskTimesNeeded] = useState('');
  const [newTaskRemarks, setNewTaskRemarks] = useState('');
  const [internalIsAdding, setInternalIsAdding] = useState(false);

  const isAdding = externalIsAdding !== undefined ? externalIsAdding : internalIsAdding;
  const setIsAdding = externalSetIsAdding || setInternalIsAdding;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'daily_works'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const worksData: DailyWork[] = [];
      snapshot.forEach((doc) => {
        worksData.push({ id: doc.id, ...doc.data() } as DailyWork);
      });
      setWorks(worksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'daily_works');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'daily_works'), {
        userId: user.uid,
        title: newTaskTitle.trim(),
        taskTime: newTaskTime.trim(),
        taskDate: newTaskDate.trim(),
        reason: newTaskReason.trim(),
        timesNeeded: newTaskTimesNeeded.trim(),
        remarks: newTaskRemarks.trim(),
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      });
      setNewTaskTitle('');
      setNewTaskTime('');
      setNewTaskDate('');
      setNewTaskReason('');
      setNewTaskTimesNeeded('');
      setNewTaskRemarks('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'daily_works');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'queued' | 'pending' | 'done') => {
    try {
      await updateDoc(doc(db, 'daily_works', id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `daily_works/${id}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'daily_works', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `daily_works/${id}`);
    }
  };

  const exportToExcel = () => {
    // Format data for Excel
    const data = works.map(work => ({
      'Task Title': work.title,
      'Date': work.taskDate || '',
      'Time': work.taskTime || '',
      'Reason': work.reason || '',
      'Times Needed': work.timesNeeded || '',
      'Remarks': work.remarks || '',
      'Status': work.status.charAt(0).toUpperCase() + work.status.slice(1),
      'Created Date': format(new Date(work.createdAt), 'MMM dd, yyyy HH:mm'),
      'Last Updated': format(new Date(work.updatedAt), 'MMM dd, yyyy HH:mm'),
    }));

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Add styling/column widths
    ws['!cols'] = [
      { wch: 40 }, // Task Title
      { wch: 15 }, // Date
      { wch: 10 }, // Time
      { wch: 30 }, // Reason
      { wch: 15 }, // Times Needed
      { wch: 30 }, // Remarks
      { wch: 15 }, // Status
      { wch: 20 }, // Created Date
      { wch: 20 }, // Last Updated
    ];

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Works');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `Daily_Works_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!user) return;
    await downloadDailyWorksPDF(works, user.displayName || user.email || 'Admin');
  };

  const queuedWorks = works.filter(w => w.status === 'queued');
  const pendingWorks = works.filter(w => w.status === 'pending');
  const doneWorks = works.filter(w => w.status === 'done');

  const WorkColumn = ({ title, icon: Icon, colorClass, items, status }: { title: string, icon: any, colorClass: string, items: DailyWork[], status: 'queued' | 'pending' | 'done' }) => (
    <div className="flex-1 min-w-[300px] bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map(work => (
          <Card key={work.id} className="group hover:border-primary-300 dark:hover:border-primary-700 transition-colors shadow-sm">
            <CardContent className="p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{work.title}</p>
                <button 
                  onClick={() => handleDeleteTask(work.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {(work.taskDate || work.taskTime) && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex gap-3">
                  {work.taskDate && <span>📅 {work.taskDate}</span>}
                  {work.taskTime && <span>⏰ {work.taskTime}</span>}
                </div>
              )}
              {work.reason && <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-700 dark:text-slate-400">Reason:</span> {work.reason}</p>}
              {work.timesNeeded && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-700 dark:text-slate-400">Times needed:</span> {work.timesNeeded}</p>}
              {work.remarks && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-700 dark:text-slate-400">Remarks:</span> {work.remarks}</p>}
              
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(work.createdAt), 'MMM d')}
                </span>
                <div className="flex gap-1">
                  {status !== 'queued' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'queued')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110"
                      title="Move to Queued"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                  )}
                  {status !== 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'pending')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110"
                      title="Move to Pending"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                  {status !== 'done' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'done')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110"
                      title="Move to Done"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight">Daily Works</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToPDF} size="sm" variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={exportToExcel} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {isAdding && (
        <Card className="border-indigo-200 dark:border-indigo-800 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 lg:col-span-3">
                  <label className="text-sm font-medium">Task Title <span className="text-red-500">*</span></label>
                  <Input
                    autoFocus
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Times Needed to Finish</label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={newTaskTimesNeeded}
                    onChange={(e) => setNewTaskTimesNeeded(e.target.value)}
                  />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <label className="text-sm font-medium">Reason</label>
                  <Input
                    placeholder="Why is this task needed?"
                    value={newTaskReason}
                    onChange={(e) => setNewTaskReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <label className="text-sm font-medium">Remarks</label>
                  <Input
                    placeholder="Any additional remarks?"
                    value={newTaskRemarks}
                    onChange={(e) => setNewTaskRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setNewTaskTitle(''); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!newTaskTitle.trim()}>Add Task</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading tasks...</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
          <WorkColumn 
            title="Queued" 
            icon={Circle} 
            colorClass="text-slate-500 dark:text-slate-400" 
            items={queuedWorks} 
            status="queued"
          />
          <WorkColumn 
            title="Pending" 
            icon={Clock} 
            colorClass="text-amber-500 dark:text-amber-400" 
            items={pendingWorks} 
            status="pending"
          />
          <WorkColumn 
            title="Done" 
            icon={CheckCircle2} 
            colorClass="text-emerald-500 dark:text-emerald-400" 
            items={doneWorks} 
            status="done"
          />
        </div>
      )}
    </div>
  );
}

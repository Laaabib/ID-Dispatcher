import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { CheckCircle2, Circle, Clock, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

interface DailyWork {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'queued' | 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
}

export default function DailyWorks({ isAdding: externalIsAdding, setIsAdding: externalSetIsAdding }: { isAdding?: boolean, setIsAdding?: (val: boolean) => void }) {
  const { user } = useAuth();
  const [works, setWorks] = useState<DailyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
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
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      });
      setNewTaskTitle('');
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
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(work.createdAt), 'MMM d')}
                </span>
                <div className="flex gap-1">
                  {status !== 'queued' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'queued')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Move to Queued"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                  )}
                  {status !== 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'pending')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500"
                      title="Move to Pending"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                  {status !== 'done' && (
                    <button 
                      onClick={() => handleUpdateStatus(work.id, 'done')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500"
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
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-indigo-200 dark:border-indigo-800 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleAddTask} className="flex gap-3">
              <Input
                autoFocus
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newTaskTitle.trim()}>Add</Button>
              <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setNewTaskTitle(''); }}>
                <X className="w-4 h-4" />
              </Button>
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

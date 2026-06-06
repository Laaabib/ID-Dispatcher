import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { GraduationCap, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

export default function Trainees() {
  const { role } = useAuth();
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    program: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  useEffect(() => {
    const q = query(collection(db, 'trainees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrainees(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trainees');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (trainee?: any) => {
    if (trainee && trainee.id) {
      setFormData({
        name: trainee.name || '',
        department: trainee.department || '',
        program: trainee.program || '',
        startDate: trainee.startDate || '',
        endDate: trainee.endDate || '',
        status: trainee.status || 'active'
      });
      setEditingId(trainee.id);
    } else {
      setFormData({
        name: '',
        department: '',
        program: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'trainees', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Trainee updated successfully");
      } else {
        await addDoc(collection(db, 'trainees'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success("Trainee added successfully");
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'trainees');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, 'trainees', deleteConfirmId));
        toast.success("Trainee deleted successfully");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'trainees');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const filteredTrainees = trainees.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.program?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'admin' && role !== 'hr_manager') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary-600" />
            Trainee Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage trainee programs and onboarding.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Trainee
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search trainees by name, dept or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading trainees...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="pb-3 font-medium whitespace-nowrap">Name</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Department</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Program</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Duration</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Status</th>
                  <th className="pb-3 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredTrainees.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{t.name}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t.department || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{t.program || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {t.startDate && t.endDate ? `${t.startDate} to ${t.endDate}` : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : t.status === 'completed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(t)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Edit2 className="w-4 h-4 pointer-events-none" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(t.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTrainees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No trainees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Trainee' : 'Add Trainee'}
              </h2>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="trainee-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program</label>
                  <input
                    type="text"
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" form="trainee-form">{editingId ? 'Update' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Trainee"
        message="Are you sure you want to delete this trainee? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

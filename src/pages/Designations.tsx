import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Award, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

export default function Designations() {
  const { role } = useAuth();
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    level: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    const q = query(collection(db, 'designations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const desigs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDesignations(desigs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'designations');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (designation?: any) => {
    if (designation && designation.id) {
      setFormData({
        title: designation.title || '',
        level: designation.level || '',
        description: designation.description || '',
        status: designation.status || 'active'
      });
      setEditingId(designation.id);
    } else {
      setFormData({
        title: '',
        level: '',
        description: '',
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
        await updateDoc(doc(db, 'designations', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Designation updated successfully");
      } else {
        await addDoc(collection(db, 'designations'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success("Designation added successfully");
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'designations');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, 'designations', deleteConfirmId));
        toast.success("Designation deleted successfully");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'designations');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const filteredDesignations = designations.filter(desig => 
    desig.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'admin' && role !== 'hr_manager') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-600" />
            Designation Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage employee designations and job titles.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Designation
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search designations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading designations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="pb-3 font-medium whitespace-nowrap">Designation Title</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Job Level</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Status</th>
                  <th className="pb-3 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredDesignations.map((desig) => (
                  <tr key={desig.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{desig.title}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{desig.level || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2" title={desig.description}>{desig.description || '-'}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        desig.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {desig.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(desig)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Edit2 className="w-4 h-4 pointer-events-none" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(desig.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDesignations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No designations found.
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Designation' : 'Add Designation'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Designation Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Level / Rank</label>
                <input
                  type="text"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingId ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Designation"
        message="Are you sure you want to delete this designation? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

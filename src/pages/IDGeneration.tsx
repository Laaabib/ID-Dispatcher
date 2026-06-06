import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Fingerprint, Printer, CheckCircle, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

export default function IDGeneration() {
  const { role } = useAuth();
  const [issuedIds, setIssuedIds] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeName: '',
    department: '',
    issueDate: new Date().toISOString().split('T')[0],
    status: 'generated'
  });

  useEffect(() => {
    const q1 = query(collection(db, 'employee_ids'));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const records: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      records.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setIssuedIds(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employee_ids');
      setLoading(false);
    });

    const q2 = query(collection(db, 'employees'));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const emps: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
    }, (error) => {
      console.error("Error fetching employees:", error);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  const handleOpenModal = () => {
    setFormData({
      employeeName: '',
      department: '',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'generated'
    });
    setIsModalOpen(true);
  };

  const generateNextId = () => {
    // Basic logic to generate next ID based on current max or just a random number for demo
    const prefix = "14"; // E.g., branch / year code
    const suffix = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
    return `${prefix}${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newId = generateNextId();
      await addDoc(collection(db, 'employee_ids'), {
        ...formData,
        generatedId: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success(`Generated ID: ${newId}`);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'employee_ids');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, 'employee_ids', deleteConfirmId));
        toast.success("Record deleted");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'employee_ids');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };
  
  const handleMarkDistributed = async (id: string) => {
    try {
      await updateDoc(doc(db, 'employee_ids', id), {
        status: 'distributed',
        updatedAt: new Date().toISOString()
      });
      toast.success("Marked as distributed");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'employee_ids');
    }
  };

  const filteredIds = issuedIds.filter(record => 
    record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.generatedId && record.generatedId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (role !== 'admin' && role !== 'hr_manager') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-primary-600" />
            ID Number Distribution
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Generate and distribute employee ID numbers.</p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="w-4 h-4" /> Generate New ID
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="pb-3 font-medium whitespace-nowrap">Generated ID</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Employee Name</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Department</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Issue Date</th>
                  <th className="pb-3 font-medium whitespace-nowrap">Status</th>
                  <th className="pb-3 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredIds.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-white tracking-wider whitespace-nowrap">{record.generatedId}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{record.employeeName}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{record.department || '-'}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{record.issueDate}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'distributed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status === 'distributed' ? 'Distributed' : 'Not Distributed'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status !== 'distributed' && (
                          <Button variant="ghost" size="icon" title="Mark as distributed" onClick={() => handleMarkDistributed(record.id)} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30">
                            <CheckCircle className="w-4 h-4 pointer-events-none" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Print format" onClick={() => window.print()} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Printer className="w-4 h-4 pointer-events-none" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(record.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredIds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No records found.
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
                Generate New Employee ID
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee Name</label>
                <select
                  required
                  value={formData.employeeName}
                  onChange={(e) => {
                    const empName = e.target.value;
                    const emp = employees.find(e => e.name === empName);
                    setFormData({
                      ...formData,
                      employeeName: empName,
                      department: emp ? emp.department : formData.department
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  readOnly
                  value={formData.department}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 pt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Generate ID</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

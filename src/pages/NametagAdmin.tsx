import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge as BadgeIcon, Search, Filter, Printer, Share2, Trash2, Edit, Eye, Download } from 'lucide-react';

interface Nametag {
  id: string;
  name: string;
  designation: string;
  department: string;
  employeeId: string;
  fastenerType: string;
  status: string;
  createdAt: string;
}

export default function NametagAdmin() {
  const { user, role } = useAuth();
  const [nametags, setNametags] = useState<Nametag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) return;

    const q = query(
      collection(db, 'nametags'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tags: Nametag[] = [];
      snapshot.forEach((doc) => {
        tags.push({ id: doc.id, ...doc.data() } as Nametag);
      });
      setNametags(tags);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'nametags');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  const logActivity = async (action: string, tagId: string, tagName: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown Admin',
        userEmail: user.email,
        action,
        resourceId: tagId,
        resourceName: tagName,
        resourceType: 'Nametag',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity', error);
    }
  };

  const updateStatus = async (tag: Nametag, newStatus: string) => {
    setUpdating(tag.id);
    try {
      await updateDoc(doc(db, 'nametags', tag.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Nametag status updated to ${newStatus}`);
      await logActivity(newStatus, tag.id, tag.name);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `nametags/${tag.id}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Printed': return <Badge variant="info">Printed</Badge>;
      case 'Distributed': return <Badge variant="purple">Distributed</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'Draft': return <Badge variant="draft">Draft</Badge>;
      default: return <Badge variant="warning">{status || 'Pending'}</Badge>;
    }
  };

  const filteredTags = useMemo(() => {
    let result = nametags.filter(tag => {
      // Search text
      const matchesSearch = 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Department
      const matchesDept = deptFilter === 'all' || tag.department === deptFilter;
      
      // Status
      const matchesStatus = statusFilter === 'all' || tag.status === statusFilter;
      
      // Date
      let matchesDate = true;
      if (dateFilter !== 'all') {
        try {
          const d = new Date(tag.createdAt);
          if (dateFilter === 'today') matchesDate = isToday(d);
          else if (dateFilter === 'thisWeek') matchesDate = isThisWeek(d);
          else if (dateFilter === 'thisMonth') matchesDate = isThisMonth(d);
        } catch (e) {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesDept && matchesStatus && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'nameAsc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [nametags, searchQuery, deptFilter, statusFilter, dateFilter, sortOrder]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    nametags.forEach(tag => {
      if (tag.department) depts.add(tag.department);
    });
    return Array.from(depts).sort();
  }, [nametags]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nametag Distribution</h1>
          <p className="text-gray-500">Manage all nametag requests</p>
        </div>
        <Link to="/nametag-request">
          <Button className="shadow-sm">
            <BadgeIcon className="w-4 h-4 mr-2" />
            Add Nametag
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search employee..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 px-2 h-10">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 min-w-[120px]"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">Department (All)</option>
              {uniqueDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 px-2 h-10">
            <select
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 min-w-[110px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status (All)</option>
              <option value="Approved">Approved</option>
              <option value="Printed">Printed</option>
              <option value="Distributed">Distributed</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 px-2 h-10">
            <select
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 min-w-[110px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Date (All)</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 px-2 h-10">
            <select
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 min-w-[110px]"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="nameAsc">Sort: Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading requests...</div>
      ) : filteredTags.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No requests found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="overflow-hidden relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1 z-10">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-emerald-600" onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }} title="Print">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-amber-600" onClick={() => toast.info('Edit mode enabled for ' + tag.name)} title="Edit">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-purple-600" onClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: 'Nametag Request', text: `Nametag Request for ${tag.name}`, url: window.location.href });
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard');
                    }
                  } catch (e) {}
                }} title="Share">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-red-600" onClick={async () => {
                  if(window.confirm('Are you sure you want to delete this request?')) {
                    await deleteDoc(doc(db, 'nametags', tag.id));
                    toast.success('Deleted successfully');
                  }
                }} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tag.name}</h3>
                      <p className="text-gray-500">{tag.designation} • {tag.department}</p>
                    </div>
                    {getStatusBadge(tag.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 block">Employee ID</span>
                      <span className="font-medium">{tag.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Fastener Type</span>
                      <span className="font-medium">{tag.fastenerType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Requested On</span>
                      <span className="font-medium">{format(new Date(tag.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col gap-2 justify-center min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Update Status</h4>
                  
                  {['admin'].includes(role || '') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={updating === tag.id || tag.status === 'Pending'}
                      onClick={() => updateStatus(tag, 'Pending')}
                    >
                      Set Pending
                    </Button>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="default" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm" 
                      disabled={updating === tag.id || tag.status === 'Approved'}
                      onClick={() => updateStatus(tag, 'Approved')}
                    >
                      Approve
                    </Button>
                  )}

                  {['admin', 'it_approver'].includes(role || '') && (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        disabled={updating === tag.id || tag.status === 'Printed'}
                        onClick={() => updateStatus(tag, 'Printed')}
                      >
                        Mark Printed
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={updating === tag.id || tag.status === 'Distributed'}
                        onClick={() => updateStatus(tag, 'Distributed')}
                      >
                        Mark Distributed
                      </Button>
                    </>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={updating === tag.id || tag.status === 'Rejected'}
                      onClick={() => updateStatus(tag, 'Rejected')}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

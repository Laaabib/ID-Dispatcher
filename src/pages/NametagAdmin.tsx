import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge as BadgeIcon } from 'lucide-react';

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
  const { role } = useAuth();
  const [nametags, setNametags] = useState<Nametag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'nametags', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Nametag status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `nametags/${id}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Printed': return <Badge variant="default">Printed</Badge>;
      case 'Distributed': return <Badge variant="secondary">Distributed</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

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

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading requests...</div>
      ) : nametags.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No nametag requests yet</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {nametags.map((tag) => (
            <Card key={tag.id} className="overflow-hidden">
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
                      onClick={() => updateStatus(tag.id, 'Pending')}
                    >
                      Set Pending
                    </Button>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      disabled={updating === tag.id || tag.status === 'Approved'}
                      onClick={() => updateStatus(tag.id, 'Approved')}
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
                        onClick={() => updateStatus(tag.id, 'Printed')}
                      >
                        Mark Printed
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={updating === tag.id || tag.status === 'Distributed'}
                        onClick={() => updateStatus(tag.id, 'Distributed')}
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
                      onClick={() => updateStatus(tag.id, 'Rejected')}
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

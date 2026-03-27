import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Navigate, Link } from 'react-router-dom';
import { downloadApplicationPDF } from '../lib/pdf';
import { Download, X, Eye, FileText } from 'lucide-react';

interface Application {
  id: string;
  name: string;
  designation: string;
  department?: string;
  employeeId: string;
  nidNumber: string;
  status: string;
  createdAt: string;
  signatureData: string;
  applicationDate: string;
  joiningDate: string;
  bloodGroup?: string;
}

export default function AdminPanel() {
  const { role } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) return;

    const q = query(
      collection(db, 'applications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps: Application[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
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
      await updateDoc(doc(db, 'applications', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500">Manage all ID card applications</p>
        </div>
        <Link to="/apply">
          <Button className="shadow-sm">
            <FileText className="w-4 h-4 mr-2" />
            Add ID Card
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading applications...</div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No applications yet</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                      <p className="text-gray-500">{app.designation}{app.department ? ` • ${app.department}` : ''}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 block">Employee ID</span>
                      <span className="font-medium">{app.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">NID Number</span>
                      <span className="font-medium">{app.nidNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Applied On</span>
                      <span className="font-medium">{format(new Date(app.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 block text-sm mb-2">Signature</span>
                      <div className="bg-gray-50 border rounded p-2 inline-block">
                        <img src={app.signatureData} alt="Signature" className="h-16 object-contain" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col gap-2 justify-center min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Update Status</h4>
                  
                  {['admin'].includes(role || '') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={updating === app.id || app.status === 'Pending'}
                      onClick={() => updateStatus(app.id, 'Pending')}
                    >
                      Set Pending
                    </Button>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      disabled={updating === app.id || app.status === 'Approved'}
                      onClick={() => updateStatus(app.id, 'Approved')}
                    >
                      Approve
                    </Button>
                  )}

                  {['admin', 'it_approver'].includes(role || '') && (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        disabled={updating === app.id || app.status === 'Printed'}
                        onClick={() => updateStatus(app.id, 'Printed')}
                      >
                        Mark Printed
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={updating === app.id || app.status === 'Distributed'}
                        onClick={() => updateStatus(app.id, 'Distributed')}
                      >
                        Mark Distributed
                      </Button>
                    </>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={updating === app.id || app.status === 'Rejected'}
                      onClick={() => updateStatus(app.id, 'Rejected')}
                    >
                      Reject
                    </Button>
                  )}

                  <div className="border-t my-1"></div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadApplicationPDF(app)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 relative">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-xl font-bold">Application Details</h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-gray-500 block text-sm">Full Name</span>
                  <span className="font-medium text-lg">{selectedApp.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Designation</span>
                  <span className="font-medium text-lg">{selectedApp.designation}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Department</span>
                  <span className="font-medium">{selectedApp.department || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Blood Group</span>
                  <span className="font-medium">{selectedApp.bloodGroup || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Employee ID</span>
                  <span className="font-medium">{selectedApp.employeeId}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">NID Number</span>
                  <span className="font-medium">{selectedApp.nidNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Application Date</span>
                  <span className="font-medium">{format(new Date(selectedApp.applicationDate), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Joining Date</span>
                  <span className="font-medium">{format(new Date(selectedApp.joiningDate), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <span className="text-gray-500 block text-sm mb-2">Signature</span>
                <div className="bg-gray-50 border rounded p-4 inline-block">
                  <img src={selectedApp.signatureData} alt="Signature" className="h-24 object-contain" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              <Button onClick={() => { downloadApplicationPDF(selectedApp); setSelectedApp(null); }}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

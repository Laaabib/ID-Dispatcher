import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadApplicationPDF } from '../lib/pdf';
import { Download, X, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import logoImg from '../assets/Logo.svg';

const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex w-full text-[8.5px] leading-[1.35] text-[#111] items-start">
    <span className="w-[18mm] shrink-0 font-bold uppercase">{label}</span>
    <span className="w-[2mm] text-center shrink-0 font-bold">:</span>
    <span className="flex-1 ml-1 font-bold break-words">{value}</span>
  </div>
);

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'N/A';
  }
};

const formatExpireDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    d.setFullYear(d.getFullYear() + 3);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'N/A';
  }
};

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
  const { user, role } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

  const togglePreview = (id: string) => {
    setExpandedPreviewId(expandedPreviewId === id ? null : id);
  };

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

  const logActivity = async (action: string, appId: string, appName: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown Admin',
        userEmail: user.email,
        action,
        resourceId: appId,
        resourceName: appName,
        resourceType: 'ID Card',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity', error);
    }
  };

  const updateStatus = async (app: Application, newStatus: string) => {
    setUpdating(app.id);
    try {
      await updateDoc(doc(db, 'applications', app.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Application status updated to ${newStatus}`);
      await logActivity(newStatus, app.id, app.name);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${app.id}`);
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

                  <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                    <div>
                      <span className="text-gray-500 block text-sm mb-2">Signature</span>
                      <div className="bg-gray-50 border rounded p-2 inline-block">
                        <img src={app.signatureData} alt="Signature" className="h-16 object-contain" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => togglePreview(app.id)}>
                        {expandedPreviewId === app.id ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        {expandedPreviewId === app.id ? "Hide Preview" : "Preview Card"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col gap-2 justify-center min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Update Status</h4>
                  
                  {['admin'].includes(role || '') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={updating === app.id || app.status === 'Pending'}
                      onClick={() => updateStatus(app, 'Pending')}
                    >
                      Set Pending
                    </Button>
                  )}

                  {['admin', 'admin_approver'].includes(role || '') && (
                    <Button 
                      variant="default" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm" 
                      disabled={updating === app.id || app.status === 'Approved'}
                      onClick={() => updateStatus(app, 'Approved')}
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
                        onClick={() => updateStatus(app, 'Printed')}
                      >
                        Mark Printed
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={updating === app.id || app.status === 'Distributed'}
                        onClick={() => updateStatus(app, 'Distributed')}
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
                      onClick={() => updateStatus(app, 'Rejected')}
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
              
              {expandedPreviewId === app.id && (
                <div className="border-t border-gray-100 bg-slate-50/50 p-8 flex justify-center">
                  <div className="relative w-[54mm] h-[86mm] bg-white rounded-[10px] shadow-xl border border-gray-200 overflow-hidden flex flex-col items-center id-card-print shrink-0 font-sans">
                    {/* Background Waves Top */}
                    <div className="absolute top-0 left-0 w-full h-[45mm] z-0">
                      <svg viewBox="0 0 204 150" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0 0 L204 0 L204 80 C150 140 100 90 0 130 Z" fill="#8acb9e"/>
                        <path d="M0 0 L204 0 L204 50 C150 100 120 70 0 110 Z" fill="#3a9b5c"/>
                        <path d="M0 0 L80 0 C40 40 10 70 0 90 Z" fill="#1a502c"/>
                      </svg>
                    </div>

                    {/* Header Text */}
                    <div className="absolute top-[3mm] w-full flex flex-col items-center z-10 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center p-0.5 shadow-sm mb-1 overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
                        <img src={logoImg} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <h2 className="font-['Brush_Script_MT',cursive] italic text-[18px] leading-[1] relative -mt-0.5" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>Padma</h2>
                      <p className="text-[5.5px] uppercase font-bold tracking-[0.1em]" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>AWT Rest House</p>
                    </div>

                    {/* Photo Area */}
                    <div className="absolute top-[26mm] left-1/2 -translate-x-1/2 w-[28mm] h-[28mm] bg-[#c3c8c9] rounded-full border-[1.5px] border-black overflow-hidden z-20 shadow-sm flex items-center justify-center">
                      <span className="text-gray-500 text-[8px] uppercase font-bold px-2 text-center opacity-50">Photo Area</span>
                    </div>

                    {/* Foreground Content */}
                    <div className="absolute top-[56mm] w-full z-10 flex flex-col items-center">
                      <h3 className="text-[#149547] font-bold text-[11.5px] uppercase tracking-wide leading-tight px-3 w-full text-center">
                        {app.name}
                      </h3>
                      <p className="text-[#6a6a6c] font-medium text-[9px] mt-[1.5px] w-full text-center px-2">
                        {app.designation}
                      </p>

                      <div className="w-full px-[5mm] mt-[4mm] space-y-[2px]">
                        <DataRow label="ID NO" value={app.employeeId} />
                        <DataRow label="DEPARTMENT" value={app.department || '-'} />
                        <DataRow label="NID" value={app.nidNumber || '-'} />
                        <DataRow label="JOIN" value={formatDate(app.joiningDate || app.createdAt)} />
                        <DataRow label="EXPIRE" value={formatExpireDate(app.joiningDate || app.createdAt)} />
                        <DataRow label="BLOOD GROUP" value={app.bloodGroup || '-'} />
                      </div>
                    </div>

                    {/* Background Waves Bottom */}
                    <div className="absolute bottom-0 right-0 w-[22mm] h-[12mm] z-0">
                      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M100 50 V0 C80 30 40 40 0 50 Z" fill="#8acb9e"/>
                        <path d="M100 50 V20 C80 40 50 45 20 50 Z" fill="#3a9b5c"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
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

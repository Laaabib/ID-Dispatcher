import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format, isToday, isThisWeek } from 'date-fns';
import { PlusCircle, FileText, Download, Badge as BadgeIcon, CheckCircle2, Clock, XCircle, Calendar, LayoutDashboard, Share2, Trash2, Edit, Printer, Eye, User } from 'lucide-react';
import { downloadApplicationPDF, downloadBlankApplicationPDF } from '../lib/pdf';
import DailyWorks from '../components/DailyWorks';
import { toast } from 'sonner';

interface Application {
  id: string;
  name: string;
  designation: string;
  department?: string;
  status: string;
  createdAt: string;
  employeeId: string;
  nidNumber: string;
  applicationDate: string;
  joiningDate: string;
  signatureData: string;
  bloodGroup?: string;
}

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

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [nametags, setNametags] = useState<Nametag[]>([]);
  const [dailyWorks, setDailyWorks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [isAddingDailyWork, setIsAddingDailyWork] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'applications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeApps = onSnapshot(q, (snapshot) => {
      const apps: Application[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(apps);
      setLoadingApps(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
      setLoadingApps(false);
    });

    const qTags = query(
      collection(db, 'nametags'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTags = onSnapshot(qTags, (snapshot) => {
      const tags: Nametag[] = [];
      snapshot.forEach((doc) => {
        tags.push({ id: doc.id, ...doc.data() } as Nametag);
      });
      setNametags(tags);
      setLoadingTags(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'nametags');
      setLoadingTags(false);
    });
    
    const qDaily = query(collection(db, 'daily_works'), where('userId', '==', user.uid));
    const unsubscribeDaily = onSnapshot(qDaily, (snapshot) => {
      setDailyWorks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qLeaves = query(collection(db, 'leave_applications'), where('userId', '==', user.uid));
    const unsubscribeLeaves = onSnapshot(qLeaves, (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeApps();
      unsubscribeTags();
      unsubscribeDaily();
      unsubscribeLeaves();
    };
  }, [user]);

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

  const allRequests = [
    ...applications,
    ...nametags,
    ...dailyWorks,
    ...leaves
  ];

  const pendingCount = allRequests.filter(r => r.status === 'Pending' || r.status === 'pending' || r.status === 'queued').length;
  const completedCount = allRequests.filter(r => r.status === 'Approved' || r.status === 'Distributed' || r.status === 'done' || r.status === 'Printed').length;
  const rejectedCount = allRequests.filter(r => r.status === 'Rejected' || r.status === 'rejected').length;

  const todayCount = allRequests.filter(r => {
    try {
      return r.createdAt ? isToday(new Date(r.createdAt)) : false;
    } catch (e) {
      return false;
    }
  }).length;

  const thisWeekCount = allRequests.filter(r => {
    try {
      return r.createdAt ? isThisWeek(new Date(r.createdAt)) : false;
    } catch (e) {
      return false;
    }
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Summary</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your requests and activities</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="gap-2 shadow-sm bg-slate-900 hover:bg-slate-800 text-white" 
            onClick={() => downloadBlankApplicationPDF()}
          >
            <Download className="w-4 h-4" />
            Blank Form (PDF)
          </Button>
          <Link to="/apply">
            <Button className="gap-2 shadow-sm" variant="outline">
              <PlusCircle className="w-4 h-4" />
              ID Card
            </Button>
          </Link>
          <Link to="/nametag-request">
            <Button className="gap-2 shadow-sm" variant="outline">
              <BadgeIcon className="w-4 h-4" />
              Nametag
            </Button>
          </Link>
          {(user?.email === '140001@padmaawt.internal' || user?.email === 'padmaawtit@gmail.com') && (
            <Button 
              className="gap-2 shadow-sm" 
              onClick={() => {
                setIsAddingDailyWork(true);
                document.getElementById('daily-works-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Daily Work
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" /> My Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Name</p>
                  <p className="font-medium text-slate-900 dark:text-white">{user?.displayName || 'Employee'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Department</p>
                  <p className="font-medium text-slate-900 dark:text-white">Software Engineering</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Email</p>
                <p className="font-medium text-slate-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">98%</p>
                <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Attendance Rate</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">2</p>
                <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Leaves Taken</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-700 pt-3">
              <span className="text-slate-500 dark:text-slate-400">Last Check-in</span>
              <span className="font-medium text-slate-900 dark:text-white">Today, 09:02 AM</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ID Cards</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{applications.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
              <BadgeIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nametags</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{nametags.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Work</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{dailyWorks.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{pendingCount}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Requests</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{todayCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This Week</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{thisWeekCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{completedCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              <XCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{rejectedCount}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight">ID Card Applications</h2>
        </div>
        {loadingApps ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-700">
            <CardContent>
              <div className="mx-auto bg-white dark:bg-slate-800 shadow-sm p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No ID card applications yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">You haven't submitted any ID card applications. Click the button below to get started.</p>
              <Link to="/apply">
                <Button variant="outline" className="shadow-sm">Apply Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Card key={app.id} className="group hover:border-primary-200 dark:hover:border-primary-800 transition-colors relative">
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1 z-10">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-emerald-600" onClick={() => {
                      setTimeout(() => window.print(), 100);
                    }} title="Print">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-amber-600" onClick={() => toast.info('Edit mode enabled for ' + app.name)} title="Edit">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-purple-600" onClick={async () => {
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: 'ID Card Application', text: `ID Card Application for ${app.name}`, url: window.location.href });
                      } else {
                        await navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard');
                      }
                    } catch (e) {}
                  }} title="Share">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-red-600" onClick={async () => {
                    if(window.confirm('Are you sure you want to delete this application?')) {
                      await deleteDoc(doc(db, 'applications', app.id));
                      toast.success('Deleted successfully');
                    }
                  }} title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg font-bold leading-tight dark:text-white">{app.name}</CardTitle>
                    {getStatusBadge(app.status)}
                  </div>
                  <CardDescription className="mt-1.5 dark:text-slate-400">{app.designation}{app.department ? ` • ${app.department}` : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    Applied on {format(new Date(app.createdAt), 'MMM d, yyyy')}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors"
                    onClick={() => downloadApplicationPDF(app)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 mt-12">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
            <BadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight">Nametag Requests</h2>
        </div>
        {loadingTags ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading nametags...</div>
        ) : nametags.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-700">
            <CardContent>
              <div className="mx-auto bg-white dark:bg-slate-800 shadow-sm p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <BadgeIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No nametag requests yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">You haven't submitted any nametag requests. Click the button below to get started.</p>
              <Link to="/nametag-request">
                <Button variant="outline" className="shadow-sm">Request Nametag</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nametags.map((tag) => (
              <Card key={tag.id} className="group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors relative">
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
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg font-bold leading-tight dark:text-white">{tag.name}</CardTitle>
                    {getStatusBadge(tag.status)}
                  </div>
                  <CardDescription className="mt-1.5 dark:text-slate-400">{tag.designation}{tag.department ? ` • ${tag.department}` : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-100 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Fastener: <span className="font-semibold text-slate-700 dark:text-slate-300">{tag.fastenerType}</span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Requested: <span className="font-medium text-slate-700 dark:text-slate-300">{format(new Date(tag.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {(user?.email === '140001@padmaawt.internal' || user?.email === 'padmaawtit@gmail.com') && (
        <div id="daily-works-section">
          <DailyWorks isAdding={isAddingDailyWork} setIsAdding={setIsAddingDailyWork} />
        </div>
      )}
    </div>
  );
}

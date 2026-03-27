import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { PlusCircle, FileText, Download, Badge as BadgeIcon, CheckCircle2 } from 'lucide-react';
import { downloadApplicationPDF } from '../lib/pdf';
import DailyWorks from '../components/DailyWorks';

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

    return () => {
      unsubscribeApps();
      unsubscribeTags();
    };
  }, [user]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your ID card and nametag requests</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
        </div>
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
              <Card key={app.id} className="group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
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
              <Card key={tag.id} className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
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

      <div id="daily-works-section">
        <DailyWorks isAdding={isAddingDailyWork} setIsAdding={setIsAddingDailyWork} />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Navigate, Link } from 'react-router-dom';
import { FileText, Badge as BadgeIcon, Clock, CheckCircle, XCircle, Printer, Send } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Application {
  id: string;
  name: string;
  designation: string;
  department?: string;
  status: string;
  createdAt: string;
}

interface Nametag {
  id: string;
  name: string;
  designation: string;
  department: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { role } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [nametags, setNametags] = useState<Nametag[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) return;

    const qApps = query(
      collection(db, 'applications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
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
  }, [role]);

  if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Printed': return <Badge variant="default">Printed</Badge>;
      case 'Distributed': return <Badge variant="secondary">Distributed</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  const pendingApps = applications.filter(a => a.status === 'Pending').length;
  const pendingTags = nametags.filter(t => t.status === 'Pending').length;

  const recentApps = applications.slice(0, 5);
  const recentTags = nametags.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of all applications and requests</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/apply">
            <Button className="shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              Add ID Card
            </Button>
          </Link>
          <Link to="/nametag-request">
            <Button variant="secondary" className="shadow-sm">
              <BadgeIcon className="w-4 h-4 mr-2" />
              Add Nametag
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total ID Cards</CardTitle>
            <div className="bg-primary-100 p-2 rounded-lg">
              <FileText className="h-4 w-4 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{applications.length}</div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {pendingApps} pending approval
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Nametags</CardTitle>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <BadgeIcon className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{nametags.length}</div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {pendingTags} pending approval
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Printed IDs</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Printer className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {applications.filter(a => a.status === 'Printed').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Distributed IDs</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Send className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {applications.filter(a => a.status === 'Distributed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-lg">Recent ID Card Applications</CardTitle>
              <CardDescription className="mt-1">Latest 5 applications submitted</CardDescription>
            </div>
            <Link to="/admin">
              <Button variant="outline" size="sm" className="shadow-sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingApps ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : recentApps.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No applications found</div>
            ) : (
              <div className="space-y-5">
                {recentApps.map(app => (
                  <div key={app.id} className="flex items-center justify-between border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-900">{app.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{app.designation} <span className="mx-1.5 text-slate-300">•</span> {format(new Date(app.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-lg">Recent Nametag Requests</CardTitle>
              <CardDescription className="mt-1">Latest 5 requests submitted</CardDescription>
            </div>
            <Link to="/nametag-admin">
              <Button variant="outline" size="sm" className="shadow-sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingTags ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : recentTags.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No requests found</div>
            ) : (
              <div className="space-y-5">
                {recentTags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-900">{tag.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{tag.designation} <span className="mx-1.5 text-slate-300">•</span> {format(new Date(tag.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    {getStatusBadge(tag.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

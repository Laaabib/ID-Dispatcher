import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Navigate } from 'react-router-dom';
import { FileText, Badge as BadgeIcon, Calendar, Clock, Activity, Package, Download } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { downloadReportPDF } from '../lib/pdf';
import { Button } from '../components/ui/button';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Nametag {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function Reports() {
  const { role, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [nametags, setNametags] = useState<Nametag[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Stock
  const INITIAL_ID_CARD_STOCK = 40;
  const INITIAL_NAMETAG_STOCK = 120;

  useEffect(() => {
    if (role !== 'admin') return;

    const qApps = query(
      collection(db, 'applications'),
      where('status', '==', 'Distributed')
    );

    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      const apps: Application[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    const qTags = query(
      collection(db, 'nametags'),
      where('status', '==', 'Distributed')
    );

    const unsubscribeTags = onSnapshot(qTags, (snapshot) => {
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

    return () => {
      unsubscribeApps();
      unsubscribeTags();
    };
  }, [role]);

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Calculate metrics
  const getMetrics = (items: (Application | Nametag)[]) => {
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    const totalConsumed = items.length;

    items.forEach(item => {
      const dateStr = item.updatedAt || item.createdAt;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      if (isToday(date)) daily++;
      if (isThisWeek(date)) weekly++;
      if (isThisMonth(date)) monthly++;
    });

    return { daily, weekly, monthly, totalConsumed };
  };

  const idCardMetrics = getMetrics(applications);
  const nametagMetrics = getMetrics(nametags);

  const currentIdCardStock = INITIAL_ID_CARD_STOCK - idCardMetrics.totalConsumed;
  const currentNametagStock = INITIAL_NAMETAG_STOCK - nametagMetrics.totalConsumed;

  const handleExportPDF = () => {
    downloadReportPDF({
      idCards: {
        initialStock: INITIAL_ID_CARD_STOCK,
        currentStock: currentIdCardStock,
        totalConsumed: idCardMetrics.totalConsumed,
        daily: idCardMetrics.daily,
        weekly: idCardMetrics.weekly,
        monthly: idCardMetrics.monthly,
      },
      nametags: {
        initialStock: INITIAL_NAMETAG_STOCK,
        currentStock: currentNametagStock,
        totalConsumed: nametagMetrics.totalConsumed,
        daily: nametagMetrics.daily,
        weekly: nametagMetrics.weekly,
        monthly: nametagMetrics.monthly,
      },
      generatedBy: user?.displayName || 'Admin'
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading reports...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory & Consumption Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Track stock levels and distribution metrics for ID Cards and Nametags.</p>
        </div>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ID Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">ID Cards</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Stock</p>
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{INITIAL_ID_CARD_STOCK}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Stock</p>
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <p className={`text-3xl font-bold ${currentIdCardStock <= 10 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {currentIdCardStock}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Distribution Metrics</CardTitle>
              <CardDescription>ID cards given to employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Today</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{idCardMetrics.daily}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">This Week</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{idCardMetrics.weekly}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">This Month</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{idCardMetrics.monthly}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">Total Consumed</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{idCardMetrics.totalConsumed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nametags Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BadgeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Nametags</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Stock</p>
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{INITIAL_NAMETAG_STOCK}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Stock</p>
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
                <p className={`text-3xl font-bold ${currentNametagStock <= 20 ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {currentNametagStock}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Distribution Metrics</CardTitle>
              <CardDescription>Nametags given to employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Today</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{nametagMetrics.daily}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">This Week</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{nametagMetrics.weekly}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">This Month</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{nametagMetrics.monthly}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/50">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">Total Consumed</span>
                  </div>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{nametagMetrics.totalConsumed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

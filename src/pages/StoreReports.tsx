import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, History, Package, Monitor } from 'lucide-react';
import { downloadInventoryPDF, downloadInOutReportPDF } from '../lib/pdf';

export default function StoreReports() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = role === 'admin' || user.email === '140001@padmaawt.internal' || user.email === 'padmaawtit@gmail.com';

    let itemsQuery = query(collection(db, 'item_inventory'));
    if (!isSuperAdmin) {
      itemsQuery = query(collection(db, 'item_inventory'), where('userId', '==', user.uid));
    }
    
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'item_inventory');
    });

    let assetsQuery = query(collection(db, 'asset_inventory'));
    if (!isSuperAdmin) {
      assetsQuery = query(collection(db, 'asset_inventory'), where('userId', '==', user.uid));
    }
    
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(assetsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'asset_inventory');
    });

    let transQuery = query(collection(db, 'item_transactions'));
    if (!isSuperAdmin) {
      transQuery = query(collection(db, 'item_transactions'), where('userId', '==', user.uid));
    }
    
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'item_transactions');
    });

    return () => {
      unsubscribeItems();
      unsubscribeAssets();
      unsubscribeTrans();
    };
  }, [user, role]);

  const handleExportItems = async () => {
    if (!user) return;
    const userName = user.displayName || user.email || 'Admin';
    await downloadInventoryPDF('items', items, userName);
  };

  const handleExportAssets = async () => {
    if (!user) return;
    const userName = user.displayName || user.email || 'Admin';
    await downloadInventoryPDF('assets', assets, userName);
  };

  const handleExportInStockAssets = async () => {
    if (!user) return;
    const userName = user.displayName || user.email || 'Admin';
    
    const inStockAssets = assets.filter(asset => {
      const assignedToStore = asset.assignedTo?.toLowerCase().trim() === 'in store' || 
                              asset.assignedTo?.toLowerCase().trim() === 'in-store' || 
                              asset.assignedTo?.toLowerCase().trim() === 'instore';
      return (!asset.assignedTo || assignedToStore) && asset.status !== 'In Use';
    });

    await downloadInventoryPDF('assets', inStockAssets, userName);
  };

  const handleExportInOutReport = async () => {
    if (!user) return;
    const userName = user.displayName || user.email || 'Admin';
    
    let filteredTransactions = transactions;
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.createdAt) <= end);
    }
    
    await downloadInOutReportPDF(filteredTransactions, userName);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Item Inventory Reports
            </CardTitle>
            <CardDescription>Export current stock and transaction history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">Current Stock</h3>
              <Button onClick={handleExportItems} className="w-full sm:w-auto gap-2">
                <FileText className="w-4 h-4" />
                Export Items PDF
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">Transaction History (In/Out)</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1">
                  <span className="text-xs text-slate-500">From:</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 py-1.5 outline-none"
                  />
                  <span className="text-xs text-slate-500">To:</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 py-1.5 outline-none"
                  />
                </div>
                <Button onClick={handleExportInOutReport} variant="outline" className="gap-2 w-full sm:w-auto">
                  <History className="w-4 h-4" />
                  Export In/Out PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary-600" />
              Asset Inventory Reports
            </CardTitle>
            <CardDescription>Export current IT assets and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">Current Assets</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleExportAssets} className="w-full sm:w-auto gap-2">
                  <FileText className="w-4 h-4" />
                  Export All Assets PDF
                </Button>
                <Button onClick={handleExportInStockAssets} variant="outline" className="w-full sm:w-auto gap-2">
                  <FileText className="w-4 h-4" />
                  In Stock Item Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

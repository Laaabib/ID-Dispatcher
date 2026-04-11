import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Package, Monitor, Plus, Trash2, Upload, Search, Filter, FileText, Download, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ItemInventory {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  remarks: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetInventory {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  assignedTo: string;
  status: string;
  remarks: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  remarks: string;
  user: string;
  userId: string;
  createdAt: string;
}

export default function InventoryManagement() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'assets'>('items');
  const [assetFilter, setAssetFilter] = useState<'all' | 'in_store' | 'used'>('all');
  
  // Data State
  const [items, setItems] = useState<ItemInventory[]>([]);
  const [assets, setAssets] = useState<AssetInventory[]>([]);
  const [transactions, setTransactions] = useState<ItemTransaction[]>([]);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  
  // Item Form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemRemarks, setItemRemarks] = useState('');
  
  // Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetSerialNumber, setAssetSerialNumber] = useState('');
  const [assetAssignedTo, setAssetAssignedTo] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [assetRemarks, setAssetRemarks] = useState('');

  // Transaction Modal State
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: 'in' | 'out', item: ItemInventory | null}>({isOpen: false, type: 'in', item: null});
  const [transactionQuantity, setTransactionQuantity] = useState('');
  const [transactionRemarks, setTransactionRemarks] = useState('');

  // Details Modal State
  const [detailsModal, setDetailsModal] = useState<{isOpen: boolean, item: ItemInventory | null}>({isOpen: false, item: null});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = role === 'admin' || user.email === '140001@padmaawt.internal' || user.email === 'padmaawtit@gmail.com';

    const itemsQuery = query(collection(db, 'item_inventory'));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      let itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemInventory[];
      
      if (!isSuperAdmin) {
        itemsData = itemsData.filter(item => item.userId === user.uid);
      }
      
      setItems(itemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'item_inventory');
    });

    const assetsQuery = query(collection(db, 'asset_inventory'));
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      let assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AssetInventory[];
      
      if (!isSuperAdmin) {
        assetsData = assetsData.filter(asset => asset.userId === user.uid);
      }
      
      setAssets(assetsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'asset_inventory');
    });

    const transQuery = query(collection(db, 'item_transactions'));
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      let transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemTransaction[];
      
      if (!isSuperAdmin) {
        transData = transData.filter(trans => trans.userId === user.uid);
      }
      
      setTransactions(transData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'item_transactions');
    });

    return () => {
      unsubscribeItems();
      unsubscribeAssets();
      unsubscribeTrans();
    };
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemCategory || !itemQuantity) return;

    try {
      const newItemRef = doc(collection(db, 'item_inventory'));
      await setDoc(newItemRef, {
        name: itemName,
        category: itemCategory,
        quantity: Number(itemQuantity),
        unit: itemUnit,
        remarks: itemRemarks,
        userId: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setItemName('');
      setItemCategory('');
      setItemQuantity('');
      setItemUnit('');
      setItemRemarks('');
      setIsAdding(false);
      toast.success("Item added successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'item_inventory');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetCategory) return;

    try {
      const newAssetRef = doc(collection(db, 'asset_inventory'));
      await setDoc(newAssetRef, {
        name: assetName,
        category: assetCategory,
        serialNumber: assetSerialNumber,
        assignedTo: assetAssignedTo,
        status: assetStatus,
        remarks: assetRemarks,
        userId: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setAssetName('');
      setAssetCategory('');
      setAssetSerialNumber('');
      setAssetAssignedTo('');
      setAssetStatus('');
      setAssetRemarks('');
      setIsAdding(false);
      toast.success("Asset added successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'asset_inventory');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'item_inventory', id));
      toast.success("Item deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'item_inventory');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteDoc(doc(db, 'asset_inventory', id));
      toast.success("Asset deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'asset_inventory');
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionModal.item || !transactionQuantity) return;
    const qty = Number(transactionQuantity);
    if (qty <= 0) return;
    
    const newQty = transactionModal.type === 'in' 
      ? transactionModal.item.quantity + qty 
      : transactionModal.item.quantity - qty;
      
    if (newQty < 0) {
      toast.error('Not enough stock to perform this operation.');
      return;
    }
    
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'item_inventory', transactionModal.item.id);
      batch.update(itemRef, { quantity: newQty, updatedAt: new Date().toISOString() });
      
      const transRef = doc(collection(db, 'item_transactions'));
      batch.set(transRef, {
        itemId: transactionModal.item.id,
        itemName: transactionModal.item.name,
        type: transactionModal.type,
        quantity: qty,
        remarks: transactionRemarks,
        user: user?.email || user?.displayName || 'Unknown',
        userId: user?.uid,
        createdAt: new Date().toISOString()
      });
      
      await batch.commit();
      setTransactionModal({isOpen: false, type: 'in', item: null});
      setTransactionQuantity('');
      setTransactionRemarks('');
      toast.success(`Stock ${transactionModal.type === 'in' ? 'added' : 'removed'} successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'item_transactions');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('Excel file is empty.');
          return;
        }

        const batch = writeBatch(db);
        let count = 0;

        if (activeTab === 'items') {
          data.forEach((row: any) => {
            if (row.Name && row.Category) {
              const newRef = doc(collection(db, 'item_inventory'));
              batch.set(newRef, {
                name: String(row.Name || ''),
                category: String(row.Category || ''),
                quantity: Number(row.Quantity || 0),
                unit: String(row.Unit || ''),
                remarks: String(row.Remarks || ''),
                userId: user?.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              count++;
            }
          });
        } else {
          data.forEach((row: any) => {
            if (row.Name && row.Category) {
              const newRef = doc(collection(db, 'asset_inventory'));
              batch.set(newRef, {
                name: String(row.Name || ''),
                category: String(row.Category || ''),
                serialNumber: String(row['Serial Number'] || row.SerialNumber || ''),
                assignedTo: String(row['Assigned To'] || row.AssignedTo || ''),
                status: String(row.Status || ''),
                remarks: String(row.Remarks || ''),
                userId: user?.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              count++;
            }
          });
        }

        if (count > 0) {
          await batch.commit();
          alert(`Successfully imported ${count} records.`);
        } else {
          alert('No valid records found. Ensure columns match: Name, Category, etc.');
        }
      } catch (error) {
        console.error('Error importing Excel:', error);
        alert('Failed to import Excel file.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    let headers = [];
    let fileName = '';
    
    if (activeTab === 'items') {
      headers = [['Name', 'Category', 'Quantity', 'Unit', 'Remarks']];
      fileName = 'Item_Inventory_Template.xlsx';
    } else {
      headers = [['Name', 'Category', 'Serial Number', 'Assigned To', 'Status', 'Remarks']];
      fileName = 'Asset_Inventory_Template.xlsx';
    }
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, fileName);
  };

  const exportItemHistory = (item: ItemInventory) => {
    const itemTrans = transactions.filter(t => t.itemId === item.id);
    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(18);
    doc.text('Item Transaction History', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    doc.text(`Item Name: ${item.name}`, 14, 32);
    doc.text(`Category: ${item.category}`, 14, 38);
    doc.text(`Current Stock: ${item.quantity} ${item.unit}`, 14, 44);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 50);

    const tableData = itemTrans.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      new Date(t.createdAt).toLocaleTimeString(),
      t.type === 'in' ? 'Stock In' : 'Stock Out',
      t.quantity,
      t.user || 'Unknown',
      t.remarks || '-'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Time', 'Type', 'Quantity', 'User', 'Remarks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    doc.save(`${item.name}_history.pdf`);
  };

  // Get unique categories for the active tab
  const categories = Array.from(new Set(
    activeTab === 'items' 
      ? items.map(i => i.category).filter(Boolean)
      : assets.map(a => a.category).filter(Boolean)
  )).sort();

  // Filter data
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? asset.category === selectedCategory : true;
    
    let matchesFilter = true;
    const assignedToStore = asset.assignedTo?.toLowerCase().trim() === 'in store' || 
                            asset.assignedTo?.toLowerCase().trim() === 'in-store' || 
                            asset.assignedTo?.toLowerCase().trim() === 'instore';

    if (assetFilter === 'in_store') {
      matchesFilter = (!asset.assignedTo || assignedToStore) && asset.status !== 'In Use';
    } else if (assetFilter === 'used') {
      matchesFilter = (!!asset.assignedTo && !assignedToStore) || asset.status === 'In Use';
    }
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const isSuperAdmin = role === 'admin' || user?.email === '140001@padmaawt.internal' || user?.email === 'padmaawtit@gmail.com';
  if (!isSuperAdmin && role !== 'inventory_manager') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage items and IT assets</p>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleDownloadTemplate}
            title="Download Excel Template"
          >
            <Download className="w-4 h-4" />
            Template
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isAdding ? 'Cancel' : `Add ${activeTab === 'items' ? 'Item' : 'Asset'}`}
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ease-out relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:transition-all after:duration-300 hover:-translate-y-0.5 ${
            activeTab === 'items'
              ? 'text-primary-600 dark:text-primary-400 after:w-full'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 after:w-0 hover:after:w-full'
          }`}
          onClick={() => { setActiveTab('items'); setSelectedCategory(''); setSearchQuery(''); setIsAdding(false); }}
        >
          <Package className="w-4 h-4" />
          Item Inventory
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ease-out relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:transition-all after:duration-300 hover:-translate-y-0.5 ${
            activeTab === 'assets'
              ? 'text-primary-600 dark:text-primary-400 after:w-full'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 after:w-0 hover:after:w-full'
          }`}
          onClick={() => { setActiveTab('assets'); setSelectedCategory(''); setSearchQuery(''); setIsAdding(false); }}
        >
          <Monitor className="w-4 h-4" />
          Asset Inventory
        </button>
      </div>

      {activeTab === 'assets' && (
        <div className="flex gap-2 mb-4">
          <Button 
            variant={assetFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setAssetFilter('all')}
            className="rounded-full"
          >
            All Assets
          </Button>
          <Button 
            variant={assetFilter === 'in_store' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setAssetFilter('in_store')}
            className="rounded-full"
          >
            In Store
          </Button>
          <Button 
            variant={assetFilter === 'used' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setAssetFilter('used')}
            className="rounded-full"
          >
            Used Assets
          </Button>
        </div>
      )}

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Add New {activeTab === 'items' ? 'Item' : 'Asset'}
          </h2>
          
          {activeTab === 'items' ? (
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input id="itemName" value={itemName} onChange={e => setItemName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemCategory">Category *</Label>
                <Input id="itemCategory" value={itemCategory} onChange={e => setItemCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemQuantity">Quantity *</Label>
                <Input id="itemQuantity" type="number" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemUnit">Unit (e.g., pcs, boxes)</Label>
                <Input id="itemUnit" value={itemUnit} onChange={e => setItemUnit(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="itemRemarks">Remarks</Label>
                <Input id="itemRemarks" value={itemRemarks} onChange={e => setItemRemarks(e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input id="assetName" value={assetName} onChange={e => setAssetName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetCategory">Category *</Label>
                <Input id="assetCategory" value={assetCategory} onChange={e => setAssetCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetSerialNumber">Serial Number</Label>
                <Input id="assetSerialNumber" value={assetSerialNumber} onChange={e => setAssetSerialNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetAssignedTo">Assigned To</Label>
                <Input id="assetAssignedTo" value={assetAssignedTo} onChange={e => setAssetAssignedTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetStatus">Status</Label>
                <Input id="assetStatus" value={assetStatus} onChange={e => setAssetStatus(e.target.value)} placeholder="e.g., Active, In Repair" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetRemarks">Remarks</Label>
                <Input id="assetRemarks" value={assetRemarks} onChange={e => setAssetRemarks(e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
                <Button type="submit">Save Asset</Button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by name or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase">
              {activeTab === 'items' ? (
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Quantity</th>
                  <th className="px-6 py-3 font-medium">Unit</th>
                  <th className="px-6 py-3 font-medium">Remarks</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Serial Number</th>
                  <th className="px-6 py-3 font-medium">Assigned To</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeTab === 'items' ? (
                filteredItems.length > 0 ? (
                  Object.entries(
                    filteredItems.reduce((acc, item) => {
                      const cat = item.category || 'Uncategorized';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {} as Record<string, ItemInventory[]>)
                  ).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryItems]) => {
                    const items = categoryItems as ItemInventory[];
                    return (
                    <React.Fragment key={category}>
                      <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={6} className="px-6 py-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          {category}
                        </td>
                      </tr>
                      {items.map((item: ItemInventory) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white pl-10">{item.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.unit || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" title="Goods In" onClick={() => setTransactionModal({isOpen: true, type: 'in', item})} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <ArrowDownToLine className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Goods Out" onClick={() => setTransactionModal({isOpen: true, type: 'out', item})} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                <ArrowUpFromLine className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="View Details" onClick={() => setDetailsModal({isOpen: true, item})} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No items found
                    </td>
                  </tr>
                )
              ) : (
                filteredAssets.length > 0 ? (
                  Object.entries(
                    filteredAssets.reduce((acc, asset) => {
                      const cat = asset.category || 'Uncategorized';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(asset);
                      return acc;
                    }, {} as Record<string, AssetInventory[]>)
                  ).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryAssets]) => {
                    const assets = categoryAssets as AssetInventory[];
                    return (
                    <React.Fragment key={category}>
                      <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={6} className="px-6 py-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          {category}
                        </td>
                      </tr>
                      {assets.map((asset: AssetInventory) => (
                        <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white pl-10">{asset.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {asset.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{asset.serialNumber || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{asset.assignedTo || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{asset.status || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No assets found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      {transactionModal.isOpen && transactionModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${transactionModal.type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {transactionModal.type === 'in' ? 'Goods In' : 'Goods Out'} - {transactionModal.item.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Current Quantity: <span className="font-bold text-slate-900 dark:text-white">{transactionModal.item.quantity} {transactionModal.item.unit}</span>
              </p>
              
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transQty">Quantity to {transactionModal.type === 'in' ? 'Add' : 'Remove'} *</Label>
                  <Input 
                    id="transQty" 
                    type="number" 
                    min="1"
                    max={transactionModal.type === 'out' ? transactionModal.item.quantity : undefined}
                    value={transactionQuantity} 
                    onChange={e => setTransactionQuantity(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transRemarks">Remarks</Label>
                  <Input 
                    id="transRemarks" 
                    value={transactionRemarks} 
                    onChange={e => setTransactionRemarks(e.target.value)} 
                    placeholder="e.g., Received from supplier, Issued to department..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setTransactionModal({isOpen: false, type: 'in', item: null});
                    setTransactionQuantity('');
                    setTransactionRemarks('');
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" className={transactionModal.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}>
                    Confirm {transactionModal.type === 'in' ? 'In' : 'Out'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailsModal.isOpen && detailsModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Item Details: {detailsModal.item.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Transaction history and stock details
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => exportItemHistory(detailsModal.item!)}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDetailsModal({isOpen: false, item: null})}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {detailsModal.item.quantity} <span className="text-sm font-normal text-slate-500">{detailsModal.item.unit}</span>
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Total Stock In</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {transactions
                      .filter(t => t.itemId === detailsModal.item?.id && t.type === 'in')
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-amber-600 uppercase font-semibold mb-1">Total Stock Out</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {transactions
                      .filter(t => t.itemId === detailsModal.item?.id && t.type === 'out')
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                Transaction History
              </h3>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {transactions
                      .filter(t => t.itemId === detailsModal.item?.id)
                      .map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.type === 'in' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}>
                              {t.type === 'in' ? 'In' : 'Out'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            t.type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {t.type === 'in' ? '+' : '-'}{t.quantity}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                            {t.user}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs italic">
                            {t.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    {transactions.filter(t => t.itemId === detailsModal.item?.id).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                          No transaction history found for this item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

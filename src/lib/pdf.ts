import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImgSrc from '../assets/Logo.svg';

// Shared helper to load image
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 200;
      canvas.height = img.height || 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

export interface PDFApplicationData {
  name: string;
  designation: string;
  department?: string;
  employeeId: string;
  nidNumber: string;
  applicationDate: string;
  joiningDate: string;
  bloodGroup?: string;
  status: string;
  signatureData: string;
}

export const downloadApplicationPDF = async (app: PDFApplicationData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 15;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // --- HEADER ---
  try {
    const logoBase64 = await loadImage(logoImgSrc);
    doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  } catch (e) {
    console.warn('Could not load logo', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("LOGO", MARGIN + 7.5, MARGIN + 8.5, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Padma AWT Rest House", MARGIN + 20, MARGIN + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Employee Identification Card Application - Official Record Document", MARGIN + 20, MARGIN + 12);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 18, PAGE_WIDTH - MARGIN, MARGIN + 18);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("ID CARD APPLICATION FORM", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

  // Application Date & Status
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${app.applicationDate}`, MARGIN, MARGIN + 32);
  doc.text(`Status: ${app.status.toUpperCase()}`, PAGE_WIDTH - MARGIN, MARGIN + 32, { align: 'right' });

  // --- HIGHLIGHTED PHOTO INSTRUCTION ---
  doc.setFillColor(254, 240, 138); // yellow-200
  doc.rect(MARGIN, MARGIN + 36, CONTENT_WIDTH, 10, 'F');
  doc.setTextColor(161, 98, 7); // yellow-700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("IMPORTANT: Send your passport photo to this number +8801769085102 (WhatsApp only)", PAGE_WIDTH / 2, MARGIN + 42.5, { align: 'center' });

  // --- FORM FIELDS ---
  let currentY = MARGIN + 55;
  const fieldWidth = CONTENT_WIDTH;
  
  const drawField = (label: string, value: string, y: number, width: number) => {
    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(label, MARGIN, y);
    
    // Value Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.rect(MARGIN + 35, y - 5, width - 35, 8, 'FD');
    
    // Value Text
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(value || 'N/A', MARGIN + 37, y + 0.5);
  };

  // Section 1: Personal Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Personal Details", MARGIN, currentY - 5);
  
  currentY += 5;
  drawField("Full Name", app.name, currentY, fieldWidth);
  currentY += 12;
  drawField("NID Number", app.nidNumber, currentY, fieldWidth);
  currentY += 12;
  drawField("Blood Group", app.bloodGroup || '', currentY, fieldWidth);

  // Section 2: Employment Details
  currentY += 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Employment Details", MARGIN, currentY - 5);
  
  currentY += 5;
  drawField("Employee ID", app.employeeId, currentY, CONTENT_WIDTH);
  currentY += 12;
  drawField("Designation", app.designation, currentY, CONTENT_WIDTH);
  currentY += 12;
  drawField("Department", app.department || '', currentY, CONTENT_WIDTH);
  currentY += 12;
  drawField("Joining Date", app.joiningDate, currentY, CONTENT_WIDTH);

  // --- DECLARATION ---
  currentY += 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Declaration", MARGIN, currentY);
  
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const declarationText = "I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that this ID card remains the property of Padma AWT Rest House and must be returned upon termination of employment or upon request.";
  const splitDeclaration = doc.splitTextToSize(declarationText, CONTENT_WIDTH);
  doc.text(splitDeclaration, MARGIN, currentY);

  // --- SIGNATURES ---
  const signatureY = PAGE_HEIGHT - 45;
  
  // Applicant Signature
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, signatureY, MARGIN + 60, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Applicant's Signature", MARGIN, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${app.employeeId}`, MARGIN, signatureY + 10);
  doc.text(`Dept: ${app.department || 'N/A'}`, MARGIN, signatureY + 15);
  doc.text(`Date: ${app.applicationDate}`, MARGIN, signatureY + 20);

  // Insert Signature Image if available
  if (app.signatureData) {
    try {
      // Add signature above the line
      doc.addImage(app.signatureData, 'PNG', MARGIN + 5, signatureY - 18, 50, 15);
    } catch (e) {
      console.error('Failed to add signature to PDF', e);
    }
  }

  // Authorized Signature
  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, signatureY, PAGE_WIDTH - MARGIN, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("IT Department", authX, signatureY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Padma ID Manager - Official Document", MARGIN, footerY);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });

  // Save PDF
  doc.save(`ID_Application_${app.employeeId}_${app.name.replace(/\s+/g, '_')}.pdf`);
};

export interface ReportMetrics {
  idCards: {
    initialStock: number;
    currentStock: number;
    totalConsumed: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  nametags: {
    initialStock: number;
    currentStock: number;
    totalConsumed: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  generatedBy: string;
}

export const downloadReportPDF = async (metrics: ReportMetrics) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 15;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // --- HEADER ---
  try {
    const logoBase64 = await loadImage(logoImgSrc);
    doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  } catch (e) {
    console.warn('Could not load logo', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("LOGO", MARGIN + 7.5, MARGIN + 8.5, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Padma AWT Rest House", MARGIN + 20, MARGIN + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Inventory & Consumption Report - Official Record Document", MARGIN + 20, MARGIN + 12);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 18, PAGE_WIDTH - MARGIN, MARGIN + 18);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("MONTHLY INVENTORY REPORT", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

  // Report Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, MARGIN + 32);
  doc.text(`Generated By: ${metrics.generatedBy}`, PAGE_WIDTH - MARGIN, MARGIN + 32, { align: 'right' });

  let currentY = MARGIN + 40;

  const drawTable = (title: string, data: any) => {
    // Section Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN, currentY);
    
    currentY += 8;

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Metric", MARGIN + 5, currentY + 7);
    doc.text("Value", PAGE_WIDTH - MARGIN - 5, currentY + 7, { align: 'right' });

    currentY += 10;

    // Table Rows
    const rows = [
      { label: "Initial Stock", value: data.initialStock.toString() },
      { label: "Current Stock", value: data.currentStock.toString() },
      { label: "Total Consumed", value: data.totalConsumed.toString() },
      { label: "Consumed Today", value: data.daily.toString() },
      { label: "Consumed This Week", value: data.weekly.toString() },
      { label: "Consumed This Month", value: data.monthly.toString() },
    ];

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    rows.forEach((row, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(MARGIN, currentY, CONTENT_WIDTH, 10, 'F');
      }
      
      doc.text(row.label, MARGIN + 5, currentY + 7);
      
      // Highlight current stock if low
      if (row.label === "Current Stock" && ((title.includes("ID") && data.currentStock <= 10) || (title.includes("Nametag") && data.currentStock <= 20))) {
        doc.setTextColor(220, 38, 38); // red-600
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
      }
      
      doc.text(row.value, PAGE_WIDTH - MARGIN - 5, currentY + 7, { align: 'right' });
      currentY += 10;
    });

    // Table Border
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, currentY - (rows.length * 10) - 10, CONTENT_WIDTH, (rows.length * 10) + 10);
    
    currentY += 15;
  };

  drawTable("1. ID Cards Inventory", metrics.idCards);
  drawTable("2. Nametags Inventory", metrics.nametags);

  // --- SIGNATURES ---
  const signatureY = PAGE_HEIGHT - 45;
  
  // Authorized Signature
  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, signatureY, PAGE_WIDTH - MARGIN, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("IT Department / Admin", authX, signatureY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Padma ID Manager - Official Report", MARGIN, footerY);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });

  // Save PDF
  doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface PDFDailyWorkData {
  title: string;
  taskDate?: string;
  taskTime?: string;
  reason?: string;
  timesNeeded?: string;
  remarks?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const downloadDailyWorksPDF = async (works: PDFDailyWorkData[], generatedBy: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 15;

  // --- HEADER ---
  try {
    const logoBase64 = await loadImage(logoImgSrc);
    doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  } catch (e) {
    console.warn('Could not load logo', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("LOGO", MARGIN + 7.5, MARGIN + 8.5, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Padma AWT Rest House", MARGIN + 20, MARGIN + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Daily IT Department Works - Official Record Document", MARGIN + 20, MARGIN + 12);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 18, PAGE_WIDTH - MARGIN, MARGIN + 18);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("DAILY IT DEPARTMENT WORKS", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

  // Report Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, MARGIN + 32);
  doc.text(`Generated By: ${generatedBy}`, PAGE_WIDTH - MARGIN, MARGIN + 32, { align: 'right' });

  // --- TABLE ---
  const tableData = works.map(w => [
    w.title,
    w.status.charAt(0).toUpperCase() + w.status.slice(1),
    w.taskDate || '-',
    w.taskTime || '-',
    w.reason || '-',
    w.timesNeeded || '-',
    w.remarks || '-',
    new Date(w.createdAt).toLocaleDateString()
  ]);

  autoTable(doc, {
    startY: MARGIN + 36,
    head: [['Task Title', 'Status', 'Date', 'Time', 'Reason', 'Times Needed', 'Remarks', 'Created']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 }, // Title
      1: { cellWidth: 20 }, // Status
      2: { cellWidth: 20 }, // Date
      3: { cellWidth: 15 }, // Time
      4: { cellWidth: 40 }, // Reason
      5: { cellWidth: 20 }, // Times Needed
      6: { cellWidth: 40 }, // Remarks
      7: { cellWidth: 20 }  // Created
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // --- SIGNATURES ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 20;
  let signatureY = finalY;
  
  if (finalY > PAGE_HEIGHT - 30) {
    doc.addPage();
    signatureY = MARGIN + 20;
  }

  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, signatureY, PAGE_WIDTH - MARGIN, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("IT Department / Admin", authX, signatureY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 10;
  
  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Padma ID Manager - Official Report", MARGIN, footerY);
    doc.text(`Page ${i} of ${pageCount} - Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });
  }

  // Save PDF
  doc.save(`Daily_IT_Department_Works_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const downloadInventoryPDF = async (type: 'items' | 'assets', data: any[], generatedBy: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 15;

  // --- HEADER ---
  try {
    const logoBase64 = await loadImage(logoImgSrc);
    doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  } catch (e) {
    console.warn('Could not load logo', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("LOGO", MARGIN + 7.5, MARGIN + 8.5, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Padma AWT Rest House", MARGIN + 20, MARGIN + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("IT Department Inventory - Official Record Document", MARGIN + 20, MARGIN + 12);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 18, PAGE_WIDTH - MARGIN, MARGIN + 18);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const title = type === 'items' ? 'ITEM INVENTORY REPORT' : 'ASSET INVENTORY REPORT';
  doc.text(title, PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

  // Report Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, MARGIN + 32);
  doc.text(`Generated By: ${generatedBy}`, PAGE_WIDTH - MARGIN, MARGIN + 32, { align: 'right' });

  // --- TABLE ---
  let head: string[][] = [];
  let body: any[][] = [];
  let columnStyles: any = {};

  if (type === 'items') {
    head = [['Name', 'Category', 'Quantity', 'Unit', 'Remarks', 'Created']];
    body = data.map(item => [
      item.name,
      item.category,
      item.quantity.toString(),
      item.unit || '-',
      item.remarks || '-',
      new Date(item.createdAt).toLocaleDateString()
    ]);
    columnStyles = {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 80 },
      5: { cellWidth: 30 }
    };
  } else {
    head = [['Name', 'Category', 'Serial Number', 'Assigned To', 'Status', 'Remarks', 'Created']];
    body = data.map(asset => [
      asset.name,
      asset.category,
      asset.serialNumber || '-',
      asset.assignedTo || '-',
      asset.status || '-',
      asset.remarks || '-',
      new Date(asset.createdAt).toLocaleDateString()
    ]);
    columnStyles = {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 20 },
      5: { cellWidth: 50 },
      6: { cellWidth: 20 }
    };
  }

  autoTable(doc, {
    startY: MARGIN + 36,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles,
    margin: { left: MARGIN, right: MARGIN },
  });

  // --- SIGNATURES ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 20;
  let signatureY = finalY;
  
  if (finalY > PAGE_HEIGHT - 30) {
    doc.addPage();
    signatureY = MARGIN + 20;
  }

  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, signatureY, PAGE_WIDTH - MARGIN, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("IT Department / Admin", authX, signatureY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 10;
  
  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Padma ID Manager - Official Report", MARGIN, footerY);
    doc.text(`Page ${i} of ${pageCount} - Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });
  }

  // Save PDF
  doc.save(`${type === 'items' ? 'Item' : 'Asset'}_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface MonthlyAttendanceData {
  employeeId: string;
  name: string;
  department: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
}

export const downloadMonthlyAttendancePDF = async (
  month: string,
  department: string,
  data: MonthlyAttendanceData[],
  generatedBy: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 15;

  // --- HEADER ---
  try {
    const logoBase64 = await loadImage(logoImgSrc);
    doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  } catch (e) {
    console.warn('Could not load logo', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("LOGO", MARGIN + 7.5, MARGIN + 8.5, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Padma AWT Rest House", MARGIN + 20, MARGIN + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Monthly Attendance Report - Official Record Document", MARGIN + 20, MARGIN + 12);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 18, PAGE_WIDTH - MARGIN, MARGIN + 18);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("MONTHLY ATTENDANCE REPORT", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

  // Report Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const formattedMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  doc.text(`Month: ${formattedMonth}`, MARGIN, MARGIN + 32);
  doc.text(`Department: ${department || 'All Departments'}`, MARGIN, MARGIN + 37);
  doc.text(`Generated By: ${generatedBy}`, PAGE_WIDTH - MARGIN, MARGIN + 32, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, MARGIN + 37, { align: 'right' });

  // --- TABLE ---
  const head = [['Employee ID', 'Name', 'Department', 'Present', 'Absent', 'Late', 'Total Days']];
  const body = data.map(emp => [
    emp.employeeId,
    emp.name,
    emp.department || '-',
    emp.presentDays.toString(),
    emp.absentDays.toString(),
    emp.lateDays.toString(),
    emp.totalDays.toString()
  ]);

  autoTable(doc, {
    startY: MARGIN + 42,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // --- SIGNATURES ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 20;
  let signatureY = finalY;
  
  if (finalY > PAGE_HEIGHT - 30) {
    doc.addPage();
    signatureY = MARGIN + 20;
  }

  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, signatureY, PAGE_WIDTH - MARGIN, signatureY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("HR Department / Admin", authX, signatureY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 10;
  
  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Padma ID Manager - Official Report", MARGIN, footerY);
    doc.text(`Page ${i} of ${pageCount} - Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });
  }

  // Save PDF
  doc.save(`Monthly_Attendance_${month}_${department || 'All'}.pdf`);
};

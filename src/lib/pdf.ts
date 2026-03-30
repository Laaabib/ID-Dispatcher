import { jsPDF } from 'jspdf';
import logoImgSrc from '../assets/logo.png';

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
  const MARGIN = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Helper to load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // --- HEADER ---
  try {
    const logoImg = await loadImage(logoImgSrc);
    doc.addImage(logoImg, 'PNG', MARGIN, MARGIN, 25, 25);
  } catch (e) {
    console.warn('Could not load logo.png', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("LOGO", MARGIN + 12.5, MARGIN + 14, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Padma AWT Rest House", MARGIN + 30, MARGIN + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Employee Identification Card Application", MARGIN + 30, MARGIN + 16);
  doc.text("Official Record Document", MARGIN + 30, MARGIN + 21);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 30, PAGE_WIDTH - MARGIN, MARGIN + 30);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ID CARD APPLICATION FORM", PAGE_WIDTH / 2, MARGIN + 42, { align: 'center' });

  // Application Date & Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${app.applicationDate}`, MARGIN, MARGIN + 52);
  doc.text(`Status: ${app.status.toUpperCase()}`, PAGE_WIDTH - MARGIN, MARGIN + 52, { align: 'right' });

  // --- PHOTO BOX ---
  const photoX = PAGE_WIDTH - MARGIN - 35;
  const photoY = MARGIN + 60;
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(photoX, photoY, 35, 45);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Attach 1 Copy", photoX + 17.5, photoY + 20, { align: 'center' });
  doc.text("Passport Size", photoX + 17.5, photoY + 25, { align: 'center' });
  doc.text("Photo Here", photoX + 17.5, photoY + 30, { align: 'center' });

  // --- FORM FIELDS ---
  let currentY = MARGIN + 65;
  const fieldWidth = CONTENT_WIDTH - 45; // Leave space for photo
  
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
  currentY += 45;
  
  // Applicant Signature
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, currentY, MARGIN + 60, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Applicant's Signature", MARGIN, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${app.applicationDate}`, MARGIN, currentY + 10);

  // Insert Signature Image if available
  if (app.signatureData) {
    try {
      // Add signature above the line
      doc.addImage(app.signatureData, 'PNG', MARGIN + 5, currentY - 18, 50, 15);
    } catch (e) {
      console.error('Failed to add signature to PDF', e);
    }
  }

  // Authorized Signature
  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, currentY, PAGE_WIDTH - MARGIN, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("HR Department", authX, currentY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 15;
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
  const MARGIN = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Helper to load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // --- HEADER ---
  try {
    const logoImg = await loadImage(logoImgSrc);
    doc.addImage(logoImg, 'PNG', MARGIN, MARGIN, 25, 25);
  } catch (e) {
    console.warn('Could not load logo.png', e);
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(MARGIN, MARGIN, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("LOGO", MARGIN + 12.5, MARGIN + 14, { align: "center" });
  }

  // Company Info
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Padma AWT Rest House", MARGIN + 30, MARGIN + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Inventory & Consumption Report", MARGIN + 30, MARGIN + 16);
  doc.text("Official Record Document", MARGIN + 30, MARGIN + 21);

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 30, PAGE_WIDTH - MARGIN, MARGIN + 30);

  // --- TITLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MONTHLY INVENTORY REPORT", PAGE_WIDTH / 2, MARGIN + 42, { align: 'center' });

  // Report Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, MARGIN + 52);
  doc.text(`Generated By: ${metrics.generatedBy}`, PAGE_WIDTH - MARGIN, MARGIN + 52, { align: 'right' });

  let currentY = MARGIN + 65;

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
  currentY += 30;
  
  // Authorized Signature
  const authX = PAGE_WIDTH - MARGIN - 60;
  doc.setDrawColor(15, 23, 42);
  doc.line(authX, currentY, PAGE_WIDTH - MARGIN, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", authX, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("HR Department / Admin", authX, currentY + 10);

  // --- FOOTER ---
  const footerY = PAGE_HEIGHT - 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Padma ID Manager - Official Report", MARGIN, footerY);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });

  // Save PDF
  doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

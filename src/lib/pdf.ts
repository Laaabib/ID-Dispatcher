import { jsPDF } from 'jspdf';

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
  const doc = new jsPDF();
  
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

  // Top Banner (Geometric approximation)
  doc.setFillColor(114, 143, 206); // Light blue/purple
  doc.lines([
    [210, 0],
    [0, 40],
    [-50, 10],
    [-55, -15],
    [-55, 15],
    [-50, -10]
  ], 0, 0, [1, 1], 'F');
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(60, 60, 60);
  doc.text('ID Card Application form', 105, 25, { align: 'center' });
  
  // Logo Area
  try {
    const logoImg = await loadImage('/logo.png');
    doc.addImage(logoImg, 'PNG', 20, 50, 30, 30);
  } catch (e) {
    console.warn('Could not load logo.png, falling back to text', e);
    // Outer circle
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(1);
    doc.circle(35, 68, 15, 'FD');
    // Inner text
    doc.setTextColor(200, 0, 0);
    doc.setFontSize(8);
    doc.text("Padma", 35, 60, { align: "center" });
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(6);
    doc.text("AWT REST HOUSE", 35, 76, { align: "center" });
  }
  
  doc.setTextColor(0, 100, 0);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(28);
  doc.text('Padma', 60, 65);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text('AWT Rest House', 60, 75);
  
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 82, 130, 82);
  
  // Photo Box
  doc.setDrawColor(135, 206, 235);
  doc.setLineWidth(1);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(145, 50, 40, 50, 2, 2, 'FD');
  doc.setTextColor(135, 206, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text('Photo :', 165, 95, { align: 'center' });
  
  // Form Fields
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  
  const startY = 110;
  const lineHeight = 16;
  
  const fields = [
    { label: 'Date :', value: app.applicationDate },
    { label: 'Name :', value: app.name },
    { label: 'Designation :', value: app.designation },
    { label: 'ID Number :', value: app.employeeId },
    { label: 'Department :', value: app.department || '' },
    { label: 'NID Number :', value: app.nidNumber },
    { label: 'Joining Date :', value: app.joiningDate },
    { label: 'Blood Group :', value: app.bloodGroup || '' },
  ];
  
  fields.forEach((field, index) => {
    const y = startY + (index * lineHeight);
    doc.text(field.label, 30, y);
    
    // Draw dotted line
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([2, 3], 0);
    doc.line(70, y, 180, y);
    doc.setLineDashPattern([], 0); // reset
    
    // Print value
    doc.setFont("helvetica", "bold");
    doc.text(field.value, 75, y - 2);
    doc.setFont("times", "bold");
  });
  
  // Signature
  const sigY = startY + (fields.length * lineHeight) + 15;
  doc.text('Sign Here :', 110, sigY);
  doc.setLineDashPattern([2, 3], 0);
  doc.line(140, sigY, 190, sigY);
  doc.setLineDashPattern([], 0);
  
  if (app.signatureData) {
    try {
      doc.addImage(app.signatureData, 'PNG', 140, sigY - 15, 50, 15);
    } catch (e) {
      console.error('Failed to add signature to PDF', e);
    }
  }
  
  // Bottom Banner
  doc.setFillColor(114, 143, 206);
  doc.rect(0, 265, 210, 32, 'F');
  
  doc.save(`Application_Form_${app.employeeId}_${app.name.replace(/\s+/g, '_')}.pdf`);
};

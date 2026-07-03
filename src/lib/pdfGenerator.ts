import jsPDF from 'jspdf';
import { format } from 'date-fns';
import logoImgSrc from '../assets/Logo.svg';

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

export const generatePayslipPDF = (employee: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("COMPANY PAYSLIP", pageWidth / 2, 60, { align: "center" } as any);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const month = format(new Date(), 'MMMM yyyy');
  doc.text(`Salary Slip for ${month}`, pageWidth / 2, 80, { align: "center" } as any);
  
  doc.setLineWidth(1);
  doc.line(40, 100, pageWidth - 40, 100);

  // Employee details
  doc.setFont("helvetica", "bold");
  doc.text("Employee Name:", 40, 130);
  doc.setFont("helvetica", "normal");
  doc.text(employee.name || '-', 150, 130);
  
  doc.setFont("helvetica", "bold");
  doc.text("Employee ID:", pageWidth - 200, 130);
  doc.setFont("helvetica", "normal");
  doc.text(employee.employeeId || '-', pageWidth - 100, 130);

  doc.setFont("helvetica", "bold");
  doc.text("Department:", 40, 150);
  doc.setFont("helvetica", "normal");
  doc.text(employee.department || '-', 150, 150);
  
  doc.setFont("helvetica", "bold");
  doc.text("Designation:", pageWidth - 200, 150);
  doc.setFont("helvetica", "normal");
  doc.text(employee.designation || '-', pageWidth - 100, 150);

  doc.line(40, 170, pageWidth - 40, 170);

  // Salary structure
  const basicSalary = parseFloat(employee.basicSalary || '4000');
  const houseAllowance = parseFloat(employee.houseAllowance || '500');
  const serviceCharge = parseFloat(employee.serviceCharge || '0');

  const grossEarnings = basicSalary + houseAllowance;
  const netPay = grossEarnings + serviceCharge;

  doc.setFont("helvetica", "bold");
  doc.text("Earnings", 40, 200);

  doc.setFont("helvetica", "normal");
  doc.text("Basic Salary:", 40, 230);
  doc.text(`Tk. ${basicSalary.toFixed(2)}`, pageWidth / 2 - 40, 230, { align: "right" } as any);

  doc.text("House Allowance:", 40, 250);
  doc.text(`Tk. ${houseAllowance.toFixed(2)}`, pageWidth / 2 - 40, 250, { align: "right" } as any);
  
  doc.text("Service Charge:", 40, 270);
  doc.text(`Tk. ${serviceCharge.toFixed(2)}`, pageWidth / 2 - 40, 270, { align: "right" } as any);

  doc.setLineDashPattern([5, 5], 0);
  doc.line(40, 280, pageWidth - 40, 280);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.text("Gross Earnings:", 40, 310);
  doc.text(`Tk. ${grossEarnings.toFixed(2)}`, pageWidth / 2 - 40, 310, { align: "right" } as any);

  doc.line(40, 330, pageWidth - 40, 330);

  doc.setFontSize(14);
  doc.text("Net Pay:", 40, 360);
  doc.text(`Tk. ${netPay.toFixed(2)}`, pageWidth - 40, 360, { align: "right" } as any);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("(Amount in words: Please refer to original document)", 40, 380);

  // Signatures
  doc.text("Employer Signature", 80, 480);
  doc.line(40, 460, 180, 460);

  doc.text("Employee Signature", pageWidth - 140, 480);
  doc.line(pageWidth - 180, 460, pageWidth - 40, 460);

  doc.setFontSize(8);
  doc.text("This is a system generated payslip.", pageWidth / 2, 530, { align: "center" } as any);

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};

export const generateLeavePDF = async (leave: any, autoPrint: boolean = false) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let logoBase64 = '';
  try {
    logoBase64 = await loadImage(logoImgSrc);
  } catch (err) {
    console.error("Failed to load logo", err);
  }
  
  const drawCopy = (startY: number, title: string, isOfficeCopy: boolean) => {
    // Determine bounds
    const boxMargin = 30;
    const boxWidth = pageWidth - 60;
    
    // We will draw the bounding box at the end once we know the total height
    let y = startY;

    // "Office Copy" / "Applicant Copy" box
    doc.setFontSize(10);
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.rect(pageWidth - 110, y + 10, 80, 20);
    doc.text(title, pageWidth - 70, y + 24, { align: "center" });

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 40, y + 10, 45, 45);
    } else {
      // Fallback Logo placeholder (Left side)
      doc.setFillColor(150, 0, 0); // dark red
      doc.circle(60, y + 30, 25, 'F');
      doc.setFillColor(0, 100, 0); // dark green
      doc.circle(60, y + 30, 20, 'F');
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Padma", 60, y + 33, { align: "center" });
      doc.setTextColor(0);
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Padma AWT Rest House", pageWidth / 2, y + 30, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Army Welfare Trust", pageWidth / 2, y + 45, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("Naoduba, Jazira, Shariatpur.", pageWidth / 2, y + 58, { align: "center" });

    y += 85;

    // Form Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const formTitle = isOfficeCopy ? "Leave Application Form" : "Leave Pass";
    doc.text(formTitle, pageWidth / 2, y, { align: "center" });

    if (isOfficeCopy) {
      y += 15;
      doc.setFontSize(10);
      const limitsTxt = "Leave Benefits: D/O-[52] C/L-[10] A/L-[18] Total Leave: 80 Days";
      doc.text(limitsTxt, pageWidth / 2, y, { align: "center", textDecoration: "underline" } as any);
      y += 5;
    }

    y += 25;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Helper to draw dotted lines
    const drawWithDottedLine = (label: string, text: string, x: number, lineY: number, lineLen: number) => {
      doc.text(label, x, lineY);
      const textX = x + doc.getTextWidth(label) + 5;
      doc.text(text || '', textX, lineY);
      doc.setDrawColor(150);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(textX - 2, lineY + 2, x + lineLen, lineY + 2);
      doc.setLineDashPattern([], 0); // reset
      doc.setDrawColor(0);
    };

    // Row 1
    drawWithDottedLine("Name:", leave.employeeName || '', 40, y, 320);
    drawWithDottedLine("Department:", leave.department || '', 370, y, pageWidth - 410);
    
    y += 25;
    
    // Row 2
    drawWithDottedLine("Employee ID:", leave.employeeId || '', 40, y, 220);
    drawWithDottedLine("Job Title:", leave.designation || '', 270, y, pageWidth - 310);
    
    y += 25;

    // Row 3
    drawWithDottedLine("While on Leave Address:", leave.addressOnLeave || '', 40, y, pageWidth - 80);
    
    y += 25;

    // Row 4
    drawWithDottedLine("Contact Number:", leave.contactNo || '', 40, y, 220);
    drawWithDottedLine("Emergency Contact:", leave.emergencyContactNo || '', 270, y, pageWidth - 310);
    
    y += 25;

    // Row 5 (Leave Status Checkboxes)
    if (isOfficeCopy) {
      doc.text("Leave of Status:", 40, y);
      const leaveTypes = [
        { lbl: "A/L-", val: "Annual" },
        { lbl: "P/H-", val: "Public Holiday" },
        { lbl: "S/L-", val: "Sick" },
        { lbl: "LW/P-", val: "Leave w/o Pay" },
        { lbl: "D/O-", val: "Day Off" }
      ];
      
      let currX = 130;
      leaveTypes.forEach(lt => {
        doc.text(lt.lbl, currX, y);
        // checkbox
        doc.rect(currX + doc.getTextWidth(lt.lbl) + 2, y - 9, 10, 10);
        if (leave.leaveType === lt.val || (!lt.val && leave.leaveType === lt.lbl)) {
          doc.text("X", currX + doc.getTextWidth(lt.lbl) + 4, y);
        }
        currX += doc.getTextWidth(lt.lbl) + 22;
      });
      doc.text("Others-", currX, y);
      doc.rect(currX + doc.getTextWidth("Others-") + 2, y - 9, 60, 10);
      y += 25;
    }

    // Row 6
    drawWithDottedLine("Leave From:", leave.startDate ? format(new Date(leave.startDate), 'dd-MMM-yyyy') : '', 40, y, 220);
    drawWithDottedLine("To:", leave.endDate ? format(new Date(leave.endDate), 'dd-MMM-yyyy') : '', 270, y, pageWidth - 310);
    
    y += 25;

    // Row 7
    let days = '';
    if (leave.startDate && leave.endDate) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      days = diffDays.toString();
    }
    
    drawWithDottedLine("No of Days:", days, 40, y, 140);
    drawWithDottedLine("Reporting Time:", leave.reportingTime || '', 190, y, 160);
    drawWithDottedLine("Date:", leave.createdAt ? format(new Date(leave.createdAt), 'dd-MMM-yyyy') : '', 360, y, pageWidth - 400);

    y += 50;

    // Signatures
    doc.setLineDashPattern([2, 2], 0);
    doc.line(40, y, 160, y);
    doc.line(230, y, 360, y);
    doc.line(420, y, pageWidth - 40, y);
    doc.setLineDashPattern([], 0);

    doc.text("Applicant Signature", 100, y + 15, { align: "center" });
    doc.text("HOD", 295, y + 15, { align: "center" });
    doc.text(isOfficeCopy ? "Admin" : "Manager/HR/Admin", 485, y + 15, { align: "center" });

    // Place actual signatures if available
    if (leave.employeeSignature) {
      try { doc.addImage(leave.employeeSignature, 'PNG', 40, y - 40, 120, 35); } catch(e){}
    }
    if (leave.hodSignature) {
      try { doc.addImage(leave.hodSignature, 'PNG', 230, y - 40, 130, 35); } catch(e){}
    }
    if (leave.adminSignature) {
      try { doc.addImage(leave.adminSignature, 'PNG', 420, y - 40, pageWidth - 460, 35); } catch(e){}
    }

    y += 25;

    // Table only for Office Copy
    if (isOfficeCopy) {
      y += 10;
      const tableWidth = Math.min(pageWidth - 200, 350);
      const startX = (pageWidth - tableWidth) / 2;
      const col1 = startX;
      const col2 = startX + tableWidth * 0.4;
      const col3 = startX + tableWidth * 0.7;
      const col4 = startX + tableWidth;

      const rowH = 18;

      doc.setLineWidth(0.5);
      // Headers
      doc.rect(col1, y, tableWidth, rowH);
      doc.line(col2, y, col2, y + rowH);
      doc.line(col3, y, col3, y + rowH);
      doc.text("Leave Type", col1 + 5, y + 12);
      doc.text("Leave Taken", col2 + 5, y + 12);
      doc.text("Balance", col3 + 5, y + 12);
      y += rowH;

      const items = ["Day Off :", "Casual Leave :", "Annual Leave :"];
      items.forEach(it => {
        doc.rect(col1, y, tableWidth, rowH);
        doc.line(col2, y, col2, y + rowH);
        doc.line(col3, y, col3, y + rowH);
        doc.text(it, col1 + 5, y + 12);
        y += rowH;
      });
      y += 10;
    }

    y += 10;

    // Draw bounding box
    doc.rect(boxMargin, startY, boxWidth, y - startY);
    
    return y;
  };

  const endY1 = drawCopy(30, "Office Copy", true);
  
  // Cut line
  doc.setDrawColor(150);
  doc.setLineWidth(1);
  doc.setLineDashPattern([5, 5], 0);
  const cutY = endY1 + 15;
  doc.line(20, cutY, pageWidth - 20, cutY);
  doc.setLineDashPattern([], 0); // reset
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("✂------------------------------------------------------------------------------------------------------------------------------------------------", 25, cutY + 3);
  doc.setTextColor(0);

  drawCopy(cutY + 20, "Applicant Copy", false);

  if (autoPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');
  } else {
    doc.save(`Leave_App_${leave.employeeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Employee'}_${leave.leaveType || 'Leave'}.pdf`);
  }
};

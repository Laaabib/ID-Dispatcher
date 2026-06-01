import jsPDF from 'jspdf';
import { format } from 'date-fns';

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

export const generateLeavePDF = (leave: any, autoPrint: boolean = false) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const drawCopy = (startY: number, title: string) => {
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LEAVE APPLICATION FORM", pageWidth / 2, startY, { align: "center", textDecoration: "underline" } as any);
    doc.setFontSize(12);
    doc.text(`(${title})`, pageWidth / 2, startY + 15, { align: "center" });

    doc.setFontSize(10);
    const leftCol = 40;
    const rightCol = pageWidth / 2 + 10;

    let y = startY + 45;

    // Helper to draw label-value rows
    const drawRow = (label1: string, val1: string, label2: string, val2: string, isBold2 = false) => {
      doc.setFont("helvetica", "bold");
      doc.text(label1, leftCol, y);
      doc.setFont("helvetica", "normal");
      doc.text(val1, leftCol + 100, y);
      
      doc.setFont("helvetica", "bold");
      doc.text(label2, rightCol, y);
      if (isBold2) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(val2, rightCol + 100, y);
      
      y += 20;
    };

    drawRow(
      "Employee Name:", leave.employeeName || '-', 
      "Employee ID:", leave.employeeId || '-'
    );

    drawRow(
      "Department:", leave.department || '-', 
      "Leave Type:", leave.leaveType || '-', true
    );

    drawRow(
      "Start Date:", leave.startDate ? format(new Date(leave.startDate), 'P') : '-', 
      "End Date:", leave.endDate ? format(new Date(leave.endDate), 'P') : '-'
    );

    drawRow(
      "Leaving Time:", leave.leavingTime || '-', 
      "Reporting Time:", leave.reportingTime || '-'
    );

    drawRow(
      "Contact No:", leave.contactNo || '-', 
      "Emergency Contact:", leave.emergencyContactNo || '-'
    );

    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Address on Leave:", leftCol, y);
    doc.setFont("helvetica", "normal");
    doc.text(leave.addressOnLeave || '-', leftCol + 100, y);
    y += 25;

    // Reason
    doc.setFont("helvetica", "bold");
    doc.text("Reason for Leave:", leftCol, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    const splitReason = doc.splitTextToSize(leave.reason || '-', pageWidth - 80);
    doc.text(splitReason, leftCol, y);
    y += 40 + (splitReason.length * 10); // Adjust Y based on text lines

    // Signatures
    const sigY = y + 40;
    
    // Employee Sig
    doc.setDrawColor(100);
    doc.line(leftCol, sigY, leftCol + 130, sigY);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Signature", leftCol + 65, sigY + 12, { align: "center" });
    if (leave.employeeSignature) {
      try {
        doc.addImage(leave.employeeSignature, 'PNG', leftCol, sigY - 45, 130, 40);
      } catch (e) {}
    }

    // HOD Sig
    const midCol = pageWidth / 2;
    doc.line(midCol - 65, sigY, midCol + 65, sigY);
    doc.text("HOD Signature", midCol, sigY + 12, { align: "center" });
    if (leave.hodSignature) {
      try {
        doc.addImage(leave.hodSignature, 'PNG', midCol - 65, sigY - 45, 130, 40);
      } catch (e) {}
    }

    // Admin Sig
    const endCol = pageWidth - 40;
    doc.line(endCol - 130, sigY, endCol, sigY);
    doc.text("HR/Admin Signature", endCol - 65, sigY + 12, { align: "center" });
    if (leave.adminSignature) {
      try {
        doc.addImage(leave.adminSignature, 'PNG', endCol - 130, sigY - 45, 130, 40);
      } catch (e) {}
    } else {
       doc.setFont("helvetica", "italic");
       doc.setFontSize(9);
       doc.setTextColor(150);
       doc.text(leave.status || 'Pending', endCol - 65, sigY - 10, { align: "center" });
       doc.setTextColor(0);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(10);
    }
    
    y = sigY + 30;
    
    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Submitted: ${leave.createdAt ? format(new Date(leave.createdAt), 'PPpp') : '-'} | Print Date: ${format(new Date(), 'PPpp')}`, leftCol, y);
    doc.setTextColor(0);
    
    return y + 20; 
  };

  const endY1 = drawCopy(40, "HR / Admin Copy");
  
  // Cut line
  doc.setDrawColor(200);
  doc.setLineWidth(1);
  doc.setLineDashPattern([5, 5], 0);
  const cutY = endY1 + 20;
  doc.line(20, cutY, pageWidth - 20, cutY);
  doc.setLineDashPattern([], 0); // reset
  
  // Scissors icon or text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("✂------------------------------------------------------------------------------------------------------------------------------------------------", 25, cutY + 3);
  doc.setTextColor(0);

  drawCopy(cutY + 40, "Employee Copy");

  if (autoPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');
  } else {
    doc.save(`Leave_App_${leave.employeeName?.replace(/[^a-zA-Z0-9]/g, '_')}_${leave.leaveType}.pdf`);
  }
};

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { format, differenceInDays, parseISO } from "date-fns";
import { generateLeavePDF } from "../lib/pdfGenerator";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  XCircle,
  User as UserIcon,
  Printer,
  Download,
  Trash2,
  Edit2,
  AlertTriangle
} from "lucide-react";

export default function LeaveApplication({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const LEAVE_QUOTAS: Record<string, number> = {
    Annual: 14,
    Sick: 14,
    Casual: 7,
    Maternity: 90,
    Paternity: 14,
    "Day Off": 12,
  };

  const getLeaveBalance = () => {
    const used = leaves.reduce((acc, leave) => {
      if (leave.status === "Rejected") return acc;
      const type = leave.leaveType || "Annual";
      
      let days = 0;
      if (leave.startDate && leave.endDate) {
        const start = parseISO(leave.startDate);
        const end = parseISO(leave.endDate);
        days = Math.max(0, differenceInDays(end, start) + 1);
      } else {
        days = 1;
      }

      if (!acc[type]) acc[type] = 0;
      acc[type] += days;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(LEAVE_QUOTAS).map((type) => {
      const quota = LEAVE_QUOTAS[type];
      const usedDays = used[type] || 0;
      return {
        type,
        quota,
        used: usedDays,
        balance: quota - usedDays,
      };
    });
  };

  const leaveBalances = getLeaveBalance();

  const handlePrint = (leave: any) => {
    generateLeavePDF(leave, true);
  };


  const sigCanvas = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    leaveType: "Annual",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
    contactNo: "",
    emergencyContactNo: "",
    addressOnLeave: "",
    leavingTime: "",
    reportingTime: "",
  });

  useEffect(() => {
    if (!user) return;

    // Auto-fill some fields based on user if possible:
    setFormData((prev) => ({
      ...prev,
      employeeName: user.displayName || user.email || "",
    }));

    const q = query(
      collection(db, "leave_applications"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leavesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setLeaves(
          leavesData.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "leave_applications");
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, "leave_applications", deleteConfirmId));
        toast.success("Leave application deleted");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, "leave_applications");
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleEdit = (leave: any) => {
    setFormData({
      employeeName: leave.employeeName || "",
      employeeId: leave.employeeId || "",
      department: leave.department || "",
      leaveType: leave.leaveType || "Annual",
      startDate: leave.startDate || format(new Date(), "yyyy-MM-dd"),
      endDate: leave.endDate || format(new Date(), "yyyy-MM-dd"),
      reason: leave.reason || "",
      contactNo: leave.contactNo || "",
      emergencyContactNo: leave.emergencyContactNo || "",
      addressOnLeave: leave.addressOnLeave || "",
      leavingTime: leave.leavingTime || "",
      reportingTime: leave.reportingTime || "",
    });
    setEditingLeaveId(leave.id);
    setIsApplying(true);
    // Note: signature is not repopulated in the canvas automatically
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      leaveType: "Annual",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      reason: "",
      contactNo: "",
      emergencyContactNo: "",
      addressOnLeave: "",
      leavingTime: "",
      reportingTime: "",
    });
    setEditingLeaveId(null);
    clearSignature();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (sigCanvas.current?.isEmpty() && !editingLeaveId) {
      toast.error("Please provide a signature.");
      return;
    }

    setLoading(true);

    try {
      let signatureData = "";
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        signatureData = sigCanvas.current.getCanvas().toDataURL("image/png");
      }

      if (editingLeaveId) {
        const updateData: any = {
          employeeName: formData.employeeName,
          employeeId: formData.employeeId || "",
          department: formData.department || "",
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          contactNo: formData.contactNo,
          emergencyContactNo: formData.emergencyContactNo,
          addressOnLeave: formData.addressOnLeave,
          leavingTime: formData.leavingTime,
          reportingTime: formData.reportingTime,
          updatedAt: new Date().toISOString(),
        };
        if (signatureData) {
          updateData.employeeSignature = signatureData;
        }
        await updateDoc(doc(db, "leave_applications", editingLeaveId), updateData);
        toast.success("Leave application updated successfully");
      } else {
        const leaveData = {
          userId: user.uid,
          employeeName: formData.employeeName,
          employeeId: formData.employeeId || "",
          department: formData.department || "",
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          contactNo: formData.contactNo,
          emergencyContactNo: formData.emergencyContactNo,
          addressOnLeave: formData.addressOnLeave,
          leavingTime: formData.leavingTime,
          reportingTime: formData.reportingTime,
          employeeSignature: signatureData,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "leave_applications"), leaveData);
        toast.success("Leave application submitted successfully");
      }
      setIsApplying(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, editingLeaveId ? OperationType.UPDATE : OperationType.CREATE, "leave_applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "Approved by Admin")
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === "Rejected")
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === "Approved by HOD")
      return <Clock className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  return (
    <>
    <div className={`${embedded ? 'space-y-4' : 'p-4 md:p-8 max-w-6xl mx-auto space-y-6'} print:hidden`}>
      {!embedded && (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            My Leaves
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your leave applications
          </p>
        </div>

        <Button onClick={() => { setIsApplying(!isApplying); if(isApplying) resetForm(); }} className="gap-2">
          {isApplying ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isApplying ? "Cancel" : "Apply for Leave"}
        </Button>
      </div>
      )}

      {embedded && (
         <div className="flex justify-end mb-4">
           <Button onClick={() => { setIsApplying(!isApplying); if(isApplying) resetForm(); }} className="gap-2">
             {isApplying ? (
               <X className="w-4 h-4" />
             ) : (
               <Plus className="w-4 h-4" />
             )}
             {isApplying ? "Cancel" : "Apply for Leave"}
           </Button>
         </div>
      )}

      {/* Summary View (Leave Balances) */}
      {!isApplying && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {leaveBalances.map((item) => {
            const isLow = item.balance < (0.1 * item.quota);
            return (
            <Card key={item.type} className={`shadow-sm transition-colors ${isLow ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-center items-center relative gap-1">
                {isLow && (
                  <div className="absolute top-2 right-2 text-amber-500 dark:text-amber-400" title="Low balance warning">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <p className={`text-sm font-medium ${isLow ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{item.type} Leave</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${isLow ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>{item.balance}</span>
                  <span className={`text-xs ${isLow ? 'text-amber-600/70 dark:text-amber-500/70' : 'text-slate-500 dark:text-slate-400'}`}>/ {item.quota} remaining</span>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {isApplying && (
        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle>Leave Application Form</CardTitle>
            <CardDescription>
              Submit your request for time off. It must be approved by your HOD
              and Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Name *</Label>
                  <Input
                    id="employeeName"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="F & B Service">F & B Service</option>
                    <option value="F & B Production">F & B Production</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Front Office">Front Office</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="Admin & General">Admin & General</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Safety & Security">Safety & Security</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <select
                    id="leaveType"
                    name="leaveType"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={formData.leaveType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                    <option value="Day Off">Day Off</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Leave *</Label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  placeholder="Provide brief details about why you are taking a leave..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNo">Contact No *</Label>
                  <Input
                    id="contactNo"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactNo">Emergency Contact No *</Label>
                  <Input
                    id="emergencyContactNo"
                    name="emergencyContactNo"
                    value={formData.emergencyContactNo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressOnLeave">Address while on Leave *</Label>
                  <Input
                    id="addressOnLeave"
                    name="addressOnLeave"
                    value={formData.addressOnLeave}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leavingTime">Leaving Time *</Label>
                  <Input
                    type="time"
                    id="leavingTime"
                    name="leavingTime"
                    value={formData.leavingTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportingTime">Reporting Time (Return) *</Label>
                  <Input
                    type="time"
                    id="reportingTime"
                    name="reportingTime"
                    value={formData.reportingTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Your Signature *</Label>
                <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg overflow-hidden flex flex-col items-center p-2">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className:
                        "signature-canvas w-full h-40 max-w-sm rounded cursor-crosshair bg-white",
                    }}
                    penColor="black"
                  />
                  <div className="w-full max-w-sm pb-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSignature}
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Please sign above using your mouse or touch screen
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto min-w-[150px]"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!isApplying && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">
              Application History
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {leaves.length} Total
            </span>
          </div>

          {leaves.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-slate-500 dark:text-slate-400">
              <CalendarIcon className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
              <p>You haven't submitted any leave applications.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {leave.leaveType} Leave
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {new Date(leave.startDate).toLocaleDateString()} to{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl truncate">
                      {leave.reason}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Submitted applied on{" "}
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      {(leave.status === "Pending") && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(leave)} className="h-8" title="Edit Application">
                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(leave.id)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete Application">
                            <Trash2 className="w-4 h-4 mr-1 pointer-events-none" /> Delete
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={() => generateLeavePDF(leave)} className="h-8 print:hidden" title="Download PDF Form">
                        <Download className="w-4 h-4 mr-1" /> PDF Form
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrint(leave)} className="h-8 print:hidden" title="Print Copies">
                        <Printer className="w-4 h-4 mr-1" /> Print
                      </Button>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          leave.status === "Approved by Admin"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : leave.status === "Rejected"
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : leave.status === "Approved by HOD"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {getStatusIcon(leave.status)}
                        {leave.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Printable Template (hidden on screen, visible on print) */}
    {printData && (
      <div className="hidden print:block w-full text-black bg-white">
        {/* Render two copies (one for HR, one for Employee) */}
        {['HR / Admin Copy', 'Employee Copy'].map((copyTitle, idx) => (
          <div key={idx} className={`p-8 w-[800px] mx-auto bg-white ${idx === 1 ? 'mt-8 border-t-2 border-dashed border-gray-400 pt-8' : ''}`}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase underline">Leave Application Form</h1>
              <p className="font-semibold mt-1">({copyTitle})</p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Employee Name:</span> <span className="w-1/2">{printData.employeeName}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Employee ID:</span> <span className="w-1/2">{printData.employeeId}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Department:</span> <span className="w-1/2">{printData.department}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Leave Type:</span> <span className="w-1/2 font-bold">{printData.leaveType}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Start Date:</span> <span className="w-1/2">{new Date(printData.startDate).toLocaleDateString()}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">End Date:</span> <span className="w-1/2">{new Date(printData.endDate).toLocaleDateString()}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Leaving Time:</span> <span className="w-1/2">{printData.leavingTime || '-'}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Reporting Time:</span> <span className="w-1/2">{printData.reportingTime || '-'}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Contact No:</span> <span className="w-1/2">{printData.contactNo || '-'}</span></div>
              <div className="flex border-b border-gray-300 pb-1"><span className="w-1/2 font-semibold">Emergency Contact:</span> <span className="w-1/2">{printData.emergencyContactNo || '-'}</span></div>
            </div>
            
            <div className="mt-4 border-b border-gray-300 pb-1 text-sm flex">
              <span className="w-1/4 font-semibold shrink-0">Address on Leave:</span> 
              <span>{printData.addressOnLeave || '-'}</span>
            </div>

            <div className="mt-4 border-b border-gray-300 pb-2 text-sm">
              <div className="font-semibold mb-1">Reason for Leave:</div> 
              <div className="min-h-[50px]">{printData.reason}</div>
            </div>

            <div className="flex justify-between items-end mt-16 text-sm">
              <div className="flex flex-col items-center w-1/3">
                {printData.employeeSignature ? (
                  <img src={printData.employeeSignature} alt="Employee Sig" className="h-12 object-contain" />
                ) : <div className="h-12" />}
                <div className="border-t border-gray-600 w-full text-center pt-1 mt-2">Employee Signature</div>
              </div>
              
              <div className="flex flex-col items-center w-1/3">
                {printData.hodSignature ? (
                  <img src={printData.hodSignature} alt="HOD Sig" className="h-12 object-contain" />
                ) : <div className="h-12" />}
                <div className="border-t border-gray-600 w-full text-center pt-1 mt-2">HOD Signature</div>
              </div>

              <div className="flex flex-col items-center w-1/3 border-l border-gray-300">
                {printData.adminSignature ? (
                  <img src={printData.adminSignature} alt="Admin Sig" className="h-12 object-contain" />
                ) : <div className="h-12 text-gray-400 italic flex items-center">{printData.status}</div>}
                <div className="border-t border-gray-600 w-4/5 text-center pt-1 mt-2">HR/Admin Signature</div>
              </div>
            </div>
            
            <div className="text-right text-xs mt-4 text-gray-500">
              Submitted: {new Date(printData.createdAt).toLocaleString()} | Print Date: {new Date().toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    )}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Leave Application"
        message="Are you sure you want to delete this leave application?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  );
}

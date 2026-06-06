import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { Input } from "../components/ui/input";
import SignatureCanvas from "react-signature-canvas";
import { generateLeavePDF } from "../lib/pdfGenerator";
import { ConfirmDialog } from "../components/ui/confirm-dialog";

export default function LeaveAdmin({ embedded = false }: { embedded?: boolean }) {
  const { user, role } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewLeave, setViewLeave] = useState<any | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [isBulkSigning, setIsBulkSigning] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  const handlePrint = (leave: any) => {
    generateLeavePDF(leave, true);
  };


  // For signature modal
  const [signingRole, setSigningRole] = useState<"HOD" | "Admin" | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const q = query(collection(db, "leave_applications"));

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
  }, []);

  const openApproveModal = (leave: any, role: "HOD" | "Admin") => {
    setViewLeave(leave);
    setSigningRole(role);
  };

  const handleBulkApproveSubmit = async () => {
    if (selectedLeaves.length === 0) return;
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Please provide a signature.");
      return;
    }

    const signatureData = sigCanvas.current?.getCanvas().toDataURL("image/png");

    try {
      const updatePromises = selectedLeaves.map((id) => {
        const leaveRef = doc(db, "leave_applications", id);
        return updateDoc(leaveRef, {
          status: "Approved by Admin",
          adminSignature: signatureData,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(updatePromises);
      toast.success(`Successfully approved ${selectedLeaves.length} applications.`);
      setIsBulkSigning(false);
      setSelectedLeaves([]); // Clear selection
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "leave_applications");
    }
  };

  const handleApproveSubmit = async () => {
    if (isBulkSigning) {
      return handleBulkApproveSubmit();
    }
    if (!viewLeave) return;
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Please provide a signature.");
      return;
    }

    const signatureData = sigCanvas.current?.getCanvas().toDataURL("image/png");
    const leaveRef = doc(db, "leave_applications", viewLeave.id);

    try {
      if (signingRole === "HOD") {
        await updateDoc(leaveRef, {
          status: "Approved by HOD",
          hodSignature: signatureData,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Leave HOD approval saved.");
      } else if (signingRole === "Admin") {
        await updateDoc(leaveRef, {
          status: "Approved by Admin",
          adminSignature: signatureData,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Leave Admin approval saved.");
      }
      setSigningRole(null);
      // Wait to not abruptly close view if just signing? Actually let's close view as well on success
      setViewLeave(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "leave_applications");
    }
  };

  const handleReject = async () => {
    if (!rejectConfirmId) return;

    try {
      await updateDoc(doc(db, "leave_applications", rejectConfirmId), {
        status: "Rejected",
        updatedAt: new Date().toISOString(),
      });
      toast.success("Leave rejected successfully");
      setViewLeave(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "leave_applications");
    } finally {
      setRejectConfirmId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, "leave_applications", deleteConfirmId));
      toast.success("Leave application deleted");
      setViewLeave(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "leave_applications");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const matchesSearch =
      (leave.employeeName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (leave.department || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (leave.leaveType || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter !== "all" && leave.status !== statusFilter) return false;
    return matchesSearch;
  });

  const pendingLeaves = filteredLeaves.filter(l => l.status === "Pending" || l.status === "Approved by HOD");

  const handleToggleSelect = (id: string) => {
    setSelectedLeaves((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeaves.length === pendingLeaves.length && pendingLeaves.length > 0) {
      setSelectedLeaves([]);
    } else {
      setSelectedLeaves(pendingLeaves.map((l) => l.id));
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Approved by Admin")
      return "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
    if (status === "Rejected")
      return "bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30";
    if (status === "Approved by HOD")
      return "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
    return "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
  };

  const isSuperAdmin =
    role === "admin" ||
    user?.email === "140001@padmaawt.internal" ||
    user?.email === "padmaawtit@gmail.com";

  return (
    <>
    <div className={`${embedded ? 'space-y-4' : 'p-4 md:p-8 max-w-7xl mx-auto space-y-6'} print:hidden`}>
      {!embedded && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Leave Administration
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and approve employee leave requests
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, department, or leave type..."
              className="pl-10 bg-white dark:bg-slate-950"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && selectedLeaves.length > 0 && (
              <Button onClick={() => { setSigningRole("Admin"); setIsBulkSigning(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                 <CheckCircle2 className="w-4 h-4" /> Bulk Approve ({selectedLeaves.length})
              </Button>
            )}
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved by HOD">Approved by HOD</option>
              <option value="Approved by Admin">Approved by Admin</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {isSuperAdmin && (
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      checked={selectedLeaves.length === pendingLeaves.length && pendingLeaves.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 6 : 5}
                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No leave applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-center">
                        {(leave.status === "Pending" || leave.status === "Approved by HOD") && (
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            checked={selectedLeaves.includes(leave.id)}
                            onChange={() => handleToggleSelect(leave.id)}
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {leave.employeeName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                        {leave.department && <span>{leave.department}</span>}
                        {leave.employeeId && (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                            {leave.employeeId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      {leave.leaveType}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div>
                        {new Date(leave.startDate).toLocaleDateString()} to
                      </div>
                      <div>{new Date(leave.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(leave.status)}`}
                        >
                          {leave.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download PDF"
                          onClick={() => generateLeavePDF(leave)}
                          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 print:hidden"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print Leave"
                          onClick={() => handlePrint(leave)}
                          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 print:hidden"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View & Process"
                          onClick={() => setViewLeave(leave)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(leave.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 pointer-events-none" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewLeave && !signingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Process Leave Application
                </h2>
                <p className="text-sm text-slate-500">
                  Submitted on {new Date(viewLeave.createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewLeave(null)}
                className="rounded-full"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                    Employee
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white text-lg">
                    {viewLeave.employeeName}
                  </div>
                  {(viewLeave.employeeId || viewLeave.department) && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {viewLeave.department}{" "}
                      {viewLeave.employeeId ? `(#${viewLeave.employeeId})` : ""}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                    Leave Request
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white text-lg">
                    {viewLeave.leaveType}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {new Date(viewLeave.startDate).toLocaleDateString()} to{" "}
                    {new Date(viewLeave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                  Reason
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm border border-slate-100 dark:border-slate-800">
                  {viewLeave.reason}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Signatures */}
                <div className="space-y-2 flex flex-col">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Employee Signature
                  </div>
                  {viewLeave.employeeSignature ? (
                    <div className="h-24 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 mt-auto">
                      <img
                        src={viewLeave.employeeSignature}
                        alt="Employee Signature"
                        className="max-h-full max-w-full mix-blend-multiply dark:mix-blend-screen dark:invert"
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-50 dark:bg-slate-950 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs italic mt-auto">
                      Not provided
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex flex-col">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    HOD Signature
                  </div>
                  {viewLeave.hodSignature ? (
                    <div className="h-24 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 mt-auto">
                      <img
                        src={viewLeave.hodSignature}
                        alt="HOD Signature"
                        className="max-h-full max-w-full mix-blend-multiply dark:mix-blend-screen dark:invert"
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-end pb-2 mt-auto">
                      {viewLeave.status === "Pending" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSigningRole("HOD")}
                          className="w-full text-blue-600 dark:text-blue-400"
                        >
                          Sign as HOD
                        </Button>
                      ) : (
                        <div className="w-full text-center text-slate-400 text-xs italic">
                          Pending...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex flex-col">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Admin Signature
                  </div>
                  {viewLeave.adminSignature ? (
                    <div className="h-24 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 mt-auto">
                      <img
                        src={viewLeave.adminSignature}
                        alt="Admin Signature"
                        className="max-h-full max-w-full mix-blend-multiply dark:mix-blend-screen dark:invert"
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-end pb-2 mt-auto">
                      {viewLeave.status === "Approved by HOD" ||
                      viewLeave.status === "Pending" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSigningRole("Admin")}
                          className="w-full text-emerald-600 dark:text-emerald-400"
                        >
                          Sign as Admin
                        </Button>
                      ) : (
                        <div className="w-full text-center text-slate-400 text-xs italic">
                          Needs HOD first
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-wrap-reverse sm:flex-nowrap gap-3 justify-end items-center sticky bottom-0">
              <div className="mr-auto">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusBadge(viewLeave.status)}`}
                >
                  Status: {viewLeave.status}
                </span>
              </div>

              {viewLeave.status !== "Rejected" && (
                <Button
                  variant="destructive"
                  onClick={() => setRejectConfirmId(viewLeave.id)}
                  className="w-full sm:w-auto"
                >
                  Reject Application
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setViewLeave(null)}
                className="w-full sm:w-auto"
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingRole && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold">Approve as {signingRole} {isBulkSigning ? `(${selectedLeaves.length} Leaves)` : ""}</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please provide your signature below to approve {isBulkSigning ? 'these leave requests' : 'this leave request'}.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden p-2 flex flex-col items-center">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className:
                      "signature-canvas w-full h-40 max-w-sm rounded cursor-crosshair bg-white",
                  }}
                  penColor="black"
                />
                <div className="w-full flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => sigCanvas.current?.clear()}
                    className="text-xs h-7"
                  >
                    Clear Signature
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setSigningRole(null); setIsBulkSigning(false); }}>
                Cancel
              </Button>
              <Button
                onClick={handleApproveSubmit}
                className={
                  signingRole === "HOD"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }
              >
                Confirm Approval
              </Button>
            </div>
          </div>
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
        message="Are you sure you want to delete this leave application completely? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={!!rejectConfirmId}
        title="Reject Leave Application"
        message="Are you sure you want to reject this leave application?"
        onConfirm={handleReject}
        onCancel={() => setRejectConfirmId(null)}
        confirmText="Reject"
      />
    </>
  );
}

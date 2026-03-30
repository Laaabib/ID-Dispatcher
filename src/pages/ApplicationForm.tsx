import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';
import logoImg from '../assets/logo.svg';

export default function ApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    applicationDate: format(new Date(), 'yyyy-MM-dd'),
    joiningDate: '',
    nidNumber: '',
    employeeId: '',
    bloodGroup: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (sigCanvas.current?.isEmpty()) {
      setError('Please provide a signature.');
      return;
    }

    setLoading(true);

    try {
      const signatureData = sigCanvas.current?.getCanvas().toDataURL('image/png');
      
      const applicationData = {
        userId: user.uid,
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        applicationDate: formData.applicationDate,
        joiningDate: formData.joiningDate,
        nidNumber: formData.nidNumber,
        employeeId: formData.employeeId,
        bloodGroup: formData.bloodGroup,
        signatureData,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'applications'), applicationData);
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-slate-200/60 shadow-lg shadow-slate-200/40">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="Padma id Manager" className="h-14 w-14 object-contain drop-shadow-sm" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">ID Card Application</CardTitle>
              <CardDescription className="text-base mt-1">Fill out the form below to request a new ID card and nametag.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6 text-sm font-medium flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <p>IMPORTANT: Send your passport photo to this number <span className="font-bold">+8801769085102</span> (WhatsApp only)</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" name="designation" required value={formData.designation} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" required value={formData.department} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDate">Application Date</Label>
                <Input id="applicationDate" name="applicationDate" type="date" required value={formData.applicationDate} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input id="joiningDate" name="joiningDate" type="date" required value={formData.joiningDate} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nidNumber">NID Number</Label>
                <Input id="nidNumber" name="nidNumber" required value={formData.nidNumber} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" name="employeeId" required value={formData.employeeId} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup" className="text-slate-700 font-medium">Blood Group</Label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  required
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 hover:border-slate-300"
                >
                  <option value="" disabled>Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Signature</Label>
              <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-inner">
                <SignatureCanvas 
                  ref={sigCanvas} 
                  canvasProps={{ className: 'w-full h-40 cursor-crosshair' }} 
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={clearSignature} className="text-slate-500 hover:text-slate-900">
                  Clear Signature
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => navigate('/')} className="shadow-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="shadow-sm">
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

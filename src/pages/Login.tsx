import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { IdCard, ShieldCheck, Clock, FileText, ChevronRight, User, UserPlus } from 'lucide-react';

export default function Login() {
  const { user, login, loginWithEmployeeId, registerWithEmployeeId } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name) throw new Error('Name is required');
        await registerWithEmployeeId(employeeId, name);
      } else {
        await loginWithEmployeeId(employeeId);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Employee ID not found. Please register first.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This Employee ID is already registered. Please sign in.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-transparent font-sans transition-colors duration-300">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary-600/20 blur-3xl"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute top-[40%] left-[20%] w-[100%] h-[100%] rounded-full bg-indigo-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white p-2 rounded-xl">
              <img src="/logo.png" alt="ID Dispatcher" className="h-10 w-10 object-contain" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} />
              <IdCard className="hidden w-10 h-10 text-primary-600" />
            </div>
            <span className="text-xl font-bold tracking-tight">ID Dispatcher</span>
          </div>

          <div className="max-w-md mt-20">
            <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
              ID <br/><span className="text-primary-400">Dispatcher</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Streamline your ID card and nametag requests. A secure, centralized platform for all personnel identification needs.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <FileText className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Digital Applications</h3>
                  <p className="text-slate-400 text-sm mt-1">Submit and track your ID card requests entirely online.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <Clock className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-time Tracking</h3>
                  <p className="text-slate-400 text-sm mt-1">Monitor the status of your requests from submission to distribution.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <ShieldCheck className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure Access</h3>
                  <p className="text-slate-400 text-sm mt-1">Enterprise-grade security using your Employee ID or corporate Google credentials.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} ID Dispatcher. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Header (only visible on small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <img src="/logo.png" alt="ID Dispatcher" className="h-8 w-8 object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <IdCard className="hidden w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ID Dispatcher</span>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {isRegistering ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isRegistering ? 'Register with your Employee ID' : 'Sign in to your account to continue'}
            </p>
          </div>

          <Card className="border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-slate-300">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          className="pl-10 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isRegistering}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="dark:text-slate-300">Employee ID</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <Input 
                        id="employeeId" 
                        placeholder="e.g. EMP12345" 
                        className="pl-10 uppercase dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold shadow-sm rounded-xl dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : (isRegistering ? 'Register Account' : 'Sign In')}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register here'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
                  </div>
                </div>

                <Button 
                  onClick={login} 
                  type="button"
                  size="lg" 
                  className="w-full h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>

                <div className="text-sm text-slate-500 dark:text-slate-400 text-center space-y-4 pt-2">
                  <p>
                    By signing in, you agree to our{' '}
                    <a href="#" className="underline underline-offset-4 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="underline underline-offset-4 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center lg:text-left mt-8 pb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Need help accessing your account? <br className="sm:hidden" />
              <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors inline-flex items-center">
                Contact IT Support <ChevronRight className="w-4 h-4 ml-0.5" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

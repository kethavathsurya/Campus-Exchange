import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User as UserIcon, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, devTokenModal, closeDevTokenModal, login, register, verify } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regDepartment, setRegDepartment] = useState('');

  // Verification code field
  const [verifyCode, setVerifyCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (devTokenModal?.open) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <ShieldCheck className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Campus Verification</h3>
              <p className="text-xs text-gray-500">Verify institutional membership</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <p className="font-semibold">Development Verification Helper:</p>
            <p>Your verification code for <span className="font-bold">{devTokenModal.email}</span> is:</p>
            <div className="text-center bg-white font-mono text-lg font-bold py-1.5 rounded border border-blue-300 tracking-wider text-blue-700">
              {devTokenModal.token}
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSubmitting(true);
                setError(null);
                await verify(devTokenModal.email, verifyCode || devTokenModal.token);
              } catch (err: any) {
                setError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-3"
          >
            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Enter Verification Code</label>
              <input
                type="text"
                placeholder={devTokenModal.token}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={closeDevTokenModal}
                className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Complete Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        department: regDepartment,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4">
        
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold border-b-2 text-center transition ${
              tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Campus Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold border-b-2 text-center transition ${
              tab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Student Register
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Campus Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-2"
            >
              {submitting ? 'Authenticating...' : 'Login to Campus Exchange'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-gray-500">Quick Test Credentials: </span>
              <button
                type="button"
                onClick={() => { setLoginEmail('alex.rivera@campus.edu'); setLoginPassword('Password123!'); }}
                className="text-xs font-semibold text-blue-600 underline ml-1"
              >
                Fill Alex (Student)
              </button>
              {' | '}
              <button
                type="button"
                onClick={() => { setLoginEmail('admin.moderator@campus.edu'); setLoginPassword('Password123!'); }}
                className="text-xs font-semibold text-amber-700 underline"
              >
                Fill Admin
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Institutional / Campus Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your.name@university.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Must end in .edu or @campus.edu / @univ.edu</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Jordan Lee"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department / Program (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Computer Science, Economics, etc."
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-2"
            >
              {submitting ? 'Registering...' : 'Register & Verify Campus Status'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

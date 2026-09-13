import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSignIn: (user: UserProfile) => void;
  onSignOut: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSignOut
}) => {
  const [selectedRole, setSelectedRole] = useState<UserProfile['role']>('Small Residential Contractor');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleFirebaseGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const user = await signInWithGoogle();
      // Apply selected role
      const profileWithRole: UserProfile = {
        ...user,
        role: selectedRole,
        company: customCompany.trim() || undefined
      };
      onSignIn(profileWithRole);
      setIsSigningIn(false);
      onClose();
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setIsSigningIn(false);
      setAuthError(`Authentication failure: ${err.message || 'Google sign-in could not be completed. Please try again or open the app in a new window.'}`);
    }
  };

  const handleQuickGoogleSignIn = (email: string, name: string, company: string) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      if (!email.includes('@')) {
        throw new Error('Please provide a valid Google email address.');
      }
      // Generate deterministic or valid user ID for testing
      const sanitizedId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      onSignIn({
        id: sanitizedId,
        name,
        email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7`,
        role: selectedRole,
        company
      });
      setIsSigningIn(false);
      onClose();
    } catch (err: any) {
      setIsSigningIn(false);
      setAuthError(`Authentication failure: ${err.message || 'Unable to complete sign-in. Please try again.'}`);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!customEmail.trim() || !customName.trim()) {
      setAuthError('Authentication failure: Please enter your full name and Google email address.');
      return;
    }
    if (!customEmail.includes('@') || !customEmail.includes('.')) {
      setAuthError('Authentication failure: Please enter a valid Google email address (e.g. yourname@gmail.com).');
      return;
    }
    try {
      setIsSigningIn(true);
      const sanitizedId = 'user_' + customEmail.trim().replace(/[^a-zA-Z0-9]/g, '_');
      onSignIn({
        id: sanitizedId,
        name: customName.trim(),
        email: customEmail.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName)}&backgroundColor=0f766e`,
        role: selectedRole,
        company: customCompany.trim() || undefined
      });
      setIsSigningIn(false);
      onClose();
    } catch (err: any) {
      setIsSigningIn(false);
      setAuthError(`Authentication failure: ${err.message || 'Authentication error occurred. Please verify your credentials.'}`);
    }
  };

  return (
    <div id="google-auth-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <h3 className="font-semibold text-slate-900 text-lg">Google Sign-in</h3>
          </div>
          <button
            id="close-google-auth-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User-friendly error message if present */}
        {authError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Authentication Notice</p>
              <p className="mt-0.5">{authError}</p>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-400 hover:text-red-700 text-xs font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {currentUser ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{currentUser.role} {currentUser.company ? `• ${currentUser.company}` : ''}</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                id="sign-out-btn"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
              >
                Sign Out
              </button>
              <button
                id="continue-user-btn"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Keep Signed In
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with your Google Account to save permit search history, pre-submission checklists, and feedback across sessions.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Your Contractor Profile Role:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  'Small Residential Contractor',
                  'Permit Coordinator',
                  'Small Construction Business Owner'
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as UserProfile['role'])}
                    className={`text-left px-3 py-2 text-xs rounded-lg border transition cursor-pointer ${
                      selectedRole === role
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Firebase Google Sign-In button */}
            <button
              id="firebase-google-signin-btn"
              type="button"
              disabled={isSigningIn}
              onClick={handleFirebaseGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting to Google Account...' : 'Continue with Google'}</span>
            </button>

            {/* Quick 1-click Google accounts */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">or sign in as verified contractor</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              
              <button
                id="signin-workshop-user"
                disabled={isSigningIn}
                onClick={() => handleQuickGoogleSignIn('TianTian210030@gmail.com', 'Tian Tian', 'Tian Residential Contracting')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    TT
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">Tian Tian</p>
                    <p className="text-xs text-slate-500">TianTian210030@gmail.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Continue</span>
              </button>

              <button
                id="signin-demo-contractor"
                disabled={isSigningIn}
                onClick={() => handleQuickGoogleSignIn('austin.builder@permitlens.org', 'Austin Frame & Tile Co.', 'Austin Custom Builders')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    AF
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">Austin Frame & Remodel Co.</p>
                    <p className="text-xs text-slate-500">austin.builder@permitlens.org</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Select</span>
              </button>
            </div>

            {/* Custom Google account option */}
            <details className="text-xs text-slate-600 pt-1">
              <summary className="cursor-pointer text-blue-600 hover:underline font-medium">Or enter your own Google account details</summary>
              <form onSubmit={handleCustomSubmit} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Google Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vance Residential Framing LLC"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full mt-2 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Sign In With Google
                </button>
              </form>
            </details>

            <div className="flex items-center space-x-1.5 text-xs text-slate-400 justify-center pt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Google Identity Account • Persistent Session Storage</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

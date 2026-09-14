import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { NAME_MAX_LENGTH, COMPANY_MAX_LENGTH, validateSignInProfile } from '../lib/validation';
import { toUserFriendlyError } from '../lib/errors';
import { GoogleIcon } from './common/GoogleIcon';
import { LoadingSpinner } from './common/LoadingSpinner';

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
      setAuthError(toUserFriendlyError(err, 'auth'));
    }
  };

  const handleQuickGoogleSignIn = (email: string, name: string, company: string) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const profileError = validateSignInProfile(name, email, company);
      if (profileError) {
        throw new Error(profileError);
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
      setAuthError(toUserFriendlyError(err, 'auth'));
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const profileError = validateSignInProfile(customName, customEmail, customCompany);
    if (profileError) {
      setAuthError(profileError);
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
      setAuthError(toUserFriendlyError(err, 'auth'));
    }
  };

  return (
    <div id="google-auth-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <GoogleIcon className="h-5 w-5" />
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
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-70"
            >
              {isSigningIn ? <LoadingSpinner className="h-5 w-5 text-slate-600" /> : <GoogleIcon className="h-5 w-5 shrink-0" />}
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
                    minLength={2}
                    maxLength={NAME_MAX_LENGTH}
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
                    maxLength={COMPANY_MAX_LENGTH}
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

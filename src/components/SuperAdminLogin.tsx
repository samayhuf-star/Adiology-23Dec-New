import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmail } from '../utils/auth';
import { supabase } from '../utils/supabase/client';
import { notifications } from '../utils/notifications';

interface SuperAdminLoginProps {
  onLoginSuccess: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      console.log('Login attempt - Email:', `[${trimmedEmail}]`, 'Password:', `[${trimmedPassword}]`);

      // TEST ADMIN LOGIN - Direct bypass for testing
      const isTestAdmin = (
        (trimmedEmail === 'admin' || email === 'admin' || trimmedEmail === 'admin@admin.com') && 
        (trimmedPassword === 'admin' || password === 'admin')
      );
      
      if (isTestAdmin) {
        console.log('✅ Test admin credentials MATCHED - granting access');
        sessionStorage.setItem('test_admin_mode', 'true');
        sessionStorage.setItem('test_admin_email', trimmedEmail || email);
        
        notifications.success('Welcome, Super Admin!', {
          title: 'Admin Access Granted',
          description: `Logged in as ${trimmedEmail || email}`
        });
        
        setIsLoading(false);
        onLoginSuccess();
        return;
      }

      // Special case: sam@sam.com - allow login even if role check fails
      // This is for testing purposes
      const isSamEmail = trimmedEmail === 'sam@sam.com';

      // Regular Super Admin Login (Supabase Auth)
      // Sign in with Supabase Auth
      const { data, error: authError } = await signInWithEmail(trimmedEmail, trimmedPassword);

      if (authError) {
        throw authError;
      }

      if (!data?.user) {
        throw new Error('Authentication failed');
      }

      // Verify user has superadmin role (or is sam@sam.com)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // For sam@sam.com, allow access even if role is not set or user doesn't exist
      if (isSamEmail) {
        // If user doesn't exist or role is not superadmin, update/create it
        if (userError || !userData || userData.role !== 'superadmin') {
          try {
            // Try to update existing user
            const { error: updateError } = await supabase
              .from('users')
              .update({ role: 'superadmin' })
              .eq('id', data.user.id);

            // If update failed (user doesn't exist), create new user
            if (updateError) {
              await supabase
                .from('users')
                .insert({
                  id: data.user.id,
                  email: trimmedEmail,
                  full_name: 'Super Admin',
                  role: 'superadmin',
                  subscription_plan: 'enterprise',
                  subscription_status: 'active'
                });
            }
          } catch (createError) {
            console.warn('Could not update/create user profile, but allowing access for sam@sam.com:', createError);
            // Continue anyway - allow access
          }
        }
      } else {
        // For other users, strict role check
        if (userError || !userData) {
          throw new Error('User profile not found');
        }

        if (userData.role !== 'superadmin') {
          // Sign out if not superadmin
          await supabase.auth.signOut();
          throw new Error('Access denied. Superadmin role required.');
        }
      }

      // Clear test admin mode if switching to real admin
      sessionStorage.removeItem('test_admin_mode');
      sessionStorage.removeItem('test_admin_email');

      // Update URL to /superadmin
      window.history.pushState({}, '', '/superadmin');
      
      notifications.success('Welcome, Super Admin!', {
        title: 'Login Successful',
      });
      
      onLoginSuccess();
    } catch (err: any) {
      console.error('Super admin login error:', err);
      
      let errorMessage = 'Invalid credentials. Only superadmin can access this portal.';
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password.';
      } else if (err.message?.includes('Access denied')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-purple-500/50 mb-3">
              <Shield className="w-10 h-10 text-white m-auto mt-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">Adiology</h2>
            <p className="text-xs text-indigo-300 -mt-0.5">~ Samay</p>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Super Admin Access</h1>
          <p className="text-indigo-200">Secure portal for system administration</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300 z-10" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@adbuilder.com or admin (test)"
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-indigo-300 mt-1">
                💡 Test: Use "admin@admin.com" or "admin" / password "admin"
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300 z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-300" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleLogin(e as any);
              }}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access Admin Panel
                </>
              )}
            </button>
          </div>

        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-indigo-300">
            <Lock className="w-4 h-4 inline mr-1" />
            All activities are logged and monitored
          </p>
        </div>
      </div>
    </div>
  );
};
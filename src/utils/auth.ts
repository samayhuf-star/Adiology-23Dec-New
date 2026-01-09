/**
 * Auth utilities for Clerk authentication
 * This module provides helper functions for authentication with Clerk
 */

let cachedClerkUser: any = null;
let cachedClerkAuth: any = null;

export function setClerkUser(user: any) {
  cachedClerkUser = user;
}

export function setClerkAuth(auth: { getToken: () => Promise<string | null>, signOut: () => Promise<void> }) {
  cachedClerkAuth = auth;
}

export function clearProfileCache() {
  cachedClerkUser = null;
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  if (!cachedClerkUser) {
    return null;
  }
  return {
    id: cachedClerkUser.id,
    email: cachedClerkUser.primaryEmailAddress?.emailAddress || '',
  };
}

export async function getCurrentUserProfile() {
  if (!cachedClerkUser) {
    return null;
  }
  
  return {
    id: cachedClerkUser.id,
    email: cachedClerkUser.primaryEmailAddress?.emailAddress || '',
    full_name: cachedClerkUser.fullName || cachedClerkUser.firstName || cachedClerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    role: 'user',
    subscription_plan: 'free',
    subscription_status: 'active',
    avatar_url: cachedClerkUser.imageUrl,
    google_ads_default_account: null as string | null,
  };
}

export async function signOut() {
  if (cachedClerkAuth?.signOut) {
    await cachedClerkAuth.signOut();
    cachedClerkUser = null;
  }
  return true;
}

export async function isAuthenticated(): Promise<boolean> {
  return !!cachedClerkUser;
}

export async function getSession() {
  if (!cachedClerkAuth?.getToken) {
    return null;
  }
  try {
    const token = await cachedClerkAuth.getToken();
    if (token) {
      return { access_token: token };
    }
    return null;
  } catch {
    return null;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const testAdminMode = sessionStorage.getItem('test_admin_mode');
    const testAdminEmail = sessionStorage.getItem('test_admin_email');
    if (testAdminMode === 'true' || testAdminEmail === 'oadiology@gmail.com') {
      return true;
    }

    const user = await getCurrentAuthUser();
    if (!user) return false;

    const superAdminEmails = [
      'oadiology@gmail.com',
      'obed@adiology.io',
      'admin@adiology.io',
    ];
    
    return superAdminEmails.includes(user.email.toLowerCase());
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

export async function createUserProfile(userId: string, email: string, fullName: string) {
  console.log('Creating user profile via Clerk:', { userId, email, fullName });
  return {
    id: userId,
    email,
    full_name: fullName,
    role: 'user',
    subscription_plan: 'free',
    subscription_status: 'active',
  };
}

export async function signUpWithEmail(_email: string, _password: string, _fullName: string) {
  throw new Error('Use Clerk SignUp component instead');
}

export async function signInWithEmail(_email: string, _password: string) {
  throw new Error('Use Clerk SignIn component instead');
}

export async function resetPassword(_email: string) {
  throw new Error('Use Clerk password reset flow instead');
}

export async function updatePassword(_newPassword: string) {
  throw new Error('Use Clerk password update flow instead');
}

export async function resendVerificationEmail(_email: string) {
  throw new Error('Clerk handles email verification automatically');
}

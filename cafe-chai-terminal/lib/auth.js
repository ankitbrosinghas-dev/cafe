import { supabase, isSupabaseConfigured } from './supabase.js';

const LOGIN_PATH = '/auth/login.html';
function configured() { if (!isSupabaseConfigured || !supabase) throw new Error('Authentication is not configured.'); }
function appUrl(path) { return new URL(path, window.location.origin).toString(); }
export async function signUp({ fullName, email, password, phone }) { configured(); const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone }, emailRedirectTo: appUrl(LOGIN_PATH) } }); if (error) throw error; return data; }
export async function signIn(email, password) { configured(); const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
export async function signOut() { configured(); const { error } = await supabase.auth.signOut(); if (error) throw error; }
export async function sendPasswordReset(email) { configured(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl('/auth/reset-password.html') }); if (error) throw error; }
export async function updatePassword(password) { configured(); const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; }
export async function getSession() { configured(); const { data, error } = await supabase.auth.getSession(); if (error) throw error; return data.session; }
export async function getProfile() { configured(); const session = await getSession(); if (!session) return null; const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${session.access_token}` } }); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Unable to load profile.'); return { ...body.profile, user: session.user }; }
export async function updateProfile(fullName) { const session = await getSession(); if (!session) throw new Error('Please sign in to continue.'); const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ fullName }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Unable to update profile.'); return body.profile; }
export async function requireRole(roles, redirectTo = LOGIN_PATH) { const profile = await getProfile(); if (!profile) { window.location.assign(redirectTo); return null; } if (!roles.includes(profile.role)) { window.location.assign(profile.role === 'customer' ? '/account/dashboard.html' : '/admin/dashboard.html'); return null; } return profile; }
export function observeAuth(callback) { configured(); return supabase.auth.onAuthStateChange((_event, session) => callback(session)); }

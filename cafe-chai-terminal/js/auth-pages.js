import { signIn, signUp, sendPasswordReset, updatePassword, getSession, getProfile } from '../lib/auth.js';
const form = document.querySelector('[data-auth-form]');
const message = document.getElementById('authMessage');
const setMessage = (text, type = 'error') => { message.textContent = text; message.className = `auth-message ${type}`; };
const setBusy = busy => { const button = form?.querySelector('button[type="submit"]'); if (button) { button.disabled = busy; button.dataset.label ||= button.textContent; button.textContent = busy ? 'Please wait…' : button.dataset.label; } };
if (form) form.addEventListener('submit', async event => { event.preventDefault(); setBusy(true); setMessage(''); try { const data = new FormData(form); const mode = form.dataset.authForm; if (mode === 'login') { const result = await signIn(data.get('email').trim(), data.get('password')); const profile = await getProfile(); window.location.assign(['staff','admin'].includes(profile?.role) ? '../admin/dashboard.html' : '../account/dashboard.html'); } if (mode === 'signup') { await signUp({ fullName: data.get('fullName').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), password: data.get('password') }); setMessage('Account created. Check your email to verify your account before signing in.', 'success'); form.reset(); } if (mode === 'forgot') { await sendPasswordReset(data.get('email').trim()); setMessage('If that account exists, a password-reset link has been sent.', 'success'); } if (mode === 'reset') { if (data.get('password').length < 8) throw new Error('Use at least 8 characters.'); if (data.get('password') !== data.get('confirmPassword')) throw new Error('Passwords do not match.'); await updatePassword(data.get('password')); setMessage('Password updated. You can now sign in.', 'success'); form.reset(); } } catch (error) { setMessage(error.message || 'Something went wrong. Please try again.'); } finally { setBusy(false); } });
if (document.body.dataset.authPage === 'login') {
  getSession().then(async session => {
    if (session) {
      try {
        const profile = await getProfile();
        window.location.assign(['staff','admin'].includes(profile?.role) ? '../admin/dashboard.html' : '../account/dashboard.html');
      } catch (e) {
        window.location.assign('../account/dashboard.html');
      }
    }
  }).catch(() => {});
}

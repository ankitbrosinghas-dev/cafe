import { defineConfig } from 'vite';
import { resolve } from 'node:path';
const rootDir = import.meta.dirname;
const page = path => resolve(rootDir, 'cafe-chai-terminal', path);
export default defineConfig({
  root: 'cafe-chai-terminal', envDir: rootDir, envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
  build: { outDir: resolve(rootDir, 'dist'), emptyOutDir: true, rollupOptions: { input: {
    main: page('index.html'), admin: page('admin/dashboard.html'), adminLogin: page('admin/login.html'),
    authLogin: page('auth/login.html'), authSignup: page('auth/signup.html'), authForgot: page('auth/forgot-password.html'), authReset: page('auth/reset-password.html'), account: page('account/dashboard.html'), pickup: page('pickup.html')
  } } }
});

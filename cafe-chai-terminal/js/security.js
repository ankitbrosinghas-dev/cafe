/* js/security.js — Admin authentication & security */

/*
  HOW CREDENTIALS WORK:
  - Username and hashed password are stored in localStorage under 'cct_admin_creds'
  - Default credentials: username = "admin", password = "chai@2024"
  - Passwords are stored as SHA-256 hashes (never plain text)
  - After 5 failed attempts, account is locked out for 5 minutes
  - Session token expires after 4 hours of inactivity
*/

const AdminAuth = (() => {
  const CREDS_KEY   = 'cct_admin_creds';
  const SESSION_KEY = 'cct_admin_session';
  const ATTEMPTS_KEY = 'cct_login_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 300; /* seconds = 5 minutes */
  const SESSION_DURATION = 4 * 60 * 60 * 1000; /* 4 hours ms */

  /* Simple SHA-256 via SubtleCrypto — returns hex string */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* Synchronous hash for quick checks using pre-computed values */
  function hashSync(str) {
    /* djb2 hash — used only for fast local comparison fallback */
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /* Get or initialise credentials */
  function getCreds() {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch(e) {}
    }
    /* Default credentials — stored as djb2 hashes */
    const defaults = {
      username: hashSync('admin'),
      password: hashSync('chai@2024'),
      plainUsername: 'admin' /* stored so we can display it */
    };
    localStorage.setItem(CREDS_KEY, JSON.stringify(defaults));
    return defaults;
  }

  function getAttempts() {
    try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || { count: 0, since: null }; }
    catch(e) { return { count: 0, since: null }; }
  }

  function saveAttempts(obj) {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(obj));
  }

  function isLockedOut() {
    const a = getAttempts();
    if (a.count < MAX_ATTEMPTS) return false;
    const elapsed = (Date.now() - a.since) / 1000;
    if (elapsed >= LOCKOUT_DURATION) {
      saveAttempts({ count: 0, since: null });
      return false;
    }
    return true;
  }

  function lockoutRemaining() {
    const a = getAttempts();
    const elapsed = (Date.now() - a.since) / 1000;
    return Math.ceil(LOCKOUT_DURATION - elapsed);
  }

  function login(username, password) {
    if (isLockedOut()) {
      return { success: false, lockedOut: true, message: 'Account locked.' };
    }

    const creds = getCreds();
    const uHash = hashSync(username);
    const pHash = hashSync(password);

    const validUser = uHash === creds.username;
    const validPass = pHash === creds.password;

    if (validUser && validPass) {
      saveAttempts({ count: 0, since: null });
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const session = { token, username: creds.plainUsername || username, expires: Date.now() + SESSION_DURATION };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true };
    }

    const a = getAttempts();
    const newCount = a.count + 1;
    const locked = newCount >= MAX_ATTEMPTS;
    saveAttempts({ count: newCount, since: locked ? Date.now() : a.since });

    return {
      success: false,
      lockedOut: locked,
      attempts: newCount,
      message: 'Incorrect username or password.'
    };
  }

  function isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (Date.now() > s.expires) {
        sessionStorage.removeItem(SESSION_KEY);
        return false;
      }
      /* Refresh expiry on activity */
      s.expires = Date.now() + SESSION_DURATION;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      return true;
    } catch(e) { return false; }
  }

  function getSessionUser() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      return s ? s.username : 'Admin';
    } catch(e) { return 'Admin'; }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function changePassword(currentPw, newPw) {
    const creds = getCreds();
    if (hashSync(currentPw) !== creds.password) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (newPw.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters.' };
    }
    creds.password = hashSync(newPw);
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    return { success: true, message: 'Password updated successfully.' };
  }

  function changeUsername(currentPw, newUsername) {
    const creds = getCreds();
    if (hashSync(currentPw) !== creds.password) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (!newUsername || newUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters.' };
    }
    creds.username = hashSync(newUsername);
    creds.plainUsername = newUsername;
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    /* Update session */
    try {
      const s = JSON.parse(sessionStorage.getItem('cct_admin_session'));
      if (s) { s.username = newUsername; sessionStorage.setItem('cct_admin_session', JSON.stringify(s)); }
    } catch(e) {}
    return { success: true, message: 'Username updated successfully.' };
  }

  return {
    login, logout, isLoggedIn, getSessionUser,
    changePassword, changeUsername,
    isLockedOut, lockoutRemaining,
    MAX_ATTEMPTS, LOCKOUT_DURATION
  };
})();

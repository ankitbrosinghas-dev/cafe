export function getBearerToken(request) { const value = request.headers.authorization || ''; return value.startsWith('Bearer ') ? value.slice(7) : null; }
export function sendJson(response, status, body) { response.status(status).json(body); }
export function assertMethod(request, response, allowed) { if (!allowed.includes(request.method)) { sendJson(response, 405, { error: 'Method not allowed' }); return false; } return true; }

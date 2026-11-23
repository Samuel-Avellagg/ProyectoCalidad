const TOKEN_KEY = "qc_auth_token";
const USER_KEY = "qc_auth_user";

let onUnauthorizedCallback = null;

// Registra un callback global para cerrar sesión automáticamente cuando el API Gateway responda 401.
export function setUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

// Recupera el token y el perfil de usuario almacenados en localStorage.
export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  let user = null;
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

// Guarda el token de sesión y el perfil de usuario en localStorage.
export function saveStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Limpia los datos de sesión de localStorage.
export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Ejecuta peticiones HTTP adjuntando automáticamente el token Bearer de sesión.
export async function apiFetch(url, options = {}) {
  const { token } = getStoredAuth();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
    clearStoredAuth();
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  return response;
}

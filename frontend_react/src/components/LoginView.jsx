import React, { useState } from "react";
import { IconLoader, IconLock, IconUser } from "./Icons.jsx";

// Renderiza la pantalla inicial de inicio de sesión y registro antes de acceder a QualityCheck.
export default function LoginView({ apiUrl, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Envía las credenciales al API Gateway (/api/auth/login o /api/auth/register) y activa la sesión.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "register" ? `${apiUrl}/auth/register` : `${apiUrl}/auth/login`;
      const payload = mode === "register" ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo completar la autenticación");
      }

      onAuthenticated(result.token, result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="qc-login-shell">
      <div className="qc-login-card">
        <div className="qc-login-brand">
          <div className="qc-logo">QC</div>
          <div>
            <h1>QualityCheck</h1>
            <p>Sistema de Gestión y Auditoría ISO/IEC 25010</p>
          </div>
        </div>

        <div className="qc-login-tabs">
          <button
            type="button"
            className={`qc-login-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            <IconLock size={15} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            className={`qc-login-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            <IconUser size={15} />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {error && <div className="qc-alert qc-alert-error">{error}</div>}

        <form className="qc-login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="qc-field">
              <span>Nombre completo</span>
              <input
                type="text"
                placeholder="Ej. Sebastián / Fabián / Samuel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label className="qc-field">
            <span>{mode === "register" ? "Correo electrónico" : "Usuario o correo electrónico"}</span>
            <input
              type={mode === "register" ? "email" : "text"}
              placeholder={mode === "register" ? "usuario@qualitycheck.com" : "admin o usuario@qualitycheck.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="qc-field">
            <span>Contraseña</span>
            <input
              type="password"
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Ingresa tu contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "register" ? 6 : 1}
              required
            />
          </label>

          <button type="submit" className="qc-btn-primary qc-btn-icon qc-login-submit" disabled={isSubmitting}>
            {isSubmitting ? <IconLoader size={16} /> : <IconLock size={16} />}
            <span>
              {isSubmitting
                ? "Verificando..."
                : mode === "register"
                  ? "Registrarme y Entrar"
                  : "Ingresar al Sistema"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

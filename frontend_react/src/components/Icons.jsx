import React from "react";

// Renderiza un contenedor SVG base uniforme para todos los iconos de la interfaz.
function SvgIcon({ children, size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`qc-icon ${className}`.trim()}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Icono de panel de control / métricas para el Dashboard de inicio.
export function IconDashboard({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </SvgIcon>
  );
}

// Icono de carpeta con lupa para la auditoría estática de código.
export function IconFolderSearch({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1" />
      <circle cx="17" cy="17" r="3" />
      <path d="m21 21-1.9-1.9" />
    </SvgIcon>
  );
}

// Icono de carpeta para la gestión de proyectos.
export function IconFolder({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </SvgIcon>
  );
}

// Icono de lista de verificación para requisitos funcionales y no funcionales.
export function IconClipboardList({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </SvgIcon>
  );
}

// Icono de matraz para casos de prueba y ejecuciones QA.
export function IconFlask({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </SvgIcon>
  );
}

// Icono de insecto para el módulo de defectos.
export function IconBug({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </SvgIcon>
  );
}

// Icono de medalla para evaluación ISO/IEC 25010.
export function IconAward({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </SvgIcon>
  );
}

// Icono de documento para la vista de informes consolidados.
export function IconFileText({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </SvgIcon>
  );
}

// Icono de archivo de código para carga individual de archivos.
export function IconFileCode({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </SvgIcon>
  );
}

// Icono de impresora para exportar o imprimir informes en PDF.
export function IconPrinter({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </SvgIcon>
  );
}

// Icono giratorio de carga para indicar sincronización de datos del proyecto.
export function IconLoader({ size = 16 }) {
  return (
    <SvgIcon size={size} className="qc-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </SvgIcon>
  );
}

// Icono de candado para la pantalla de inicio de sesión.
export function IconLock({ size = 18 }) {
  return (
    <SvgIcon size={size}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgIcon>
  );
}

// Icono de usuario para mostrar el perfil autenticado.
export function IconUser({ size = 16 }) {
  return (
    <SvgIcon size={size}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgIcon>
  );
}

// Icono de salida para el botón de cerrar sesión.
export function IconLogOut({ size = 16 }) {
  return (
    <SvgIcon size={size}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </SvgIcon>
  );
}

import React from "react";
import {
  IconAward,
  IconBug,
  IconClipboardList,
  IconDashboard,
  IconFileText,
  IconFlask,
  IconFolder,
  IconFolderSearch,
  IconLoader,
  IconLogOut,
  IconUser,
} from "./Icons.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard Inicio", Icon: IconDashboard },
  { id: "audit", label: "Auditoría de Código", Icon: IconFolderSearch },
  { id: "projects", label: "Proyectos", Icon: IconFolder },
  { id: "requirements", label: "Requisitos", Icon: IconClipboardList },
  { id: "test-cases", label: "Casos de Prueba", Icon: IconFlask },
  { id: "defects", label: "Defectos", Icon: IconBug },
  { id: "iso-metrics", label: "Métricas ISO 25010", Icon: IconAward },
  { id: "reports", label: "Informes", Icon: IconFileText },
];

// Renderiza la barra lateral de navegación, el selector de proyecto activo y el estado del API Gateway.
export default function Sidebar({
  activeTab,
  onSelectTab,
  projects,
  selectedProject,
  onSelectProject,
  isLoadingProjectData,
  healthStatus,
  currentUser,
  onLogout,
}) {
  return (
    <aside className="qc-sidebar">
      <div className="qc-sidebar-brand">
        <div className="qc-logo">QC</div>
        <div>
          <h2>QualityCheck</h2>
          <span>Auditoría ISO/IEC 25010</span>
        </div>
      </div>

      <div className="qc-sidebar-project">
        <label htmlFor="active-project-select">Proyecto Activo</label>
        <select
          id="active-project-select"
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const found = projects.find((p) => String(p.id) === e.target.value);
            if (found) onSelectProject(found);
          }}
        >
          {projects.length === 0 && <option value="">Sin proyectos</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {isLoadingProjectData && (
          <span className="qc-sidebar-loading">
            <IconLoader size={13} /> Cargando datos...
          </span>
        )}
      </div>

      <nav className="qc-sidebar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`qc-nav-btn ${activeTab === id ? "active" : ""}`}
            onClick={() => onSelectTab(id)}
          >
            <span className="qc-nav-icon">
              <Icon size={18} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="qc-sidebar-health">
        <h4>Estado de Microservicios</h4>
        <div className="qc-health-row">
          <span>Gateway (:5000)</span>
          <span className={`qc-dot ${healthStatus?.gateway === "online" ? "on" : "off"}`} />
        </div>
        <div className="qc-health-row">
          <span>Projects (:5001)</span>
          <span className={`qc-dot ${healthStatus?.services?.project_service === "online" ? "on" : "off"}`} />
        </div>
        <div className="qc-health-row">
          <span>QA (:5002)</span>
          <span className={`qc-dot ${healthStatus?.services?.qa_service === "online" ? "on" : "off"}`} />
        </div>
        <div className="qc-health-row">
          <span>Metrics (:5003)</span>
          <span className={`qc-dot ${healthStatus?.services?.metrics_service === "online" ? "on" : "off"}`} />
        </div>
      </div>

      {currentUser && (
        <div className="qc-sidebar-user">
          <div className="qc-user-info">
            <IconUser size={16} />
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.email}</small>
            </div>
          </div>
          <button type="button" className="qc-logout-btn" onClick={onLogout}>
            <IconLogOut size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}

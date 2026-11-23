import React from "react";
import { IconFolderSearch } from "./Icons.jsx";

// Muestra el dashboard ejecutivo inicial con KPIs de calidad, conteos globales y accesos rápidos.
export default function DashboardHome({
  projects,
  selectedProject,
  indicators,
  latestAudit,
  onNavigate,
}) {
  const reqPct = indicators?.indicators?.verified_requirements_percentage ?? 0;
  const testPct = indicators?.indicators?.passed_tests_percentage ?? 0;
  const defPct = indicators?.indicators?.resolved_defects_percentage ?? 0;
  const isoScore = indicators?.latest_iso25010_evaluation?.overall_score ?? "N/A";

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Dashboard de Auditoría y Calidad</h1>
          <p>
            Resumen general del proyecto activo:{" "}
            <strong>{selectedProject ? selectedProject.name : "Ninguno seleccionado"}</strong>
          </p>
        </div>
        <button type="button" className="qc-btn-primary qc-btn-icon" onClick={() => onNavigate("audit")}>
          <IconFolderSearch size={16} />
          <span>Auditar Archivo / Carpeta</span>
        </button>
      </div>

      <div className="qc-kpi-grid-4">
        <div className="qc-kpi-card">
          <span>Requisitos Verificados</span>
          <strong>{reqPct}%</strong>
          <small>
            {indicators?.counts?.requirements?.verified ?? 0} de {indicators?.counts?.requirements?.total ?? 0}
          </small>
        </div>
        <div className="qc-kpi-card">
          <span>Pruebas Aprobadas</span>
          <strong>{testPct}%</strong>
          <small>
            {indicators?.counts?.test_cases?.passed ?? 0} de {indicators?.counts?.test_cases?.total ?? 0}
          </small>
        </div>
        <div className="qc-kpi-card">
          <span>Defectos Resueltos</span>
          <strong>{defPct}%</strong>
          <small>
            {indicators?.counts?.defects?.resolved ?? 0} de {indicators?.counts?.defects?.total ?? 0}
          </small>
        </div>
        <div className="qc-kpi-card highlight">
          <span>Puntaje ISO/IEC 25010</span>
          <strong>{isoScore === "N/A" ? "N/A" : `${isoScore}/100`}</strong>
          <small>Última evaluación registrada</small>
        </div>
      </div>

      <div className="qc-dashboard-split">
        <section className="qc-card">
          <h2>Estado del Ciclo de Calidad (QA)</h2>
          <div className="qc-summary-list">
            <div className="qc-summary-item">
              <span>Proyectos registrados en plataforma</span>
              <strong>{projects.length}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Casos de prueba aprobados</span>
              <strong>{indicators?.counts?.test_cases?.passed ?? 0}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Casos de prueba fallidos / bloqueados</span>
              <strong>
                {(indicators?.counts?.test_cases?.failed ?? 0) + (indicators?.counts?.test_cases?.blocked ?? 0)}
              </strong>
            </div>
            <div className="qc-summary-item">
              <span>Defectos abiertos actualmente</span>
              <strong>{indicators?.counts?.defects?.open ?? 0}</strong>
            </div>
          </div>

          <div className="qc-quick-actions">
            <button type="button" onClick={() => onNavigate("requirements")}>
              Ir a Requisitos
            </button>
            <button type="button" onClick={() => onNavigate("test-cases")}>
              Ir a Casos de Prueba
            </button>
            <button type="button" onClick={() => onNavigate("defects")}>
              Ir a Defectos
            </button>
            <button type="button" onClick={() => onNavigate("iso-metrics")}>
              Ir a ISO 25010
            </button>
          </div>
        </section>

        <section className="qc-card">
          <h2>Última Auditoría de Código Fuente</h2>
          {latestAudit ? (
            <div className="qc-summary-list">
              <div className="qc-summary-item">
                <span>Origen analizado</span>
                <strong>{latestAudit.source_name}</strong>
              </div>
              <div className="qc-summary-item">
                <span>Archivos / Líneas de código</span>
                <strong>
                  {latestAudit.total_files} archivos ({latestAudit.code_lines} SLOC)
                </strong>
              </div>
              <div className="qc-summary-item">
                <span>Densidad de comentarios</span>
                <strong>{latestAudit.comment_density}%</strong>
              </div>
              <div className="qc-summary-item">
                <span>Mantenibilidad sugerida</span>
                <strong>{latestAudit.suggested_maintainability_score} / 100</strong>
              </div>
            </div>
          ) : (
            <div className="qc-empty-box">
              <p>Aún no se ha auditado un archivo o carpeta en esta sesión.</p>
              <button type="button" onClick={() => onNavigate("audit")}>
                Subir Proyecto para Auditar
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

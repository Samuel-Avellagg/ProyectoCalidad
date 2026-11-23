import React from "react";
import { IconPrinter } from "./Icons.jsx";

// Calcula el dictamen general de calidad del proyecto a partir de sus indicadores y defectos abiertos.
function computeVerdict(indicators, defects, latestEval) {
  const openCritical = (defects || []).filter(
    (d) =>
      (d.severity === "Crítica" || d.severity === "Alta") &&
      d.status !== "Resuelto" &&
      d.status !== "Cerrado"
  ).length;

  const passedPct = indicators?.passed_tests_percentage ?? 0;
  const isoAvg = latestEval?.overall_score ?? null;

  if (openCritical > 0) {
    return {
      label: "Requiere correcciones",
      tone: "warning",
      detail: `Existen ${openCritical} defecto(s) crítico(s)/alto(s) sin resolver.`,
    };
  }
  if (passedPct >= 80 && (isoAvg === null || isoAvg >= 75)) {
    return {
      label: "Aprobado / Apto",
      tone: "success",
      detail: "Los indicadores QA y la evaluación de calidad cumplen los umbrales esperados.",
    };
  }
  return {
    label: "Con observaciones",
    tone: "info",
    detail: "Se recomienda completar las pruebas pendientes o mejorar la cobertura antes del cierre.",
  };
}

// Muestra el informe consolidado de auditoría y calidad del proyecto activo listo para imprimir o exportar a PDF.
export default function ReportsView({
  selectedProject,
  requirements,
  testCases,
  defects,
  indicators,
  evaluations,
  latestAudit,
}) {
  // Dispara el diálogo nativo de impresión del navegador para guardar el informe como PDF.
  function handlePrintReport() {
    window.print();
  }

  if (!selectedProject) {
    return (
      <div className="qc-view">
        <div className="qc-view-header">
          <div>
            <h1>Informes de Calidad</h1>
            <p>Selecciona o crea un proyecto para generar su informe consolidado.</p>
          </div>
        </div>
      </div>
    );
  }

  const latestEval = evaluations && evaluations.length > 0 ? evaluations[0] : null;
  const verdict = computeVerdict(indicators, defects, latestEval);
  const reqById = Object.fromEntries((requirements || []).map((r) => [r.id, r]));

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Informe Consolidado de Calidad</h1>
          <p>
            Proyecto: <strong>{selectedProject.name}</strong> · Emitido el {new Date().toLocaleDateString()}
          </p>
        </div>
        <button type="button" className="qc-btn-primary qc-btn-icon qc-no-print" onClick={handlePrintReport}>
          <IconPrinter size={16} />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      <section className="qc-card">
        <h2>1. Ficha del Proyecto y Dictamen</h2>
        <div className="qc-dashboard-split">
          <div className="qc-summary-list">
            <div className="qc-summary-item">
              <span>Nombre</span>
              <strong>{selectedProject.name}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Responsable</span>
              <strong>{selectedProject.responsible || "No asignado"}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Estado</span>
              <strong>{selectedProject.status}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Descripción / Objetivo</span>
              <strong>{selectedProject.description || "Sin descripción"}</strong>
            </div>
          </div>

          <div className="qc-summary-list">
            <div className="qc-summary-item">
              <span>Dictamen General</span>
              <strong>{verdict.label}</strong>
            </div>
            <p className="qc-subtitle" style={{ marginTop: "0.5rem" }}>
              {verdict.detail}
            </p>
          </div>
        </div>
      </section>

      <div className="qc-kpi-grid-4">
        <div className="qc-kpi-card">
          <span>Pruebas Aprobadas</span>
          <strong>{indicators?.passed_tests_percentage ?? 0}%</strong>
          <small>
            {indicators?.totals?.passed_tests ?? 0} de {indicators?.totals?.test_cases ?? 0} casos
          </small>
        </div>
        <div className="qc-kpi-card">
          <span>Requisitos Verificados</span>
          <strong>{indicators?.verified_requirements_percentage ?? 0}%</strong>
          <small>
            {indicators?.totals?.verified_requirements ?? 0} de {indicators?.totals?.requirements ?? 0} requisitos
          </small>
        </div>
        <div className="qc-kpi-card">
          <span>Defectos Resueltos</span>
          <strong>{indicators?.resolved_defects_percentage ?? 0}%</strong>
          <small>
            {indicators?.totals?.resolved_defects ?? 0} de {indicators?.totals?.defects ?? 0} defectos
          </small>
        </div>
        <div className="qc-kpi-card highlight">
          <span>Puntaje ISO/IEC 25010</span>
          <strong>{latestEval ? `${latestEval.overall_score}/100` : "N/A"}</strong>
          <small>{latestEval ? `Evaluador: ${latestEval.evaluator}` : "Sin evaluación registrada"}</small>
        </div>
      </div>

      {latestEval && (
        <section className="qc-card">
          <h2>2. Evaluación ISO/IEC 25010</h2>
          <div className="qc-summary-list">
            <div className="qc-summary-item">
              <span>Adecuación Funcional</span>
              <strong>{latestEval.functional_suitability_score}/100</strong>
            </div>
            <div className="qc-summary-item">
              <span>Eficiencia de Desempeño</span>
              <strong>{latestEval.performance_efficiency_score}/100</strong>
            </div>
            <div className="qc-summary-item">
              <span>Mantenibilidad</span>
              <strong>{latestEval.maintainability_score}/100</strong>
            </div>
          </div>
          {latestEval.observations && (
            <p className="qc-subtitle" style={{ marginTop: "0.75rem" }}>
              <strong>Observaciones:</strong> {latestEval.observations}
            </p>
          )}
        </section>
      )}

      {latestAudit && (
        <section className="qc-card">
          <h2>3. Resumen de Auditoría Estática de Código ({latestAudit.source_name})</h2>
          <div className="qc-summary-list">
            <div className="qc-summary-item">
              <span>Archivos analizados</span>
              <strong>{latestAudit.total_files}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Líneas de código (SLOC)</span>
              <strong>{latestAudit.code_lines}</strong>
            </div>
            <div className="qc-summary-item">
              <span>Densidad de comentarios</span>
              <strong>{latestAudit.comment_density}%</strong>
            </div>
            <div className="qc-summary-item">
              <span>Mantenibilidad sugerida</span>
              <strong>{latestAudit.suggested_maintainability_score}/100</strong>
            </div>
          </div>
        </section>
      )}

      <section className="qc-card">
        <h2>4. Trazabilidad de Requisitos ({requirements.length})</h2>
        <div className="qc-table-wrap">
          <table className="qc-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay requisitos registrados.</td>
                </tr>
              ) : (
                requirements.map((r) => (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>{r.title}</td>
                    <td>{r.req_type}</td>
                    <td>{r.priority}</td>
                    <td>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="qc-card">
        <h2>5. Casos de Prueba ({testCases.length})</h2>
        <div className="qc-table-wrap">
          <table className="qc-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Requisito</th>
                <th>Resultado</th>
                <th>Ejecutor</th>
              </tr>
            </thead>
            <tbody>
              {testCases.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay casos de prueba registrados.</td>
                </tr>
              ) : (
                testCases.map((tc) => (
                  <tr key={tc.id}>
                    <td>{tc.code}</td>
                    <td>{tc.title}</td>
                    <td>{reqById[tc.requirement_id]?.code || "N/A"}</td>
                    <td>{tc.execution_status}</td>
                    <td>{tc.executed_by || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="qc-card">
        <h2>6. Defectos Reportados ({defects.length})</h2>
        <div className="qc-table-wrap">
          <table className="qc-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Severidad</th>
                <th>Responsable</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {defects.length === 0 ? (
                <tr>
                  <td colSpan="4">No hay defectos reportados.</td>
                </tr>
              ) : (
                defects.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td>{d.severity}</td>
                    <td>{d.responsible}</td>
                    <td>{d.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

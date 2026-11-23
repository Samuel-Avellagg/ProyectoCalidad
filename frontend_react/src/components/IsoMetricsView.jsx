import React from "react";
import { apiFetch } from "../utils/api.js";

// Muestra los indicadores cuantitativos, el formulario de evaluación ISO/IEC 25010 y el historial.
export default function IsoMetricsView({
  apiUrl,
  selectedProject,
  indicators,
  evaluations,
  evaluationForm,
  onChangeEvaluationForm,
  onDataChanged,
  onError,
  onSuccess,
}) {
  // Registra una nueva evaluación ISO/IEC 25010 en metrics_service.
  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      onError("");
      const res = await apiFetch(`${apiUrl}/metrics/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...evaluationForm, project_id: selectedProject.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al registrar evaluación ISO 25010");
      onSuccess(`Evaluación guardada: ${result.quality_level}`);
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Indicadores y Evaluación ISO/IEC 25010</h1>
          <p>Métricas de calidad de proceso y producto para <strong>{selectedProject?.name || "Ninguno"}</strong>.</p>
        </div>
      </div>

      {!selectedProject ? (
        <section className="qc-card"><p>Selecciona un proyecto para visualizar y registrar sus métricas ISO/IEC 25010.</p></section>
      ) : (
        <>
          <div className="qc-kpi-grid-4">
            <div className="qc-kpi-card">
              <span>% Requisitos Verificados</span>
              <strong>{indicators?.indicators?.verified_requirements_percentage ?? 0}%</strong>
            </div>
            <div className="qc-kpi-card">
              <span>% Pruebas Aprobadas</span>
              <strong>{indicators?.indicators?.passed_tests_percentage ?? 0}%</strong>
            </div>
            <div className="qc-kpi-card">
              <span>% Defectos Resueltos</span>
              <strong>{indicators?.indicators?.resolved_defects_percentage ?? 0}%</strong>
            </div>
            <div className="qc-kpi-card highlight">
              <span>Último Puntaje Global</span>
              <strong>{indicators?.latest_iso25010_evaluation?.overall_score ?? "N/A"}</strong>
            </div>
          </div>

          <div className="qc-dashboard-split">
            <section className="qc-card">
              <h2>Nueva Evaluación ISO/IEC 25010</h2>
              <form onSubmit={handleSubmit} className="qc-form">
                <select
                  value={evaluationForm.evaluator}
                  onChange={(e) => onChangeEvaluationForm({ ...evaluationForm, evaluator: e.target.value })}
                >
                  <option value="Samuel">Evaluador: Samuel</option>
                  <option value="Sebastián">Evaluador: Sebastián</option>
                  <option value="Fabián">Evaluador: Fabián</option>
                </select>
                <div className="qc-row">
                  <label>
                    Adecuación Funcional (0-100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={evaluationForm.functional_suitability_score}
                      onChange={(e) =>
                        onChangeEvaluationForm({ ...evaluationForm, functional_suitability_score: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                  <label>
                    Eficiencia Desempeño (0-100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={evaluationForm.performance_efficiency_score}
                      onChange={(e) =>
                        onChangeEvaluationForm({ ...evaluationForm, performance_efficiency_score: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                  <label>
                    Mantenibilidad (0-100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={evaluationForm.maintainability_score}
                      onChange={(e) =>
                        onChangeEvaluationForm({ ...evaluationForm, maintainability_score: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                </div>
                <textarea
                  rows="3"
                  placeholder="Observaciones de auditoría"
                  value={evaluationForm.observations}
                  onChange={(e) => onChangeEvaluationForm({ ...evaluationForm, observations: e.target.value })}
                />
                <button type="submit" className="qc-btn-primary">Guardar Evaluación ISO/IEC 25010</button>
              </form>
            </section>

            <section className="qc-card">
              <h2>Historial de Evaluaciones ({evaluations.length})</h2>
              <div className="qc-table-wrap">
                <table className="qc-table">
                  <thead>
                    <tr>
                      <th>Evaluador</th>
                      <th>Adecuación</th>
                      <th>Eficiencia</th>
                      <th>Mantenibilidad</th>
                      <th>Global</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((ev) => (
                      <tr key={ev.id}>
                        <td>
                          <strong>{ev.evaluator}</strong>
                          <div className="qc-muted">{ev.observations || "Sin observaciones"}</div>
                        </td>
                        <td>{ev.functional_suitability_score}</td>
                        <td>{ev.performance_efficiency_score}</td>
                        <td>{ev.maintainability_score}</td>
                        <td><strong>{ev.overall_score}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

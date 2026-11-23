import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

// Gestiona el registro y actualización de estado de requisitos funcionales y no funcionales.
export function RequirementsView({
  apiUrl,
  selectedProject,
  requirements,
  onDataChanged,
  onError,
  onSuccess,
}) {
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    req_type: "Funcional",
    priority: "Alta",
    status: "Pendiente",
  });

  // Registra un nuevo requisito asociado al proyecto activo.
  async function handleCreate(event) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      onError("");
      const res = await apiFetch(`${apiUrl}/qa/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: selectedProject.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar requisito");
      onSuccess("Requisito registrado correctamente.");
      setForm({ code: "", title: "", description: "", req_type: "Funcional", priority: "Alta", status: "Pendiente" });
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  // Actualiza el estado de verificación de un requisito existente.
  async function handleStatusUpdate(reqId, status) {
    try {
      onError("");
      const res = await apiFetch(`${apiUrl}/qa/requirements/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar requisito");
      onSuccess("Estado del requisito actualizado.");
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Gestión de Requisitos</h1>
          <p>Proyecto activo: <strong>{selectedProject?.name || "Ninguno"}</strong></p>
        </div>
      </div>

      {!selectedProject ? (
        <section className="qc-card"><p>Selecciona un proyecto en la barra lateral para gestionar sus requisitos.</p></section>
      ) : (
        <div className="qc-dashboard-split">
          <section className="qc-card">
            <h2>Nuevo Requisito</h2>
            <form onSubmit={handleCreate} className="qc-form">
              <div className="qc-row">
                <input
                  type="text"
                  placeholder="Código (ej. REQ-01)"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
                <select value={form.req_type} onChange={(e) => setForm({ ...form, req_type: e.target.value })}>
                  <option value="Funcional">Funcional</option>
                  <option value="No Funcional">No Funcional</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Título del requisito"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                rows="2"
                placeholder="Descripción detallada"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="qc-row">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="Alta">Prioridad Alta</option>
                  <option value="Media">Prioridad Media</option>
                  <option value="Baja">Prioridad Baja</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Verificado">Verificado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <button type="submit" className="qc-btn-primary">Registrar Requisito</button>
            </form>
          </section>

          <section className="qc-card">
            <h2>Requisitos Registrados ({requirements.length})</h2>
            <div className="qc-table-wrap">
              <table className="qc-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Requisito</th>
                    <th>Tipo / Prioridad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.code}</strong></td>
                      <td>
                        {r.title}
                        <div className="qc-muted">{r.description}</div>
                      </td>
                      <td>{r.req_type} · {r.priority}</td>
                      <td>
                        <select value={r.status} onChange={(e) => handleStatusUpdate(r.id, e.target.value)}>
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Progreso">En Progreso</option>
                          <option value="Verificado">Verificado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Gestiona el diseño de casos de prueba asociados a requisitos y el registro de su ejecución.
export function TestCasesView({
  apiUrl,
  selectedProject,
  requirements,
  testCases,
  onDataChanged,
  onError,
  onSuccess,
}) {
  const [form, setForm] = useState({
    requirement_id: "",
    code: "",
    title: "",
    description: "",
    expected_result: "",
  });
  const [executedBy, setExecutedBy] = useState("Fabián");

  // Registra un nuevo caso de prueba vinculado a un requisito.
  async function handleCreate(event) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      onError("");
      const reqId = Number(form.requirement_id || requirements[0]?.id);
      if (!reqId) throw new Error("Debes crear al menos un requisito antes de diseñar un caso de prueba.");

      const res = await apiFetch(`${apiUrl}/qa/test-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: selectedProject.id, requirement_id: reqId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear caso de prueba");
      onSuccess("Caso de prueba diseñado exitosamente.");
      setForm({ requirement_id: "", code: "", title: "", description: "", expected_result: "" });
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  // Registra el resultado de ejecución (Aprobado, Fallido o Bloqueado) de un caso de prueba.
  async function handleExecute(testCaseId, executionStatus) {
    try {
      onError("");
      const res = await apiFetch(`${apiUrl}/qa/test-cases/${testCaseId}/execute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ execution_status: executionStatus, executed_by: executedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al ejecutar caso de prueba");
      onSuccess(`Prueba marcada como ${executionStatus}.`);
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Casos de Prueba y Ejecución</h1>
          <p>Diseña pruebas asociadas a requisitos y registra su ejecución (Aprobado / Fallido / Bloqueado).</p>
        </div>
        <div className="qc-inline-field">
          <label>Tester ejecutor:</label>
          <select value={executedBy} onChange={(e) => setExecutedBy(e.target.value)}>
            <option value="Fabián">Fabián</option>
            <option value="Sebastián">Sebastián</option>
            <option value="Samuel">Samuel</option>
          </select>
        </div>
      </div>

      {!selectedProject ? (
        <section className="qc-card"><p>Selecciona un proyecto para gestionar sus casos de prueba.</p></section>
      ) : (
        <div className="qc-dashboard-split">
          <section className="qc-card">
            <h2>Diseñar Caso de Prueba</h2>
            <form onSubmit={handleCreate} className="qc-form">
              <select
                value={form.requirement_id || requirements[0]?.id || ""}
                onChange={(e) => setForm({ ...form, requirement_id: e.target.value })}
                required
              >
                {requirements.length === 0 && <option value="">Sin requisitos disponibles</option>}
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Código (ej. TC-01)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Título del caso de prueba"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                rows="2"
                placeholder="Pasos de ejecución"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="text"
                placeholder="Resultado esperado"
                value={form.expected_result}
                onChange={(e) => setForm({ ...form, expected_result: e.target.value })}
              />
              <button type="submit" className="qc-btn-primary">Guardar Caso de Prueba</button>
            </form>
          </section>

          <section className="qc-card">
            <h2>Casos de Prueba ({testCases.length})</h2>
            <div className="qc-table-wrap">
              <table className="qc-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Prueba</th>
                    <th>Estado</th>
                    <th>Ejecutar</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc) => (
                    <tr key={tc.id}>
                      <td><strong>{tc.code}</strong></td>
                      <td>
                        {tc.title}
                        <div className="qc-muted">Esperado: {tc.expected_result || "N/A"}</div>
                      </td>
                      <td>
                        <span className={`qc-pill status-${tc.execution_status.toLowerCase()}`}>
                          {tc.execution_status}
                        </span>
                      </td>
                      <td>
                        <div className="qc-btn-group">
                          <button type="button" className="qc-btn-sm ok" onClick={() => handleExecute(tc.id, "Aprobado")}>
                            Aprobar
                          </button>
                          <button type="button" className="qc-btn-sm fail" onClick={() => handleExecute(tc.id, "Fallido")}>
                            Fallar
                          </button>
                          <button type="button" className="qc-btn-sm block" onClick={() => handleExecute(tc.id, "Bloqueado")}>
                            Bloquear
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Gestiona el registro y seguimiento de defectos vinculados a casos de prueba.
export function DefectsView({
  apiUrl,
  selectedProject,
  testCases,
  defects,
  onDataChanged,
  onError,
  onSuccess,
}) {
  const [form, setForm] = useState({
    test_case_id: "",
    title: "",
    description: "",
    severity: "Media",
    responsible: "Fabián",
    status: "Abierto",
  });

  // Registra un nuevo defecto vinculado a un caso de prueba.
  async function handleCreate(event) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      onError("");
      const tcId = Number(form.test_case_id || testCases[0]?.id);
      if (!tcId) throw new Error("Debes tener al menos un caso de prueba para vincular el defecto.");

      const res = await apiFetch(`${apiUrl}/qa/defects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: selectedProject.id, test_case_id: tcId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar defecto");
      onSuccess("Defecto registrado exitosamente.");
      setForm({ test_case_id: "", title: "", description: "", severity: "Media", responsible: "Fabián", status: "Abierto" });
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  // Actualiza el estado de resolución de un defecto existente.
  async function handleStatusUpdate(defectId, status) {
    try {
      onError("");
      const res = await apiFetch(`${apiUrl}/qa/defects/${defectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar defecto");
      onSuccess("Estado del defecto actualizado.");
      await onDataChanged(selectedProject.id);
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Gestión de Defectos</h1>
          <p>Registra errores encontrados en pruebas, asigna severidad, responsable y controla su resolución.</p>
        </div>
      </div>

      {!selectedProject ? (
        <section className="qc-card"><p>Selecciona un proyecto para gestionar sus defectos.</p></section>
      ) : (
        <div className="qc-dashboard-split">
          <section className="qc-card">
            <h2>Reportar Nuevo Defecto</h2>
            <form onSubmit={handleCreate} className="qc-form">
              <select
                value={form.test_case_id || testCases[0]?.id || ""}
                onChange={(e) => setForm({ ...form, test_case_id: e.target.value })}
                required
              >
                {testCases.length === 0 && <option value="">Sin casos de prueba disponibles</option>}
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.code} - {tc.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Título del defecto"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                rows="2"
                placeholder="Descripción técnica del error"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="qc-row">
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <select value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}>
                  <option value="Fabián">Fabián</option>
                  <option value="Sebastián">Sebastián</option>
                  <option value="Samuel">Samuel</option>
                </select>
              </div>
              <button type="submit" className="qc-btn-primary">Reportar Defecto</button>
            </form>
          </section>

          <section className="qc-card">
            <h2>Defectos Reportados ({defects.length})</h2>
            <div className="qc-table-wrap">
              <table className="qc-table">
                <thead>
                  <tr>
                    <th>Defecto</th>
                    <th>Severidad</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.title}</strong>
                        <div className="qc-muted">{d.description}</div>
                      </td>
                      <td>{d.severity}</td>
                      <td>{d.responsible}</td>
                      <td>
                        <select value={d.status} onChange={(e) => handleStatusUpdate(d.id, e.target.value)}>
                          <option value="Abierto">Abierto</option>
                          <option value="En Reparación">En Reparación</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

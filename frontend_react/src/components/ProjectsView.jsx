import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const PROJECT_STATUSES = ["Planificación", "Activo", "En Pruebas", "Completado", "Pausado"];

// Gestiona la creación, consulta, selección y actualización de estado de proyectos en project_service.
export default function ProjectsView({
  apiUrl,
  projects,
  selectedProject,
  onSelectProject,
  onProjectsChanged,
  onError,
  onSuccess,
}) {
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    responsible: "Sebastián",
    status: "Activo",
  });
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Envía una petición POST para crear un nuevo proyecto en Supabase.
  async function handleCreateProject(event) {
    event.preventDefault();
    try {
      onError("");
      const response = await apiFetch(`${apiUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo crear el proyecto");

      onSuccess("Proyecto creado exitosamente.");
      setNewProject({ name: "", description: "", responsible: "Sebastián", status: "Activo" });
      await onProjectsChanged(result.data);
    } catch (err) {
      onError(err.message);
    }
  }

  // Actualiza el estado de un proyecto existente mediante PUT /api/projects/<id>.
  async function handleStatusChange(projectId, nextStatus) {
    try {
      onError("");
      const response = await apiFetch(`${apiUrl}/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el estado");

      onSuccess("Estado del proyecto actualizado.");
      await onProjectsChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  const visibleProjects =
    statusFilter === "Todos" ? projects : projects.filter((p) => p.status === statusFilter);

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>Crea, consulta y actualiza el estado de los proyectos auditados en QualityCheck.</p>
        </div>
      </div>

      <div className="qc-dashboard-split">
        <section className="qc-card">
          <h2>Registrar Nuevo Proyecto</h2>
          <form onSubmit={handleCreateProject} className="qc-form">
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
            <textarea
              rows="3"
              placeholder="Descripción del alcance del sistema"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <div className="qc-row">
              <select
                value={newProject.responsible}
                onChange={(e) => setNewProject({ ...newProject, responsible: e.target.value })}
              >
                <option value="Sebastián">Sebastián</option>
                <option value="Fabián">Fabián</option>
                <option value="Samuel">Samuel</option>
              </select>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="qc-btn-primary">
              Crear Proyecto
            </button>
          </form>
        </section>

        <section className="qc-card">
          <div className="qc-card-top">
            <h2>Proyectos Registrados ({visibleProjects.length})</h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="qc-table-wrap">
            <table className="qc-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((proj) => (
                  <tr key={proj.id} className={selectedProject?.id === proj.id ? "qc-row-active" : ""}>
                    <td>
                      <strong>{proj.name}</strong>
                      <div className="qc-muted">{proj.description || "Sin descripción"}</div>
                    </td>
                    <td>{proj.responsible}</td>
                    <td>
                      <select
                        value={proj.status}
                        onChange={(e) => handleStatusChange(proj.id, e.target.value)}
                      >
                        {PROJECT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button type="button" onClick={() => onSelectProject(proj)}>
                        {selectedProject?.id === proj.id ? "Activo" : "Seleccionar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

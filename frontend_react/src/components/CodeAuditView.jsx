import React, { useState } from "react";
import { IconAward, IconBug, IconClipboardList, IconFileCode, IconFlask, IconFolder } from "./Icons.jsx";
import { apiFetch } from "../utils/api.js";

const IGNORED_DIRS = ["node_modules/", "venv/", ".venv/", ".git/", "__pycache__/", "dist/", "build/"];
const ALLOWED_EXTS = [
  ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cs", ".php", ".html", ".css", ".sql", ".json", ".md",
];

// Verifica si un archivo pertenece a carpetas ignoradas o tiene una extensión analizable como texto.
function isAuditableFile(file) {
  const relPath = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
  if (IGNORED_DIRS.some((dir) => relPath.includes(dir))) return false;
  return ALLOWED_EXTS.some((ext) => relPath.toLowerCase().endsWith(ext));
}

// Permite subir un archivo o una carpeta de proyecto, ejecuta el Paso 1 (crear proyecto) si se solicita y audita el código.
export default function CodeAuditView({
  apiUrl,
  selectedProject,
  auditResult,
  onAuditCompleted,
  onProjectsChanged,
  onNavigate,
  onApplyScoreToIso,
  onError,
  onSuccess,
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveToDb, setSaveToDb] = useState(true);
  const [createProjectOnUpload, setCreateProjectOnUpload] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectResponsible, setProjectResponsible] = useState("Sebastián");
  const [projectDescription, setProjectDescription] = useState("");

  // Lee los archivos seleccionados, ejecuta el Paso 1 (Crear Proyecto) si está activo y envía el código a /api/metrics/audit-code.
  async function handleFilesSelected(fileList, modeLabel) {
    const rawFiles = Array.from(fileList || []);
    const validFiles = rawFiles.filter(isAuditableFile).slice(0, 150);

    if (validFiles.length === 0) {
      onError("No se encontraron archivos de código fuente compatibles (.py, .js, .jsx, .ts, .sql, etc.).");
      return;
    }

    setIsAnalyzing(true);
    onError("");
    try {
      const payloadFiles = await Promise.all(
        validFiles.map(async (file) => ({
          path: file.webkitRelativePath || file.name,
          content: await file.text(),
        }))
      );

      const firstPath = payloadFiles[0].path;
      const sourceName = firstPath.includes("/")
        ? firstPath.split("/")[0]
        : validFiles.length === 1
          ? validFiles[0].name
          : modeLabel;

      let targetProject = selectedProject;
      let createdProjectMsg = "";

      if (createProjectOnUpload) {
        const finalName = projectName.trim() || sourceName;
        const finalDesc =
          projectDescription.trim() ||
          `Proyecto creado automáticamente al cargar '${sourceName}' (${validFiles.length} archivo(s)).`;
        const projectRes = await apiFetch(`${apiUrl}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            description: finalDesc,
            responsible: projectResponsible.trim() || "Sebastián",
            status: "Activo",
          }),
        });
        const projectJson = await projectRes.json();
        if (!projectRes.ok) {
          throw new Error(projectJson.error || "No se pudo ejecutar el Paso 1 (Crear proyecto)");
        }
        targetProject = projectJson.data;
        if (onProjectsChanged) {
          await onProjectsChanged(targetProject);
        }
        createdProjectMsg = `Paso 1 completado: proyecto '${targetProject.name}' creado y seleccionado. `;
      }

      const response = await apiFetch(`${apiUrl}/metrics/audit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_name: sourceName,
          project_id: targetProject?.id || null,
          save: saveToDb && Boolean(targetProject?.id),
          files: payloadFiles,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al analizar los archivos");

      onAuditCompleted(result.data);
      setProjectName("");
      setProjectDescription("");
      onSuccess(`${createdProjectMsg}Auditoría completada sobre ${result.data.total_files} archivo(s).`);
    } catch (err) {
      onError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="qc-view">
      <div className="qc-view-header">
        <div>
          <h1>Auditoría Estática de Proyecto</h1>
          <p>Sube un archivo individual o una carpeta completa para extraer parámetros técnicos y métricas de calidad.</p>
        </div>
      </div>

      <section className="qc-card">
        <div className="qc-audit-options" style={{ marginBottom: "1rem", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
          <label className="qc-checkbox-label">
            <input
              type="checkbox"
              checked={createProjectOnUpload}
              onChange={(e) => setCreateProjectOnUpload(e.target.checked)}
            />
            <strong>Paso 1 automático:</strong> Crear y seleccionar un nuevo proyecto al subir archivo o carpeta
          </label>

          {createProjectOnUpload && (
            <div className="qc-form-grid" style={{ width: "100%" }}>
              <input
                type="text"
                placeholder="Nombre del proyecto (opcional: usa el nombre del archivo/carpeta)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Responsable del proyecto"
                value={projectResponsible}
                onChange={(e) => setProjectResponsible(e.target.value)}
              />
              <input
                type="text"
                placeholder="Objetivo / descripción inicial (opcional)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="qc-upload-grid">
          <label className="qc-upload-box">
            <strong className="qc-inline-icon">
              <IconFileCode size={18} />
              <span>Subir Archivo(s) de Código</span>
            </strong>
            <span>Selecciona uno o varios archivos (.py, .js, .jsx, .ts, .sql, .java, etc.)</span>
            <input
              type="file"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files, "Archivos Seleccionados")}
            />
          </label>

          <label className="qc-upload-box">
            <strong className="qc-inline-icon">
              <IconFolder size={18} />
              <span>Subir Carpeta de Proyecto</span>
            </strong>
            <span>Analiza todo un repositorio local (ignora node_modules, venv y .git automáticamente)</span>
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files, "Carpeta de Proyecto")}
            />
          </label>
        </div>

        <div className="qc-audit-options">
          <label className="qc-checkbox-label">
            <input type="checkbox" checked={saveToDb} onChange={(e) => setSaveToDb(e.target.checked)} />
            Guardar resultado en historial del proyecto ({createProjectOnUpload ? "nuevo proyecto" : selectedProject?.name || "Ninguno"})
          </label>
          {isAnalyzing && <span className="qc-badge-info">Creando proyecto y analizando archivos...</span>}
        </div>
      </section>

      {auditResult && (
        <>
          <div className="qc-kpi-grid-4">
            <div className="qc-kpi-card">
              <span>Archivos Analizados</span>
              <strong>{auditResult.total_files}</strong>
              <small>Promedio {auditResult.avg_lines_per_file} líneas/archivo</small>
            </div>
            <div className="qc-kpi-card">
              <span>Líneas de Código (SLOC)</span>
              <strong>{auditResult.code_lines}</strong>
              <small>Total bruto: {auditResult.total_lines} líneas</small>
            </div>
            <div className="qc-kpi-card">
              <span>Funciones / Clases</span>
              <strong>
                {auditResult.functions_count} / {auditResult.classes_count}
              </strong>
              <small>Promedio {auditResult.avg_lines_per_function} líneas/función</small>
            </div>
            <div className="qc-kpi-card highlight">
              <span>Mantenibilidad Sugerida</span>
              <strong>{auditResult.suggested_maintainability_score}/100</strong>
              <small>Comentarios: {auditResult.comment_density}%</small>
            </div>
          </div>

          <div className="qc-dashboard-split">
            <section className="qc-card">
              <h2>Distribución de Lenguajes y Calidad</h2>
              <p className="qc-subtitle">
                Nivel estimado: <strong>{auditResult.quality_level}</strong>
              </p>
              <div className="qc-summary-list">
                {Object.entries(auditResult.languages || {}).map(([lang, count]) => (
                  <div key={lang} className="qc-summary-item">
                    <span>{lang}</span>
                    <strong>{count} archivo(s)</strong>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="qc-btn-primary qc-btn-icon"
                style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                onClick={() => onApplyScoreToIso(auditResult.suggested_maintainability_score, auditResult.source_name)}
              >
                <IconAward size={16} />
                <span>Usar puntaje ({auditResult.suggested_maintainability_score}) en Evaluación ISO/IEC 25010</span>
              </button>

              {selectedProject && onNavigate && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  <button type="button" className="qc-btn-secondary qc-btn-icon" onClick={() => onNavigate("requirements")}>
                    <IconClipboardList size={15} />
                    <span>Paso 2: Agregar Requisitos</span>
                  </button>
                  <button type="button" className="qc-btn-secondary qc-btn-icon" onClick={() => onNavigate("test-cases")}>
                    <IconFlask size={15} />
                    <span>Paso 3: Casos de Prueba</span>
                  </button>
                  <button type="button" className="qc-btn-secondary qc-btn-icon" onClick={() => onNavigate("defects")}>
                    <IconBug size={15} />
                    <span>Paso 5: Defectos</span>
                  </button>
                </div>
              )}
            </section>

            <section className="qc-card">
              <h2>Hallazgos de Auditoría ({auditResult.findings?.length || 0})</h2>
              {auditResult.findings && auditResult.findings.length > 0 ? (
                <ul className="qc-findings-list">
                  {auditResult.findings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              ) : (
                <p>No se detectaron alertas críticas de mantenibilidad en los archivos analizados.</p>
              )}
            </section>
          </div>

          <section className="qc-card">
            <h2>Detalle por Archivo (Top {auditResult.files?.length || 0})</h2>
            <div className="qc-table-wrap">
              <table className="qc-table">
                <thead>
                  <tr>
                    <th>Ruta del Archivo</th>
                    <th>Lenguaje</th>
                    <th>Líneas Totales</th>
                    <th>SLOC</th>
                    <th>Comentarios</th>
                    <th>Funciones</th>
                    <th>Clases</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditResult.files || []).map((f) => (
                    <tr key={f.path}>
                      <td>{f.path}</td>
                      <td>{f.language}</td>
                      <td>{f.total_lines}</td>
                      <td>{f.code_lines}</td>
                      <td>{f.comment_lines}</td>
                      <td>{f.functions_count}</td>
                      <td>{f.classes_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

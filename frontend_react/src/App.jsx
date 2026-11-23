import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DashboardHome from "./components/DashboardHome.jsx";
import CodeAuditView from "./components/CodeAuditView.jsx";
import ProjectsView from "./components/ProjectsView.jsx";
import { RequirementsView, TestCasesView, DefectsView } from "./components/QaViews.jsx";
import IsoMetricsView from "./components/IsoMetricsView.jsx";
import ReportsView from "./components/ReportsView.jsx";
import LoginView from "./components/LoginView.jsx";
import { IconLoader } from "./components/Icons.jsx";
import {
  apiFetch,
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
  setUnauthorizedHandler,
} from "./utils/api.js";

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5000/api";

// Componente raíz de QualityCheck que coordina la autenticación, la barra lateral, el dashboard y los módulos de auditoría.
export default function App() {
  const initialAuth = getStoredAuth();
  const [authToken, setAuthToken] = useState(initialAuth.token);
  const [currentUser, setCurrentUser] = useState(initialAuth.user);
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(initialAuth.token));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthStatus, setHealthStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [defects, setDefects] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [latestAudit, setLatestAudit] = useState(null);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const projectAbortRef = useRef(null);

  const [evaluationForm, setEvaluationForm] = useState({
    evaluator: "Samuel",
    functional_suitability_score: 85,
    performance_efficiency_score: 80,
    maintainability_score: 90,
    observations: "",
  });

  // Consulta el estado de salud del API Gateway y de los tres microservicios.
  async function fetchHealthStatus() {
    try {
      const res = await fetch(`${API_GATEWAY_URL}/health`);
      if (res.ok) setHealthStatus(await res.json());
    } catch {
      setHealthStatus({ gateway: "offline", services: {} });
    }
  }

  // Consulta la lista de proyectos registrados y selecciona automáticamente el primero o el recién creado.
  async function fetchProjects(preferredProject = null) {
    try {
      setErrorMessage("");
      const response = await apiFetch(`${API_GATEWAY_URL}/projects`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al consultar proyectos");
      const list = result.data || [];
      setProjects(list);

      if (preferredProject) {
        setSelectedProject(preferredProject);
      } else if (selectedProject) {
        const updated = list.find((p) => p.id === selectedProject.id);
        setSelectedProject(updated || list[0] || null);
      } else if (list.length > 0) {
        setSelectedProject(list[0]);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Sincroniza requisitos, casos de prueba, defectos, indicadores y evaluaciones ISO del proyecto activo de forma progresiva.
  async function fetchProjectDashboardData(projectId) {
    if (projectAbortRef.current) {
      projectAbortRef.current.abort();
    }
    const controller = new AbortController();
    projectAbortRef.current = controller;

    setIsLoadingProjectData(true);
    setRequirements([]);
    setTestCases([]);
    setDefects([]);
    setIndicators(null);
    setEvaluations([]);
    setErrorMessage("");

    try {
      const { signal } = controller;
      const tasks = [
        apiFetch(`${API_GATEWAY_URL}/qa/requirements?project_id=${projectId}`, { signal })
          .then(async (res) => {
            if (res.ok) setRequirements((await res.json()).data || []);
          }),
        apiFetch(`${API_GATEWAY_URL}/qa/test-cases?project_id=${projectId}`, { signal })
          .then(async (res) => {
            if (res.ok) setTestCases((await res.json()).data || []);
          }),
        apiFetch(`${API_GATEWAY_URL}/qa/defects?project_id=${projectId}`, { signal })
          .then(async (res) => {
            if (res.ok) setDefects((await res.json()).data || []);
          }),
        apiFetch(`${API_GATEWAY_URL}/metrics/indicators/${projectId}`, { signal })
          .then(async (res) => {
            if (res.ok) setIndicators(await res.json());
          }),
        apiFetch(`${API_GATEWAY_URL}/metrics/evaluations?project_id=${projectId}`, { signal })
          .then(async (res) => {
            if (res.ok) setEvaluations((await res.json()).data || []);
          }),
      ];

      await Promise.allSettled(tasks);
    } catch (err) {
      if (err.name !== "AbortError") {
        setErrorMessage("Error al sincronizar datos con los microservicios de QA y Métricas.");
      }
    } finally {
      if (projectAbortRef.current === controller) {
        setIsLoadingProjectData(false);
      }
    }
  }

  // Traslada el puntaje de mantenibilidad calculado en la auditoría de código al formulario ISO 25010.
  function handleApplyScoreToIso(score, sourceName) {
    setEvaluationForm((prev) => ({
      ...prev,
      maintainability_score: score,
      observations: `Puntaje de mantenibilidad calculado tras auditar '${sourceName}'.`,
    }));
    setStatusMessage(`Puntaje ${score} aplicado al formulario ISO/IEC 25010.`);
    setActiveTab("iso-metrics");
  }

  // Guarda la sesión autenticada y actualiza el nombre del evaluador por defecto.
  function handleAuthenticated(token, user) {
    saveStoredAuth(token, user);
    setAuthToken(token);
    setCurrentUser(user);
    setEvaluationForm((prev) => ({ ...prev, evaluator: user?.name || prev.evaluator }));
    setIsCheckingAuth(false);
  }

  // Cierra la sesión activa y limpia los datos del proyecto en memoria.
  function handleLogout() {
    clearStoredAuth();
    setAuthToken("");
    setCurrentUser(null);
    setProjects([]);
    setSelectedProject(null);
    setRequirements([]);
    setTestCases([]);
    setDefects([]);
    setIndicators(null);
    setEvaluations([]);
    setLatestAudit(null);
    setStatusMessage("");
    setErrorMessage("");
  }

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
  }, []);

  useEffect(() => {
    // Valida la sesión almacenada al iniciar la aplicación antes de cargar los proyectos.
    async function verifySessionAndBoot() {
      if (!authToken) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const res = await apiFetch(`${API_GATEWAY_URL}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          saveStoredAuth(authToken, data.user);
          setEvaluationForm((prev) => ({ ...prev, evaluator: data.user?.name || prev.evaluator }));
          fetchHealthStatus();
          fetchProjects();
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      } finally {
        setIsCheckingAuth(false);
      }
    }

    verifySessionAndBoot();
  }, [authToken]);

  useEffect(() => {
    if (authToken && selectedProject?.id) {
      fetchProjectDashboardData(selectedProject.id);
    }
  }, [authToken, selectedProject?.id]);

  if (isCheckingAuth) {
    return (
      <div className="qc-login-shell">
        <div className="qc-loading-banner">
          <IconLoader size={18} />
          <span>Verificando sesión activa...</span>
        </div>
      </div>
    );
  }

  if (!authToken || !currentUser) {
    return <LoginView apiUrl={API_GATEWAY_URL} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="qc-layout">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setStatusMessage("");
          setErrorMessage("");
          setActiveTab(tab);
        }}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        isLoadingProjectData={isLoadingProjectData}
        healthStatus={healthStatus}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="qc-main">
        {isLoadingProjectData && selectedProject && (
          <div className="qc-loading-banner">
            <IconLoader size={16} />
            <span>
              Cargando datos de <strong>{selectedProject.name}</strong>...
            </span>
          </div>
        )}
        {errorMessage && <div className="qc-alert qc-alert-error">{errorMessage}</div>}
        {statusMessage && <div className="qc-alert qc-alert-success">{statusMessage}</div>}

        {activeTab === "dashboard" && (
          <DashboardHome
            projects={projects}
            selectedProject={selectedProject}
            indicators={indicators}
            latestAudit={latestAudit}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "audit" && (
          <CodeAuditView
            apiUrl={API_GATEWAY_URL}
            selectedProject={selectedProject}
            auditResult={latestAudit}
            onAuditCompleted={setLatestAudit}
            onProjectsChanged={fetchProjects}
            onNavigate={setActiveTab}
            onApplyScoreToIso={handleApplyScoreToIso}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "projects" && (
          <ProjectsView
            apiUrl={API_GATEWAY_URL}
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onProjectsChanged={fetchProjects}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "requirements" && (
          <RequirementsView
            apiUrl={API_GATEWAY_URL}
            selectedProject={selectedProject}
            requirements={requirements}
            onDataChanged={fetchProjectDashboardData}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "test-cases" && (
          <TestCasesView
            apiUrl={API_GATEWAY_URL}
            selectedProject={selectedProject}
            requirements={requirements}
            testCases={testCases}
            onDataChanged={fetchProjectDashboardData}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "defects" && (
          <DefectsView
            apiUrl={API_GATEWAY_URL}
            selectedProject={selectedProject}
            testCases={testCases}
            defects={defects}
            onDataChanged={fetchProjectDashboardData}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "iso-metrics" && (
          <IsoMetricsView
            apiUrl={API_GATEWAY_URL}
            selectedProject={selectedProject}
            indicators={indicators}
            evaluations={evaluations}
            evaluationForm={evaluationForm}
            onChangeEvaluationForm={setEvaluationForm}
            onDataChanged={fetchProjectDashboardData}
            onError={setErrorMessage}
            onSuccess={setStatusMessage}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView
            selectedProject={selectedProject}
            requirements={requirements}
            testCases={testCases}
            defects={defects}
            indicators={indicators}
            evaluations={evaluations}
            latestAudit={latestAudit}
          />
        )}
      </main>
    </div>
  );
}

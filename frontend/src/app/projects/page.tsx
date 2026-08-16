"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, LayoutGrid, Plus, Search, SunMedium, Moon, Check, MoreHorizontal, CalendarDays, ChevronDown, Filter, UserPlus, ArrowLeft, MessageSquareText } from "lucide-react";
import Sidebar from "../../components/sidebar";

type ProjectTask = {
  id: string;
  title: string;
  status: "To Do" | "In Progress" | "Completed";
  priority: "High" | "Medium" | "Low";
  due: string;
  assignee: string;
  projectId: string;
  subtasks?: { id: string; title: string; done: boolean }[];
};

type ProjectItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

const defaultProjects: ProjectItem[] = [
  { id: "project-default", name: "Design Homepage", description: "Homepage redesign and layout validation", createdAt: "2026-08-15" },
  { id: "project-login", name: "Develop Login Feature", description: "Authentication and onboarding flow", createdAt: "2026-08-16" },
  { id: "project-gateway", name: "Test Payment Gateway", description: "Staging validation and release checks", createdAt: "2026-08-17" },
];

const defaultTasks: ProjectTask[] = [
  { id: "p-task-1", title: "Design Homepage", status: "In Progress", priority: "High", due: "2026-09-12", assignee: "Dexter", projectId: "project-default", subtasks: [{ id: "st-1", title: "Hero section", done: true }, { id: "st-2", title: "CTA copy", done: false }] },
  { id: "p-task-2", title: "Develop Login Feature", status: "Completed", priority: "Low", due: "2026-09-15", assignee: "CN", projectId: "project-login", subtasks: [{ id: "st-3", title: "UI polish", done: true }] },
  { id: "p-task-3", title: "Test Payment Gateway", status: "To Do", priority: "Medium", due: "2026-09-18", assignee: "Dexter", projectId: "project-gateway", subtasks: [{ id: "st-4", title: "Smoke test", done: false }] },
];

const getStoredProjects = () => {
  if (typeof window === "undefined") return defaultProjects;
  const raw = localStorage.getItem("taskflow-projects");
  if (!raw) {
    localStorage.setItem("taskflow-projects", JSON.stringify(defaultProjects));
    return defaultProjects;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultProjects;
  } catch {
    return defaultProjects;
  }
};

const getStoredTasks = () => {
  if (typeof window === "undefined") return defaultTasks;
  const raw = localStorage.getItem("taskflow-tasks");
  if (!raw) {
    localStorage.setItem("taskflow-tasks", JSON.stringify(defaultTasks));
    return defaultTasks;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultTasks;
  } catch {
    return defaultTasks;
  }
};

export default function ProjectsPage() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme-mode") === "dark";
  });
  const [accent, setAccent] = useState<string>(() => {
    if (typeof window === "undefined") return "#8b5cf6";
    return localStorage.getItem("theme-accent") || "#8b5cf6";
  });
  const [user, setUser] = useState({ name: "Dexter", email: "dexter@gmail.com" });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [projects, setProjects] = useState<ProjectItem[]>(defaultProjects);
  const [tasks, setTasks] = useState<ProjectTask[]>(defaultTasks);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<ProjectTask["status"]>("To Do");
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectTask["priority"]>("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Dexter");
  const [newTaskDue, setNewTaskDue] = useState("2026-09-29");
  const [newTaskProjectId, setNewTaskProjectId] = useState(defaultProjects[0]?.id || "");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [activeSubtaskTarget, setActiveSubtaskTarget] = useState<string | null>(null);
  const [projectMenuOpenId, setProjectMenuOpenId] = useState<string | null>(null);
  const [projectCreateError, setProjectCreateError] = useState("");
  const [taskCreateError, setTaskCreateError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedUser = localStorage.getItem("user-profile");
    const savedSession = localStorage.getItem("auth-session") === "active" && !!localStorage.getItem("session-token");
    setIsAuthenticated(savedSession);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const storedProjects = getStoredProjects();
    const storedTasks = getStoredTasks();
    setProjects(storedProjects);
    setTasks(storedTasks);
    if (storedProjects[0]) {
      setNewTaskProjectId(storedProjects[0].id);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const hasSessionToken = !!localStorage.getItem("session-token");
      if (!hasSessionToken) {
        window.location.href = "/";
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow-projects", JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleToggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("theme-mode", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({ name: "Dexter", email: "dexter@gmail.com" });
    localStorage.removeItem("auth-session");
    localStorage.removeItem("session-token");
    localStorage.removeItem("user-profile");
    window.location.href = "/";
  };

  useEffect(() => {
    localStorage.setItem("theme-mode", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("theme-accent", accent);
  }, [accent]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const projectTasks = useMemo(
    () => (selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : []),
    [tasks, selectedProject],
  );

  const completedCount = projectTasks.filter((task) => task.status === "Completed").length;
  const inProgressCount = projectTasks.filter((task) => task.status === "In Progress").length;
  const toDoCount = projectTasks.filter((task) => task.status === "To Do").length;

  const createProject = () => {
    const trimmedName = newProjectName.trim();
    const trimmedDescription = newProjectDescription.trim() || "New project created from workspace";

    if (!trimmedName) {
      setProjectCreateError("Project name is required.");
      return;
    }

    const newProject: ProjectItem = {
      id: `project-${Date.now()}`,
      name: trimmedName,
      description: trimmedDescription,
      createdAt: new Date().toISOString(),
    };

    setProjects((current) => [newProject, ...current]);
    setSelectedProjectId(newProject.id);
    setNewTaskProjectId(newProject.id);
    setNewProjectName("");
    setNewProjectDescription("");
    setProjectCreateError("");
    setShowProjectModal(false);
  };

  const openTaskModalForSelectedProject = () => {
    if (selectedProject) {
      setNewTaskProjectId(selectedProject.id);
    }
    setTaskCreateError("");
    setShowTaskModal(true);
  };

  const addTaskToProject = () => {
    const trimmedTitle = newTaskTitle.trim();
    const trimmedAssignee = newTaskAssignee.trim();

    if (!trimmedTitle || !trimmedAssignee || !newTaskDue) {
      setTaskCreateError("Title, assignee, and due date are required.");
      return;
    }

    const nextTask: ProjectTask = {
      id: `project-task-${Date.now()}`,
      title: trimmedTitle,
      status: newTaskStatus,
      priority: newTaskPriority,
      due: newTaskDue,
      assignee: trimmedAssignee,
      projectId: newTaskProjectId,
      subtasks: [],
    };

    setTasks((current) => [nextTask, ...current]);
    setNewTaskTitle("");
    setNewTaskStatus("To Do");
    setNewTaskPriority("Medium");
    setNewTaskAssignee("Dexter");
    setNewTaskDue("2026-09-29");
    setTaskCreateError("");
    setShowTaskModal(false);
  };

  const closeProjectDetails = () => {
    setSelectedProjectId("");
    setProjectMenuOpenId(null);
  };

  const addSubtask = (taskId: string) => {
    const trimmedTitle = subtaskTitle.trim();
    if (!trimmedTitle) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...(task.subtasks || []), { id: `subtask-${Date.now()}`, title: trimmedTitle, done: false }],
            }
          : task,
      ),
    );

    setSubtaskTitle("");
    setActiveSubtaskTarget(null);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: (task.subtasks || []).map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
          ),
        };
      }),
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
        };
      }),
    );
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f3f3f3] text-slate-800"}>
        <div className="flex min-h-screen">
          <Sidebar
            active="Projects"
            darkMode={darkMode}
            accent={accent}
            isAuthenticated={isAuthenticated}
            user={user}
            onToggleTheme={handleToggleTheme}
            onAccentChange={setAccent}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className={`text-[22px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Projects</h1>

              <div className="flex items-center gap-3">
                <button className={darkMode ? "flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f2a3d] bg-[#111827] text-slate-200" : "flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe3e8] bg-white text-slate-600"}>
                  <Search size={18} />
                </button>
                <button className={darkMode ? "flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f2a3d] bg-[#111827] text-slate-200" : "flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe3e8] bg-white text-slate-600"}>
                  <LayoutGrid size={18} />
                </button>
                <button className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#111827] px-3 py-2 text-sm font-medium text-slate-200" : "rounded-xl border border-[#dfe3e8] bg-white px-3 py-2 text-sm font-medium text-slate-700"}>
                  Fields
                </button>
                <button onClick={() => setShowProjectModal(true)} className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-semibold text-white">+ Add Project</button>
              </div>
            </div>

            <div className={darkMode ? "rounded-[20px] border border-[#1f2a3d] bg-[#111827] p-4" : "rounded-[20px] border border-[#dfe3e8] bg-[#f8f8f8] p-4"}>
              <div className={darkMode ? "grid grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.3fr] gap-4 border-b border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[13px] font-semibold text-slate-300" : "grid grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.3fr] gap-4 border-b border-[#dfe3e8] bg-[#eeeeee] px-4 py-3 text-[13px] font-semibold text-slate-600"}>
                <span>Projects</span>
                <span>Priority</span>
                <span>Lead</span>
                <span>Due Date</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="space-y-0">
                {projects.map((project) => {
                  const projectTaskList = tasks.filter((task) => task.projectId === project.id);
                  const lead = projectTaskList[0]?.assignee || "Dexter";
                  const priority = projectTaskList[0]?.priority || "Medium";
                  const due = projectTaskList[0]?.due || "2026-09-29";

                  return (
                    <div
                      key={project.id}
                      className={darkMode ? `grid grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.3fr] items-center gap-4 border-b border-[#1f2a3d] px-4 py-4 text-[15px] ${selectedProjectId === project.id ? "bg-[#101827]" : ""}` : `grid grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.3fr] items-center gap-4 border-b border-[#e3e5e8] px-4 py-4 text-[15px] ${selectedProjectId === project.id ? "bg-white" : ""}`}
                    >
                      <div className={darkMode ? "font-medium text-slate-200" : "font-medium text-slate-700"}>{project.name}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                            priority === "High"
                              ? "bg-red-100 text-red-600"
                              : priority === "Medium"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-gray-100 text-slate-600"
                          }`}
                        >
                          {priority}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-violet-500 text-[10px] font-semibold text-white">
                          {lead.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className={darkMode ? "text-slate-300" : "text-slate-600"}>{new Date(due).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setProjectMenuOpenId((current) => (current === project.id ? null : project.id));
                          }}
                          className={darkMode ? "flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-[#0f172a]" : "flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white"}
                          aria-label={`Open actions for ${project.name}`}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {projectMenuOpenId === project.id && (
                          <div className={darkMode ? "absolute right-0 top-10 z-30 w-32 rounded-xl border border-[#1f2a3d] bg-[#0f172a] p-2 shadow-lg" : "absolute right-0 top-10 z-30 w-32 rounded-xl border border-[#dfe3e8] bg-white p-2 shadow-lg"}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setNewTaskProjectId(project.id);
                                setProjectMenuOpenId(null);
                              }}
                              className={darkMode ? "w-full rounded-lg px-2 py-2 text-left text-sm text-slate-200 hover:bg-[#111827]" : "w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}
                            >
                              Info
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowProjectModal(true)} className={darkMode ? "flex items-center gap-2 px-4 py-4 text-[15px] font-medium text-slate-200" : "flex items-center gap-2 px-4 py-4 text-[15px] font-medium text-slate-700"}>
                <Plus size={16} />
                Add Projects
              </button>
            </div>

            {selectedProject && (
              <div className={darkMode ? "mt-6 rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-5" : "mt-6 rounded-[22px] border border-[#dfe3e8] bg-white p-5"}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className={`text-[18px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{selectedProject.name}</h2>
                    <p className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>{selectedProject.description}</p>
                  </div>
                  <button onClick={closeProjectDetails} className={darkMode ? "rounded-xl border border-[#1f2a3d] px-3 py-2 text-sm text-slate-200" : "rounded-xl border border-[#dfe3e8] px-3 py-2 text-sm text-slate-700"}>Cancel</button>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] p-3" : "rounded-xl border border-[#dfe3e8] bg-[#f9fafb] p-3"}>
                    <div className={darkMode ? "text-xs uppercase tracking-[0.08em] text-slate-400" : "text-xs uppercase tracking-[0.08em] text-slate-500"}>Completed</div>
                    <div className="mt-2 text-2xl font-semibold">{completedCount}</div>
                  </div>
                  <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] p-3" : "rounded-xl border border-[#dfe3e8] bg-[#f9fafb] p-3"}>
                    <div className={darkMode ? "text-xs uppercase tracking-[0.08em] text-slate-400" : "text-xs uppercase tracking-[0.08em] text-slate-500"}>In Progress</div>
                    <div className="mt-2 text-2xl font-semibold">{inProgressCount}</div>
                  </div>
                  <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] p-3" : "rounded-xl border border-[#dfe3e8] bg-[#f9fafb] p-3"}>
                    <div className={darkMode ? "text-xs uppercase tracking-[0.08em] text-slate-400" : "text-xs uppercase tracking-[0.08em] text-slate-500"}>Remaining</div>
                    <div className="mt-2 text-2xl font-semibold">{toDoCount}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {projectTasks.map((task) => (
                    <div key={task.id} className={darkMode ? "rounded-[18px] border border-[#1f2a3d] bg-[#0f172a] p-4" : "rounded-[18px] border border-[#e5e7eb] bg-[#f9fafb] p-4"}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                            task.status === "Completed"
                              ? "bg-emerald-100 text-emerald-600"
                              : task.status === "In Progress"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-600"
                          }`}>{task.status}</span>
                          <span className="text-lg font-semibold">{task.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <button className={darkMode ? "rounded-md border border-[#1f2a3d] px-2 py-1 text-xs text-slate-200" : "rounded-md border border-[#dfe3e8] px-2 py-1 text-xs text-slate-700"}>Edit</button>
                          <button className={darkMode ? "rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300" : "rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"}>Delete</button>
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <span className={darkMode ? "rounded-full border border-[#1f2a3d] bg-[#111827] px-2 py-1 text-slate-300" : "rounded-full border border-[#dfe3e8] bg-white px-2 py-1 text-slate-600"}>Priority: {task.priority}</span>
                        <span className={darkMode ? "rounded-full border border-[#1f2a3d] bg-[#111827] px-2 py-1 text-slate-300" : "rounded-full border border-[#dfe3e8] bg-white px-2 py-1 text-slate-600"}>Assignee: {task.assignee}</span>
                        <span className={darkMode ? "rounded-full border border-[#1f2a3d] bg-[#111827] px-2 py-1 text-slate-300" : "rounded-full border border-[#dfe3e8] bg-white px-2 py-1 text-slate-600"}>Due: {new Date(task.due).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>

                      <div className="mt-3">
                        <div className={darkMode ? "mb-2 flex items-center justify-between text-sm text-slate-300" : "mb-2 flex items-center justify-between text-sm text-slate-600"}>
                          <span>Subtasks</span>
                          <button onClick={() => setActiveSubtaskTarget(task.id)} className="flex items-center gap-1 text-xs font-medium text-slate-500">+ Add Subtask</button>
                        </div>

                        {(task.subtasks || []).length === 0 ? (
                          <div className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>No subtasks yet</div>
                        ) : (
                          <div className="space-y-2">
                            {(task.subtasks || []).map((subtask) => (
                              <div key={subtask.id} className={darkMode ? "flex items-center justify-between gap-3 rounded-lg border border-[#1f2a3d] bg-[#111827] px-2 py-2 text-sm text-slate-200" : "flex items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-white px-2 py-2 text-sm text-slate-700"}>
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input type="checkbox" checked={subtask.done} onChange={() => toggleSubtask(task.id, subtask.id)} className="h-4 w-4" />
                                  <span className={subtask.done ? "line-through text-slate-400" : ""}>{subtask.title}</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                  className={darkMode ? "rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300" : "rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeSubtaskTarget === task.id && (
                          <div className="mt-3 flex gap-2">
                            <input
                              value={subtaskTitle}
                              onChange={(e) => setSubtaskTitle(e.target.value)}
                              placeholder="Add subtask"
                              className={darkMode ? "flex-1 rounded-lg border border-[#1f2a3d] bg-[#0f172a] px-3 py-2 text-sm text-slate-100 outline-none" : "flex-1 rounded-lg border border-[#dfe3e8] bg-white px-3 py-2 text-sm text-slate-700 outline-none"}
                            />
                            <button onClick={() => addSubtask(task.id)} className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-medium text-white">Save</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
            <div className={darkMode ? "w-full max-w-md rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-5 text-slate-100" : "w-full max-w-md rounded-[22px] border border-[#dfe3e8] bg-white p-5 text-slate-800"}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add Project</h2>
                <button onClick={() => { setShowProjectModal(false); setProjectCreateError(""); }} className="text-2xl leading-none">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Project name <span className="text-red-400">*</span></label>
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                  />
                </div>

                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Description</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Project description"
                    rows={3}
                    className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                  />
                </div>
              </div>

              {projectCreateError ? <div className={darkMode ? "mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" : "mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"}>{projectCreateError}</div> : null}

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => { setShowProjectModal(false); setProjectCreateError(""); }} className={darkMode ? "rounded-xl border border-[#1f2a3d] px-4 py-2 text-sm" : "rounded-xl border border-[#dfe3e8] px-4 py-2 text-sm"}>Cancel</button>
                <button onClick={createProject} className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-medium text-white">Create</button>
              </div>
            </div>
          </div>
        )}

        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
            <div className={darkMode ? "w-full max-w-md rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-5 text-slate-100" : "w-full max-w-md rounded-[22px] border border-[#dfe3e8] bg-white p-5 text-slate-800"}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add Task</h2>
                <button onClick={() => { setShowTaskModal(false); setTaskCreateError(""); }} className="text-2xl leading-none">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Task title <span className="text-red-400">*</span></label>
                  <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"} />
                </div>

                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Project <span className="text-red-400">*</span></label>
                  <select value={newTaskProjectId} onChange={(e) => setNewTaskProjectId(e.target.value)} className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Status</label>
                    <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value as ProjectTask["status"])} className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Priority</label>
                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as ProjectTask["priority"])} className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Project <span className="text-red-400">*</span></label>
                  <select value={newTaskProjectId} onChange={(e) => setNewTaskProjectId(e.target.value)} className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Assignee <span className="text-red-400">*</span></label>
                  <input value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="Assignee" className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"} />
                </div>

                <div>
                  <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Due date <span className="text-red-400">*</span></label>
                  <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"} />
                </div>
              </div>

              {taskCreateError ? <div className={darkMode ? "mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" : "mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"}>{taskCreateError}</div> : null}

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => { setShowTaskModal(false); setTaskCreateError(""); }} className={darkMode ? "rounded-xl border border-[#1f2a3d] px-4 py-2 text-sm" : "rounded-xl border border-[#dfe3e8] px-4 py-2 text-sm"}>Cancel</button>
                <button onClick={addTaskToProject} className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-medium text-white">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, List, MoreHorizontal, Plus, Search, SunMedium, LayoutGrid, Check, Settings, Moon, PanelRightOpen } from "lucide-react";
import Sidebar from "../components/sidebar";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type TaskStatus = "To Do" | "In Progress" | "Completed";
type TaskPriority = "High" | "Medium" | "Low";

type TaskItem = {
  id: string;
  title: string;
  priority: TaskPriority;
  owner: string;
  reporter?: string;
  due: string;
  status: TaskStatus;
  labels: string[];
  projectId?: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
};

const defaultUser: UserProfile = {
  name: "New User",
  email: "user@taskflow.local",
};

const getUserStorageKey = (user: Partial<UserProfile> | null | undefined, suffix: string) => {
  const identity = user?.email || user?.name || "anonymous-user";
  return `taskflow-${suffix}-${encodeURIComponent(identity)}`;
};

const readUserStoredTasks = (user: Partial<UserProfile> | null | undefined): TaskItem[] => {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(getUserStorageKey(user, "tasks"));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDueDate = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const defaultProjects: ProjectOption[] = [];

const getStoredProjects = (): ProjectOption[] => {
  if (typeof window === "undefined") return defaultProjects;
  const raw = localStorage.getItem("taskflow-projects");
  if (!raw) {
    localStorage.setItem("taskflow-projects", JSON.stringify(defaultProjects));
    return defaultProjects;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.map((project: any) => ({ id: project.id, name: project.name })) : defaultProjects;
  } catch {
    return defaultProjects;
  }
};

const defaultTaskDraft = (projectId = ""): Omit<TaskItem, "id"> => ({
  title: "",
  priority: "Medium",
  owner: "User",
  reporter: "Admin",
  due: "",
  status: "To Do",
  labels: ["General"],
  projectId,
});

const initialTasks: TaskItem[] = [];

const filterOptions = ["Priority", "Members", "Due Date", "Labels", "Status", "Reporter"];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [accent, setAccent] = useState("#8b5cf6");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [loginError, setLoginError] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [fieldSection, setFieldSection] = useState<"list" | "board">("list");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["Priority", "Members", "Due Date"]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>(defaultProjects);
  const [taskDraft, setTaskDraft] = useState<Omit<TaskItem, "id">>(defaultTaskDraft());
  const [taskValidationError, setTaskValidationError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("theme-mode") === "dark";
    const savedAccent = localStorage.getItem("theme-accent") || "#8b5cf6";
    const savedSession = localStorage.getItem("auth-session") === "active";
    const savedUser = localStorage.getItem("user-profile");
    const storedProjects = getStoredProjects();
    const persistedUser = savedUser ? JSON.parse(savedUser) : defaultUser;

    setDarkMode(savedTheme);
    setAccent(savedAccent);
    setIsAuthenticated(savedSession);
    setAvailableProjects(storedProjects);
    setUser(persistedUser);
    setTasks(readUserStoredTasks(persistedUser));
    if (!taskDraft.projectId && storedProjects[0]) {
      setTaskDraft((current) => ({ ...current, projectId: storedProjects[0].id }));
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    const key = getUserStorageKey(user, "tasks");
    localStorage.setItem(key, JSON.stringify(tasks));
  }, [tasks, user, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    const key = getUserStorageKey(user, "projects");
    localStorage.setItem(key, JSON.stringify(availableProjects));
  }, [availableProjects, user, hasHydrated]);

  const handleToggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("theme-mode", next ? "dark" : "light");
      return next;
    });
  };

  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      name: "Guest User",
      email: `guest-${Date.now()}@taskflow.local`,
    };

    const sessionToken = `guest-${Date.now()}`;

    setLoginError("");
    setUser(guestUser);
    setIsAuthenticated(true);
    setTasks(readUserStoredTasks(guestUser));
    localStorage.setItem("user-profile", JSON.stringify(guestUser));
    localStorage.setItem("auth-session", "active");
    localStorage.setItem("session-token", sessionToken);
  };

  const handleGoogleLogin = async () => {
    if (typeof window !== "undefined" && localStorage.getItem("auth-session") === "active") {
      setIsAuthenticated(true);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId || typeof window === "undefined") {
      setLoginError("Google login is not configured yet.");
      return;
    }

    const googleLoginCallback = async (response: { credential?: string }) => {
      if (!response.credential) {
        setLoginError("Google login failed.");
        return;
      }

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

        const backendResponse = await fetch(`${apiBase}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (!backendResponse.ok) {
          throw new Error("Google login failed");
        }

        const data = await backendResponse.json();
        const googleUser: UserProfile = {
          name: data?.user?.name || "Google User",
          email: data?.user?.email || `google-${Date.now()}@gmail.com`,
          picture: data?.user?.picture || "",
        };

        const sessionToken = `google-${Date.now()}`;

        setLoginError("");
        setUser(googleUser);
        setIsAuthenticated(true);
        setTasks(readUserStoredTasks(googleUser));
        localStorage.setItem("user-profile", JSON.stringify(googleUser));
        localStorage.setItem("auth-session", "active");
        localStorage.setItem("session-token", sessionToken);

        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
        }
      } catch (error) {
        console.error("Google login failed", error);
        setLoginError("Google login failed. Check your backend and client ID.");
      }
    };

    if (!window.google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: googleLoginCallback,
            auto_select: false,
            cancel_on_tap_outside: false,
          });
          window.google.accounts.id.prompt();
        }
      };
      document.body.appendChild(script);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: googleLoginCallback,
      auto_select: false,
      cancel_on_tap_outside: false,
    });
    window.google.accounts.id.prompt();
  };

  const handleLogout = () => {
    setLoginError("");
    setIsAuthenticated(false);
    setUser(defaultUser);
    localStorage.removeItem("auth-session");
    localStorage.removeItem("session-token");
    localStorage.removeItem("user-profile");

    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  useEffect(() => {
    localStorage.setItem("theme-mode", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("theme-accent", accent);
  }, [accent]);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const hasSessionToken = !!localStorage.getItem("session-token");
      if (!hasSessionToken) {
        localStorage.removeItem("auth-session");
      }
    }
  }, [isAuthenticated]);

  const visibleFilters = useMemo(() => {
    return filterOptions.filter((item) => selectedFilters.includes(item));
  }, [selectedFilters]);

  const isFieldVisible = (field: string) => selectedFilters.includes(field);

  const toggleFilter = (item: string) => {
    setSelectedFilters((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  const filteredTasks = tasks.filter((task) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return task.title.toLowerCase().includes(term) || task.owner.toLowerCase().includes(term) || task.labels.some((label) => label.toLowerCase().includes(term));
  });

  const taskColumns: { title: TaskStatus; tasks: TaskItem[] }[] = [
    { title: "To Do", tasks: filteredTasks.filter((task) => task.status === "To Do") },
    { title: "In Progress", tasks: filteredTasks.filter((task) => task.status === "In Progress") },
    { title: "Completed", tasks: filteredTasks.filter((task) => task.status === "Completed") },
  ];

  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setTaskDraft(defaultTaskDraft(availableProjects[0]?.id || ""));
    setTaskValidationError("");
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskDraft({
      title: task.title,
      priority: task.priority,
      owner: task.owner,
      reporter: task.reporter || "Admin",
      due: task.due,
      status: task.status,
      labels: task.labels,
      projectId: task.projectId || availableProjects[0]?.id || "",
    });
    setTaskValidationError("");
    setIsTaskModalOpen(true);
  };

  const saveTask = () => {
    const cleanTitle = taskDraft.title.trim();
    const cleanOwner = taskDraft.owner.trim();
    const cleanReporter = taskDraft.reporter?.trim();
    const cleanLabels = taskDraft.labels.filter(Boolean);

    if (!cleanTitle || !cleanOwner || !cleanReporter || !taskDraft.due || !taskDraft.projectId || cleanLabels.length === 0) {
      setTaskValidationError("Project, title, member, reporter, due date, and labels are required.");
      return;
    }

    const normalizedTask = {
      ...taskDraft,
      title: cleanTitle,
      owner: cleanOwner,
      reporter: cleanReporter,
      labels: cleanLabels,
    };

    if (editingTaskId) {
      setTasks((current) =>
        current.map((task) => (task.id === editingTaskId ? { ...task, ...normalizedTask } : task)),
      );
    } else {
      setTasks((current) => [{ ...normalizedTask, id: `task-${Date.now()}` }, ...current]);
    }

    setTaskValidationError("");
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
    setTaskDraft(defaultTaskDraft(availableProjects[0]?.id || ""));
  };

  const deleteTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  };

  if (!isAuthenticated) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className={darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f1f1f1] text-slate-800"}>
          <div className="flex min-h-screen">
            <Sidebar
              active="Tasks"
              darkMode={darkMode}
              accent={accent}
              isAuthenticated={false}
              user={user}
              onToggleTheme={handleToggleTheme}
              onAccentChange={setAccent}
              onGuestLogin={handleGuestLogin}
              onGoogleLogin={handleGoogleLogin}
            />

            <main className="flex flex-1 items-center justify-center p-6">
              <div className={darkMode ? "w-full max-w-md rounded-[28px] border border-[#1f2a3d] bg-[#111827] p-8 shadow-2xl" : "w-full max-w-md rounded-[28px] border border-[#dfe3e8] bg-white p-8 shadow-2xl"}>
                <div className="mb-6 flex items-center justify-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${accent}, #d946ef)` }}
                  >
                    T
                  </div>
                  <div className={`text-3xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                    TaskFlow
                  </div>
                </div>

                <div className="mb-4 text-center">
                  <p className={`text-sm font-medium uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Welcome back
                  </p>
                  <h1 className={`mt-2 text-3xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                    Sign in to continue
                  </h1>
                </div>

                {loginError ? (
                  <div className={darkMode ? "mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" : "mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"}>
                    {loginError}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <button
                    onClick={handleGuestLogin}
                    className={darkMode ? "flex w-full items-center justify-center gap-3 rounded-xl bg-[#1f2937] px-4 py-3 text-sm font-medium text-slate-100 hover:bg-[#273244]" : "flex w-full items-center justify-center gap-3 rounded-xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-300"}
                  >
                    Continue as Guest
                  </button>

                  <button
                    onClick={handleGoogleLogin}
                    className={darkMode ? "flex w-full items-center justify-center gap-3 rounded-xl border border-[#2b374d] bg-[#111827] px-4 py-3 text-sm font-medium text-slate-100 hover:bg-[#172033]" : "flex w-full items-center justify-center gap-3 rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ea4335] text-[10px] font-bold text-white">G</span>
                    Continue with Google
                  </button>
                </div>

                <p className={`mt-6 text-center text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  No account? You can still explore as a guest.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f1f1f1] text-slate-800"}>
        <div className="flex min-h-screen">
          <Sidebar
            active="Tasks"
            darkMode={darkMode}
            accent={accent}
            isAuthenticated={true}
            user={user}
            onToggleTheme={handleToggleTheme}
            onAccentChange={setAccent}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className={`text-[38px] font-semibold tracking-[-0.04em] ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Tasks</h1>

              <div className="flex items-center gap-3">
                <div className={darkMode ? "flex h-11 w-40 items-center gap-2 rounded-xl border border-[#1f2a3d] bg-[#111827] px-3 text-slate-200 shadow-sm" : "flex h-11 w-40 items-center gap-2 rounded-xl border border-[#dfe3e8] bg-white px-3 text-slate-600 shadow-sm"}>
                  <Search size={18} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>

                <button onClick={() => setShowFilter((value) => !value)} className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#111827] px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm" : "rounded-xl border border-[#dfe3e8] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"}>
                  Fields
                </button>
                <button onClick={openNewTaskModal} className="rounded-xl bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
                  + Add Task
                </button>
              </div>
            </div>

            {isTaskModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
                <div className={darkMode ? "w-full max-w-md rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-5 text-slate-100" : "w-full max-w-md rounded-[22px] border border-[#dfe3e8] bg-white p-5 text-slate-800"}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{editingTaskId ? "Edit Task" : "Add Task"}</h2>
                    <button onClick={() => setIsTaskModalOpen(false)} className="text-2xl leading-none">×</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Task title <span className="text-red-400">*</span></label>
                      <input
                        required
                        value={taskDraft.title}
                        onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                        placeholder="Task title"
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      />
                    </div>

                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Project <span className="text-red-400">*</span></label>
                      <select
                        value={taskDraft.projectId || ""}
                        onChange={(e) => setTaskDraft({ ...taskDraft, projectId: e.target.value })}
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      >
                        {availableProjects.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Status <span className="text-red-400">*</span></label>
                        <select
                          required
                          value={taskDraft.status}
                          onChange={(e) => setTaskDraft({ ...taskDraft, status: e.target.value as TaskStatus })}
                          className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Priority <span className="text-red-400">*</span></label>
                        <select
                          required
                          value={taskDraft.priority}
                          onChange={(e) => setTaskDraft({ ...taskDraft, priority: e.target.value as TaskPriority })}
                          className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Member <span className="text-red-400">*</span></label>
                      <input
                        required
                        value={taskDraft.owner}
                        onChange={(e) => setTaskDraft({ ...taskDraft, owner: e.target.value })}
                        placeholder="Member"
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      />
                    </div>

                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Reporter <span className="text-red-400">*</span></label>
                      <input
                        required
                        value={taskDraft.reporter || ""}
                        onChange={(e) => setTaskDraft({ ...taskDraft, reporter: e.target.value })}
                        placeholder="Reporter"
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      />
                    </div>

                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Due date <span className="text-red-400">*</span></label>
                      <input
                        required
                        type="date"
                        value={taskDraft.due}
                        onChange={(e) => setTaskDraft({ ...taskDraft, due: e.target.value })}
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      />
                    </div>

                    <div>
                      <label className={darkMode ? "mb-2 block text-[15px] font-medium text-slate-200" : "mb-2 block text-[15px] font-medium text-slate-700"}>Labels <span className="text-red-400">*</span></label>
                      <input
                        required
                        value={taskDraft.labels.join(", ")}
                        onChange={(e) => setTaskDraft({ ...taskDraft, labels: e.target.value.split(",").map((label) => label.trim()).filter(Boolean) })}
                        placeholder="General"
                        className={darkMode ? "w-full rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-3 text-base text-slate-100 outline-none" : "w-full rounded-xl border border-[#dfe3e8] bg-[#f7f7f7] px-3 py-3 text-base text-slate-800 outline-none"}
                      />
                    </div>
                  </div>

                  {taskValidationError ? (
                    <div className={darkMode ? "mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" : "mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"}>
                      {taskValidationError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex justify-end gap-2">
                    <button onClick={() => setIsTaskModalOpen(false)} className={darkMode ? "rounded-xl border border-[#1f2a3d] px-4 py-2 text-sm" : "rounded-xl border border-[#dfe3e8] px-4 py-2 text-sm"}>
                      Cancel
                    </button>
                    <button onClick={saveTask} className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-medium text-white">
                      {editingTaskId ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-5">
              {viewMode === "board" ? (
                <div className={darkMode ? "flex-1 rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-3 shadow-sm" : "flex-1 rounded-[22px] border border-[#dfe3e8] bg-[#f6f6f6] p-3 shadow-sm"}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                        <span className="text-lg">☰</span>
                        <span>To Do</span>
                      </div>
                    </div>
                    <button className="text-2xl text-slate-500">+</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {taskColumns.map((column) => (
                      <div key={column.title} className={darkMode ? "rounded-[18px] border border-[#1f2a3d] bg-[#0f172a] p-3" : "rounded-[18px] border border-[#e2e5e8] bg-[#f7f7f7] p-3"}>
                        <div className="mb-3 flex items-center justify-between">
                          <div className={`flex items-center gap-2 text-[14px] font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                            <span className={darkMode ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1e293b] text-[11px] text-slate-200" : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ececec] text-[11px] text-slate-600"}>
                              {column.tasks.length}
                            </span>
                            {column.title}
                          </div>
                          <button className={darkMode ? "text-xl text-slate-400" : "text-xl text-slate-500"}>+</button>
                        </div>

                        <div className="space-y-3">
                          {column.tasks.map((task, idx) => (
                            <div key={`${column.title}-${task.id}-${idx}`} className={darkMode ? "rounded-[16px] border border-[#1f2a3d] bg-[#111827] p-3 shadow-sm" : "rounded-[16px] border border-[#e4e5e7] bg-[#fafafa] p-3 shadow-sm"}>
                              <div className="mb-2 flex items-center justify-between">
                                {isFieldVisible("Members") ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1f1f1f] text-[11px] font-bold text-white">
                                      {task.owner.slice(0, 1)}
                                    </span>
                                    <span className={`text-[12px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{task.owner}</span>
                                  </div>
                                ) : (
                                  <div />
                                )}
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openEditTaskModal(task)} className={darkMode ? "text-slate-400" : "text-slate-500"}>Edit</button>
                                  <button onClick={() => deleteTask(task.id)} className={darkMode ? "text-red-400" : "text-red-500"}>Delete</button>
                                </div>
                              </div>

                              <div className={`mb-2 text-[15px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{task.title}</div>

                              {isFieldVisible("Status") && (
                                <div className="mb-2">
                                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                                    task.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-600"
                                      : task.status === "In Progress"
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {task.status}
                                  </span>
                                </div>
                              )}

                              {isFieldVisible("Labels") && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                  {task.labels.map((label, labelIndex) => (
                                    <span key={`${label}-${labelIndex}`} className={darkMode ? "inline-flex rounded-full border border-[#1f2a3d] bg-[#0f172a] px-2 py-1 text-[10px] font-medium text-slate-300" : "inline-flex rounded-full border border-[#ececec] bg-white px-2 py-1 text-[10px] font-medium text-slate-600"}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className={`flex items-center justify-between text-[12px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {isFieldVisible("Due Date") ? (
                                  <div className="flex items-center gap-2">
                                    <CalendarDays size={14} />
                                    <span>{task.due}</span>
                                  </div>
                                ) : (
                                  <div />
                                )}
                                {isFieldVisible("Priority") && (
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 font-medium ${
                                      task.priority === "High"
                                        ? "bg-red-100 text-red-600"
                                        : task.priority === "Medium"
                                          ? "bg-orange-100 text-orange-600"
                                          : "bg-gray-100 text-slate-600"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                              </div>

                              {isFieldVisible("Reporter") && task.reporter && (
                                <div className={`mt-2 text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                  Reporter: {task.reporter}
                                </div>
                              )}
                            </div>
                          ))}

                          <button onClick={openNewTaskModal} className={darkMode ? "mt-2 flex w-full items-center justify-center gap-2 py-2 text-[14px] font-medium text-slate-300" : "mt-2 flex w-full items-center justify-center gap-2 py-2 text-[14px] font-medium text-slate-600"}>
                            <Plus size={16} />
                            Add Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={darkMode ? "flex-1 rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-3 shadow-sm" : "flex-1 rounded-[22px] border border-[#dfe3e8] bg-[#f6f6f6] p-3 shadow-sm"}>
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className={darkMode ? "rounded-[18px] border border-[#1f2a3d] bg-[#0f172a] p-4" : "rounded-[18px] border border-[#e2e5e8] bg-white p-4"}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isFieldVisible("Members") && (
                              <>
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-[12px] font-bold text-white">
                                  {task.owner.slice(0, 1)}
                                </span>
                                <span className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{task.owner}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditTaskModal(task)} className={darkMode ? "text-slate-400" : "text-slate-500"}>Edit</button>
                            <button onClick={() => deleteTask(task.id)} className={darkMode ? "text-red-400" : "text-red-500"}>Delete</button>
                          </div>
                        </div>

                        <div className={`mb-2 text-[17px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{task.title}</div>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {isFieldVisible("Status") && (
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                              task.status === "Completed"
                                ? "bg-emerald-100 text-emerald-600"
                                : task.status === "In Progress"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}>
                              {task.status}
                            </span>
                          )}
                          {isFieldVisible("Priority") && (
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                              task.priority === "High"
                                ? "bg-red-100 text-red-600"
                                : task.priority === "Medium"
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-gray-100 text-slate-600"
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>

                        {isFieldVisible("Labels") && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {task.labels.map((label, index) => (
                              <span key={`${label}-${index}`} className={darkMode ? "inline-flex rounded-full border border-[#1f2a3d] bg-[#0f172a] px-2 py-1 text-[10px] font-medium text-slate-300" : "inline-flex rounded-full border border-[#ececec] bg-white px-2 py-1 text-[10px] font-medium text-slate-600"}>
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className={`flex items-center justify-between text-[12px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {isFieldVisible("Due Date") ? (
                            <div className="flex items-center gap-2">
                              <CalendarDays size={14} />
                              <span>{task.due}</span>
                            </div>
                          ) : <div />}
                          {isFieldVisible("Reporter") && task.reporter ? (
                            <span>Reporter: {task.reporter}</span>
                          ) : <span />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showFilter && (
                <aside className={darkMode ? "w-[260px] rounded-[22px] border border-[#1f2a3d] bg-[#0f172a] p-3 shadow-sm" : "w-[260px] rounded-[22px] border border-[#dfe3e8] bg-[#f7f7f7] p-3 shadow-sm"}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-[15px] font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                      <PanelRightOpen size={16} />
                      Fields
                    </div>
                    <button className={darkMode ? "text-xl text-slate-400" : "text-xl text-slate-500"}>+</button>
                  </div>

                  <div className={darkMode ? "mb-3 flex rounded-xl border border-[#1f2a3d] bg-[#111827] p-1" : "mb-3 flex rounded-xl border border-[#dfe3e8] bg-white p-1"}>
                    <button
                      onClick={() => {
                        setFieldSection("list");
                        setViewMode("list");
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${fieldSection === "list" ? (darkMode ? "bg-[#0f172a] text-slate-100" : "bg-[#f3f4f6] text-slate-800") : darkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => {
                        setFieldSection("board");
                        setViewMode("board");
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${fieldSection === "board" ? (darkMode ? "bg-[#0f172a] text-slate-100" : "bg-[#f3f4f6] text-slate-800") : darkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Board
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filterOptions.map((option) => {
                      const active = selectedFilters.includes(option);
                      return (
                        <label
                          key={`${fieldSection}-${option}`}
                          onClick={() => toggleFilter(option)}
                          className={darkMode ? "flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-[#111827]" : "flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-white"}
                        >
                          <span className={`text-[14px] ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{option}</span>
                          <span className={`flex h-5 w-5 items-center justify-center rounded border ${active ? darkMode ? "border-slate-500 bg-slate-200 text-slate-900" : "border-slate-700 bg-slate-800 text-white" : darkMode ? "border-slate-600 bg-[#111827]" : "border-slate-300 bg-white"}`}>
                            {active ? <Check size={12} /> : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
  title?: string;
  username?: string;
};

const avatarGradients = [
  "linear-gradient(135deg, #8b5cf6, #d946ef)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #10b981, #3b82f6)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #14b8a6, #22c55e)",
  "linear-gradient(135deg, #f59e0b, #f43f5e)",
];

const getAvatarMeta = (name: string) => {
  const initials = name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const hash = Array.from(name || "User").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const gradient = avatarGradients[hash % avatarGradients.length];

  return { initials, gradient };
};

const defaultUser: UserProfile = {
  name: "New User",
  email: "user@taskflow.local",
  title: "Team Member",
  username: "newuser",
};

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [accent, setAccent] = useState<string>("#8b5cf6");
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(defaultUser);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("theme-mode") === "dark";
    const savedAccent = localStorage.getItem("theme-accent") || "#8b5cf6";
    const savedUser = localStorage.getItem("user-profile");
    const savedSession = localStorage.getItem("auth-session") === "active" && !!localStorage.getItem("session-token");

    setDarkMode(savedTheme);
    setAccent(savedAccent);
    setIsAuthenticated(savedSession);
    if (savedUser) {
      const profile = JSON.parse(savedUser);
      setUser(profile);
      setDraft(profile);
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

  const handleToggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("theme-mode", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(defaultUser);
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

  const avatarMeta = getAvatarMeta(user.name || defaultUser.name);
  const userInitials = user.picture ? "" : avatarMeta.initials;

  const handleEditClick = () => {
    setDraft({ ...user });
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    const trimmedEmail = draft.email.trim();
    const trimmedTitle = draft.title?.trim() || "Team Member";
    const trimmedUsername = draft.username?.trim() || "newuser";

    if (!trimmedName || !trimmedEmail) {
      return;
    }

    const updatedUser = {
      ...user,
      name: trimmedName,
      email: trimmedEmail,
      title: trimmedTitle,
      username: trimmedUsername,
    };

    setUser(updatedUser);
    setDraft(updatedUser);
    setIsEditing(false);
    localStorage.setItem("user-profile", JSON.stringify(updatedUser));
  };

  const handleCancel = () => {
    setDraft({ ...user });
    setIsEditing(false);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f2f3f5] text-slate-800"}>
        <div className="flex min-h-screen">
          <Sidebar
            active="Profile"
            darkMode={darkMode}
            accent={accent}
            isAuthenticated={isAuthenticated}
            user={user}
            onToggleTheme={handleToggleTheme}
            onAccentChange={setAccent}
            onLogout={handleLogout}
          />

          <main className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-[820px]">
              <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                <ArrowLeft size={16} />
                Back to app
              </Link>

              <div className="mb-8 flex items-center justify-center gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-[24px] font-semibold text-white shadow-lg shadow-pink-200"
                  style={{ background: user.picture ? undefined : avatarMeta.gradient }}
                >
                  {user.picture ? <img src={user.picture} alt={user.name} className="h-full w-full object-cover" /> : userInitials}
                </div>
                <h1 className={`text-[42px] font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Profile</h1>
              </div>

              <div className="mb-4 flex justify-end">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className={darkMode ? "rounded-xl bg-[#1f2937] px-4 py-2 text-sm font-medium text-slate-100 hover:bg-[#273244]" : "rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"}
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className={darkMode ? "rounded-xl border border-[#2b374d] bg-[#111827] px-4 py-2 text-sm font-medium text-slate-200" : "rounded-xl border border-[#dfe3e8] bg-white px-4 py-2 text-sm font-medium text-slate-700"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className={darkMode ? "rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-6 shadow-sm" : "rounded-[22px] border border-[#dfe3e8] bg-[#f4f4f6] p-6 shadow-sm"}>
                <div className="space-y-5">
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className={`text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Profile picture</label>
                    <div className="flex items-center justify-center py-1">
                      <div
                        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-[20px] font-semibold text-white shadow-md shadow-pink-200"
                        style={{ background: user.picture ? undefined : avatarMeta.gradient }}
                      >
                        {user.picture ? <img src={user.picture} alt={user.name} className="h-full w-full object-cover" /> : userInitials}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className={`text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Email</label>
                    {isEditing ? (
                      <input
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                        className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 outline-none ring-0" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 outline-none ring-0"}
                      />
                    ) : (
                      <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 shadow-inner" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 shadow-inner"}>
                        {user.email}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className={`text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Full name</label>
                    {isEditing ? (
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 outline-none ring-0" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 outline-none ring-0"}
                      />
                    ) : (
                      <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 shadow-inner" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 shadow-inner"}>
                        {user.name}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className={`text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Title</label>
                    {isEditing ? (
                      <input
                        value={draft.title || ""}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 outline-none ring-0" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 outline-none ring-0"}
                      />
                    ) : (
                      <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 shadow-inner" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 shadow-inner"}>
                        {user.title || "Designer"}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className={`text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Username</label>
                    {isEditing ? (
                      <input
                        value={draft.username || ""}
                        onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                        className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 outline-none ring-0" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 outline-none ring-0"}
                      />
                    ) : (
                      <div className={darkMode ? "rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-4 py-3 text-[15px] text-slate-200 shadow-inner" : "rounded-xl border border-[#dfe3e8] bg-[#f1f2f3] px-4 py-3 text-[15px] text-slate-700 shadow-inner"}>
                        {user.username || "Dexuser"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={darkMode ? "mt-8 rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-4 shadow-sm" : "mt-8 rounded-[22px] border border-[#dfe3e8] bg-[#f4f4f6] p-4 shadow-sm"}>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`text-[18px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Workspace access</span>
                </div>

                <div className={darkMode ? "flex items-center justify-between gap-4 rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-5 py-4" : "flex items-center justify-between gap-4 rounded-xl border border-[#dfe3e8] bg-[#f7f7f8] px-5 py-4"}>
                  <span className={`text-[15px] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Remove yourself from the workspace</span>
                  <button className="rounded-xl border border-[#f4b8b8] bg-[#fff5f5] px-4 py-2 text-[15px] font-medium text-red-500 hover:bg-red-50">
                    Leave Workspace
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

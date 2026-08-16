import Link from "next/link";
import { Check, FolderKanban, LayoutGrid, LogOut, Moon, SunMedium, UserRound } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Tasks", href: "/", icon: LayoutGrid },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Profile", href: "/profile", icon: UserRound },
];

const colorOptions = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Green", value: "#22c55e" },
];

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
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
};

export default function Sidebar({
  active = "Tasks",
  darkMode = false,
  accent = "#8b5cf6",
  isAuthenticated = true,
  user = defaultUser,
  onToggleTheme,
  onAccentChange,
  onGuestLogin,
  onGoogleLogin,
  onLogout,
}: {
  active?: string;
  darkMode?: boolean;
  accent?: string;
  isAuthenticated?: boolean;
  user?: UserProfile;
  onToggleTheme?: () => void;
  onAccentChange?: (color: string) => void;
  onGuestLogin?: () => void;
  onGoogleLogin?: () => void;
  onLogout?: () => void;
}) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState(accent);

  const handleAccentChange = (color: string) => {
    setSelectedAccent(color);
    setShowColorMenu(false);
    onAccentChange?.(color);
  };

  const effectiveAccent = accent || selectedAccent;
  const displayName = isAuthenticated ? user.name || defaultUser.name : "TaskFlow";
  const displayEmail = isAuthenticated ? user.email || defaultUser.email : "taskflow.app";
  const avatarMeta = getAvatarMeta(displayName);
  const userInitials = user.picture ? "" : avatarMeta.initials;
  const visibleNavItems = isAuthenticated ? navItems : [];

  return (
    <aside className={darkMode ? "flex w-[260px] flex-col border-r border-[#1e293b] bg-[#0d1320] text-slate-100" : "flex w-[260px] flex-col border-r border-[#dfe3e8] bg-[#f3f3f4] text-slate-800"}>
      <div className="flex items-center px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-white"
            style={{ background: user.picture ? undefined : avatarMeta.gradient }}
          >
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
          <span className={`text-[15px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{displayName}</span>
        </div>
      </div>

      <div className="mt-2 flex-1 px-3 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className={`text-[13px] font-medium uppercase tracking-[0.02em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Workspace
          </span>
          <button className={darkMode ? "text-slate-400" : "text-slate-400"}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {isAuthenticated && (
          <nav className="space-y-1">
            {visibleNavItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                  active === label
                    ? darkMode
                      ? "text-slate-50 shadow-inner"
                      : "text-slate-900 shadow-inner"
                    : darkMode
                      ? "text-slate-300 hover:bg-[#111827] hover:text-slate-50"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
                style={
                  active === label
                    ? { backgroundColor: darkMode ? `${effectiveAccent}22` : `${effectiveAccent}1a`, border: `1px solid ${effectiveAccent}55` }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        )}

        <div className={darkMode ? "mt-6 rounded-2xl border border-[#1f2a3b] bg-[#111827] p-4 shadow-sm" : "mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm"}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
              style={{ background: user.picture ? undefined : avatarMeta.gradient }}
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0">
              <div className={`text-[15px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{displayName}</div>
              <div className={`truncate text-[12px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{displayEmail}</div>
            </div>
          </div>

          <div className={`mt-4 space-y-2 text-[15px] ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
            <div className="relative">
              <button
                onClick={() => setShowColorMenu((value) => !value)}
                className={darkMode ? "flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-[#1a2334]" : "flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-50"}
              >
                <span className="flex items-center gap-3">
                  <SunMedium className="h-4 w-4" />
                  Color Mode
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showColorMenu && (
                <div className={darkMode ? "absolute left-0 top-[calc(100%+10px)] z-20 w-[180px] rounded-xl border border-[#1f2a3b] bg-[#111827] p-2 shadow-2xl" : "absolute left-0 top-[calc(100%+10px)] z-20 w-[180px] rounded-xl border border-[#dfe3e8] bg-white p-2 shadow-2xl"}>
                  {colorOptions.map((option) => {
                    const active = selectedAccent === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAccentChange(option.value)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${darkMode ? "hover:bg-[#1a2334]" : "hover:bg-slate-50"}`}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: option.value }} />
                        <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{option.name}</span>
                        {active && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onToggleTheme}
              className={darkMode ? "flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-[#1a2334]" : "flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-50"}
            >
              <span className="flex items-center gap-3">
                {darkMode ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                {darkMode ? "Dark Mode" : "Light Mode"}
              </span>
              <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#20283a] p-1">
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>
          </div>
        </div>

        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className={darkMode ? "mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-300 hover:bg-[#111827] hover:text-slate-50" : "mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-white hover:text-slate-900"}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        ) : (
          <div className="mt-6 space-y-2">
            <button
              onClick={onGuestLogin}
              className={darkMode ? "flex w-full items-center justify-center rounded-xl bg-[#1f2937] px-3 py-2 text-sm font-medium text-slate-100 hover:bg-[#273244]" : "flex w-full items-center justify-center rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"}
            >
              Continue as Guest
            </button>
            <button
              onClick={onGoogleLogin}
              className={darkMode ? "flex w-full items-center justify-center rounded-xl border border-[#2b374d] bg-[#111827] px-3 py-2 text-sm font-medium text-slate-100 hover:bg-[#172033]" : "flex w-full items-center justify-center rounded-xl border border-[#dfe3e8] bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

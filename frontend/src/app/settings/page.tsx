"use client";

import Link from "next/link";
import { ArrowLeft, Moon, SunMedium, Check } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";

const accentColors = [
  { id: "violet", name: "Violet", value: "#8b5cf6" },
  { id: "blue", name: "Blue", value: "#3b82f6" },
  { id: "pink", name: "Pink", value: "#ec4899" },
  { id: "green", name: "Green", value: "#22c55e" },
] as const;

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark" | "system">("dark");
  const [accent, setAccent] = useState<(typeof accentColors)[number]["id"]>("violet");
  const [showAccentMenu, setShowAccentMenu] = useState(false);
  const [user, setUser] = useState({ name: "Dexter", email: "dexter@gmail.com" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedSession = localStorage.getItem("auth-session") === "active" && !!localStorage.getItem("session-token");
    const savedUser = localStorage.getItem("user-profile");
    if (savedSession) setIsAuthenticated(true);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const hasSessionToken = !!localStorage.getItem("session-token");
      if (!hasSessionToken) {
        window.location.href = "/";
      }
    }
  }, [isAuthenticated]);

  const themeOptions = [
    { id: "light", label: "Light", icon: SunMedium },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Check },
  ] as const;

  const selectedAccent = accentColors.find((color) => color.id === accent) ?? accentColors[0];

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({ name: "Dexter", email: "dexter@gmail.com" });
    localStorage.removeItem("auth-session");
    localStorage.removeItem("session-token");
    localStorage.removeItem("user-profile");
    window.location.href = "/";
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f2f3f5] text-slate-800"}>
        <div className="flex min-h-screen">
          <Sidebar
            active="Settings"
            darkMode={darkMode}
            accent={selectedAccent.value}
            isAuthenticated={isAuthenticated}
            user={user}
            onToggleTheme={() => setDarkMode((v) => !v)}
            onLogout={handleLogout}
          />

          <main className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-[900px]">
              <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-[14px] font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                <ArrowLeft size={16} />
                Back to app
              </Link>

              <div className="mb-8 flex items-center justify-between">
                <h1 className={`text-[42px] font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Settings</h1>
              </div>

              <div className="space-y-6">
                <section className={darkMode ? "rounded-[22px] border border-[#1f2a3d] bg-[#111827] p-6 shadow-sm" : "rounded-[22px] border border-[#dfe3e8] bg-[#f4f4f6] p-6 shadow-sm"}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className={`text-[20px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Appearance</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {themeOptions.map(({ id, label, icon: Icon }) => {
                      const selected = activeTheme === id;

                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setActiveTheme(id);
                            if (id === "dark") setDarkMode(true);
                            if (id === "light") setDarkMode(false);
                            if (id === "system") setDarkMode(true);
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? darkMode
                                ? "border-slate-700 bg-slate-900 text-white"
                                : "border-slate-800 bg-slate-900 text-white"
                              : darkMode
                                ? "border-[#1f2a3d] bg-[#0f172a] text-slate-300 hover:bg-[#111827]"
                                : "border-[#dfe3e8] bg-[#f9f9fa] text-slate-700 hover:bg-white"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <Icon className="h-5 w-5" />
                            {selected && <Check className="h-4 w-4" />}
                          </div>
                          <div className="text-[16px] font-semibold">{label}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 text-[14px] font-medium text-slate-400">Accent color</div>

                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowAccentMenu((value) => !value)}
                        className={darkMode ? "flex items-center gap-3 rounded-xl border border-[#1f2a3d] bg-[#0f172a] px-3 py-2 text-left text-slate-200" : "flex items-center gap-3 rounded-xl border border-[#dfe3e8] bg-[#f8f8f9] px-3 py-2 text-left text-slate-700"}
                      >
                        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: selectedAccent.value }} />
                        <span>{selectedAccent.name}</span>
                        <span className="text-xs">▾</span>
                      </button>

                      {showAccentMenu && (
                        <div className={darkMode ? "absolute left-0 top-[calc(100%+10px)] z-10 w-[180px] rounded-xl border border-[#1f2a3d] bg-[#0f172a] p-2 shadow-2xl" : "absolute left-0 top-[calc(100%+10px)] z-10 w-[180px] rounded-xl border border-[#dfe3e8] bg-white p-2 shadow-2xl"}>
                          {accentColors.map((color) => {
                            const isSelected = accent === color.id;
                            return (
                              <button
                                key={color.id}
                                onClick={() => {
                                  setAccent(color.id);
                                  setShowAccentMenu(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                                  darkMode ? "hover:bg-[#111827]" : "hover:bg-slate-50"
                                }`}
                              >
                                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }} />
                                <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{color.name}</span>
                                {isSelected && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const getTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return `Overview`;
      case "/students":
        return "Students Directory";
      case "/reports":
        return "Academic Reports";
      case "/settings":
        return "Platform Settings";
      default:
        if (pathname.startsWith("/students/")) {
          return "Student Profile";
        }
        return "Student Success OS";
    }
  };

  const getSubtitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Review academic health, check recent classes, and manage reports.";
      case "/students":
        return "Access student records, view learning roadmaps, and track progress.";
      case "/reports":
        return "Generate parent booklets, compile PDFs, and view active logs.";
      case "/settings":
        return "Configure report thresholds, scoring weights, and coordinator parameters.";
      default:
        return "Academic Coordinator Control Center";
    }
  };

  // Redirect if unauthenticated (Middleware protects, but layout provides safety net)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme toggle helper
  const toggleTheme = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Keyboard shortcut for Spotlight Search (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load student list for spotlight search when open
  useEffect(() => {
    if (searchOpen) {
      setSearching(true);
      fetch("/api/students")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStudentsList(data);
          }
          setSearching(false);
        })
        .catch((err) => {
          console.error("Failed to load students for search:", err);
          setSearching(false);
        });
    }
  }, [searchOpen]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <img src="/logo.svg" alt="Loading" className="w-16 h-16 animate-bounce" />
          <p className="mt-4 text-white text-sm">Loading Student Success OS...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Filter search results
  const filteredStudents = searchQuery
    ? studentsList.filter(
      (s) =>
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.parentWhatsApp && s.parentWhatsApp.includes(searchQuery))
    )
    : studentsList.slice(0, 5); // Default to showing first 5 students

  const handleSelectStudent = (uuid: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/students/${uuid}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-250">
      {/* 1. Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0B1120] text-slate-300 transition-all duration-300 relative z-50 shadow-xl ${sidebarCollapsed ? "w-20" : "w-64"
          }`}
      >
        <div className="flex items-center px-5 pt-8 pb-6 h-24">
          <Link href="/dashboard" className="flex items-center relative w-full h-17">
            <img 
              src="/logo.png" 
              alt="UnboundYou Logo" 
              className={`absolute left-0 object-contain w-auto h-17 object-left shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
            />
            <img 
              src="https://testing-unboundyou.vercel.app/logo.svg" 
              alt="UnboundYou Icon" 
              className={`absolute left-0 object-contain w-9 h-17 shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'translate-x-0.5 opacity-100' : 'opacity-0 pointer-events-none'}`} 
            />
          </Link>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-12 flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-[#0B1120] hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-md z-50 focus:outline-none"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${isActive
                    ? 'bg-blue-500/15 text-blue-300 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                <span className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-[140px] opacity-100'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Block */}
        <div className="border-t border-slate-800/50 pb-8 pt-4 px-3 mt-auto">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-slate-400 hover:bg-slate-800/50 hover:text-red-400 mb-4"
            title="Sign Out"
          >
            <LogOut size={18} strokeWidth={2} className="shrink-0" />
            <span className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-[140px] opacity-100 text-left'}`}>Sign Out</span>
          </button>

          <Link
            href="/settings"
            className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-slate-800/40 rounded-xl transition-all duration-300 cursor-pointer text-left focus:outline-none"
            title="Account Settings"
          >
            <img
              src={
                session.user?.image ||
                "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              }
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700/50 shrink-0"
            />
            <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-[160px] opacity-100'}`}>
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{session.user?.name || 'Coordinator'}</h4>
                  <p className="text-xs text-slate-500 truncate capitalize">Administrator</p>
                </div>
                <Settings size={14} className="text-slate-500 hover:text-slate-350 transition-colors shrink-0 ml-auto" />
            </div>
          </Link>
        </div>
      </aside>

      {/* 2. Mobile Drawer Overlay Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-[#0B1120] text-slate-300 flex flex-col p-6 shadow-premium-lg">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-6 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 mb-10 mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </Link>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? "bg-primary/15 text-blue-400 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-4 py-3.5 px-4 rounded-btn hover:bg-red-500/10 text-red-400 font-semibold text-lg mt-auto"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </aside>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="h-20 border-b border-[var(--border-base)] bg-[var(--bg-panel)] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-muted"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Mobile-only logo */}
            <img src="/logo.png" alt="Logo" className="h-6 md:hidden object-contain shrink-0" />

            <div className="hidden md:block">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
                <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Workspace</Link>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{getTitle()}</h1>
            </div>

            <div className="h-6 w-[1px] bg-border hidden md:block" />

            {/* Spotlight search trigger input */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-base)] rounded-btn text-[var(--text-muted)] text-sm max-w-xs transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">Search students...</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-background border border-border rounded text-muted-foreground ml-4">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-muted text-foreground/80 hover:text-foreground btn-transition"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      {/* 4. Mobile Bottom Sticky Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-panel)] border-t border-[var(--border-base)] flex items-center justify-around px-4 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 5. Spotlight Search Command Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSearchOpen(false)}
          />
          <div className="bg-card w-full max-w-lg border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search by student name, UUID or WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground/80 text-sm"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="px-2 py-1 bg-muted text-xs hover:bg-muted/80 rounded border text-muted-foreground"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {searching ? (
                <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                  Querying directory records...
                </div>
              ) : filteredStudents.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-wider">
                    {searchQuery ? "Matching Students" : "Recent Students"}
                  </p>
                  {filteredStudents.map((student: any) => (
                    <button
                      key={student.uuid}
                      onClick={() => handleSelectStudent(student.uuid)}
                      className="w-full text-left p-3 rounded-btn hover:bg-muted flex items-center justify-between btn-transition"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">
                          {student.studentName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {student.uuid} • Grade {student.grade} ({student.board})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded border border-border">
                          {student.mentor}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${student.healthStatus === "Excellent"
                            ? "bg-success"
                            : student.healthStatus === "Needs Attention"
                              ? "bg-amber-500"
                              : "bg-red-500"
                            }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No matching student records found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

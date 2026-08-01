"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Calendar,
  CheckSquare,
  AlertTriangle,
  FileBarChart,
  UserPlus,
  BookOpen,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { DashboardCache } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardCache | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/dashboard/trends")
      ]);
      const [statsData, trendsData] = await Promise.all([
        statsRes.json(),
        trendsRes.json()
      ]);
      if (!statsData.error) {
        setStats(statsData);
      }
      if (!trendsData.error && Array.isArray(trendsData)) {
        setTrends(trendsData);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        fetch("/api/dashboard", { method: "POST" }),
        fetch("/api/dashboard/trends")
      ]);
      const statsData = await statsRes.json();
      const trendsData = await trendsRes.json();
      if (statsData.success) {
        setStats(statsData.cache);
      }
      if (!trendsData.error && Array.isArray(trendsData)) {
        setTrends(trendsData);
      }
    } catch (err) {
      console.error("Failed to refresh cache:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 h-[350px] bg-white border border-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Academic Coordination Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's what requires your academic coordination focus today.
          </p>
        </div>
        <button
          onClick={handleRefreshCache}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 bg-white text-xs font-semibold rounded-xl transition-all text-gray-700 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Recalculating..." : "Refresh Stats"}
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Active Students
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-gray-900">
                {stats?.activeStudents || 0}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Across all boards
              </p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Attendance Rate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-gray-900">
                {stats?.attendancePercentage || 0}%
              </p>
              <p className="text-[10px] text-green-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +1.2% this week
              </p>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-500 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Pending Tasks
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-gray-900">
                {stats?.pendingAssignments || 0}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Awaiting review
              </p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-500 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Students At Risk
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-red-500">
                {stats?.studentsAtRisk || 0}
              </p>
              <p className="text-[10px] text-red-500 font-medium">
                Immediate check req.
              </p>
            </div>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance & Progress Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-2xl">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-6">
            Academy Success Trends
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F80F9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2F80F9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#08BD7E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#08BD7E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#E2E8F0",
                    color: "#0F172A",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#2F80F9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                  name="Attendance %"
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#08BD7E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  name="Progress Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-1">
              Quick Log Console
            </h2>
            <p className="text-xs text-gray-500">
              Log classes, add homework, or enroll new profiles directly.
            </p>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <Link
              href="/students?action=new"
              className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">Enroll Student</p>
              </div>
              <p className="text-xs text-gray-500 text-right whitespace-nowrap">Create student file</p>
            </Link>

            <Link
              href="/students"
              className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">Log Class Info</p>
              </div>
              <p className="text-xs text-gray-500 text-right whitespace-nowrap">Add class remarks</p>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                <FileBarChart className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">Build Report</p>
              </div>
              <p className="text-xs text-gray-500 text-right whitespace-nowrap">Generate parent PDF</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Segment: At Risk Warning banner if any */}
      {stats && stats.studentsAtRisk > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-btn flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>
              <strong>Attention Required:</strong> You have {stats.studentsAtRisk} student(s) at
              risk of falling behind. Please review their attendance rates and assignment logs.
            </span>
          </div>
          <Link href="/students?health=At Risk" className="font-bold underline shrink-0 hover:text-red-400">
            View Profiles
          </Link>
        </div>
      )}
    </div>
  );
}

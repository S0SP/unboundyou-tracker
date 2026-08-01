"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Settings as SettingsIcon, Save, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { Settings } from "@/types";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings>({
    attendanceWeight: 0.15,
    assignmentWeight: 0.2,
    participationWeight: 0.15,
    homeworkWeight: 0.15,
    chapterTestWeight: 0.2,
    schoolExamWeight: 0.15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!data.error) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleWeightChange = (key: keyof Settings, val: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    const numeric = parseFloat(val) || 0;
    setSettings((prev) => ({
      ...prev,
      [key]: numeric / 100, // convert percentage back to decimal weight
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();

      if (!data.error) {
        setSuccessMsg("Settings saved and audit log updated successfully!");
        setSettings(data.settings);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground text-sm">Loading settings console...</p>
      </div>
    );
  }

  // Calculate sum of weights (as percentage)
  const sumPercent = Math.round(
    (settings.attendanceWeight +
      settings.assignmentWeight +
      settings.participationWeight +
      settings.homeworkWeight +
      settings.chapterTestWeight +
      settings.schoolExamWeight) *
      100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure index calculation weights, audit operations, and workspace rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Weights form */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-6">
          <h2 className="text-lg font-bold text-foreground">Learning Impact Score Weights</h2>
          <p className="text-xs text-muted-foreground">
            Configure the relative weight of each academic parameter in calculating the student's **Overall Progress Score**. The weights must sum to exactly **100%**.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Attendance */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Attendance Weight (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.attendanceWeight * 100)}
                  onChange={(e) => handleWeightChange("attendanceWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>

              {/* Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Assignment Completion (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.assignmentWeight * 100)}
                  onChange={(e) => handleWeightChange("assignmentWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>

              {/* Participation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Class Participation (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.participationWeight * 100)}
                  onChange={(e) => handleWeightChange("participationWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>

              {/* Homework */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Homework Completion (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.homeworkWeight * 100)}
                  onChange={(e) => handleWeightChange("homeworkWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>

              {/* Chapter Test */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Chapter Test Average (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.chapterTestWeight * 100)}
                  onChange={(e) => handleWeightChange("chapterTestWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>

              {/* School Exam */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  School Exam Average (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={Math.round(settings.schoolExamWeight * 100)}
                  onChange={(e) => handleWeightChange("schoolExamWeight", e.target.value)}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Sum indicator */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Cumulative Sum:</span>
              <span
                className={`font-bold ${
                  sumPercent === 100 ? "text-success" : "text-red-500 animate-pulse"
                }`}
              >
                {sumPercent}%
              </span>
            </div>

            {/* Notifications alerts */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-success/10 border border-success/20 text-success rounded text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving || sumPercent !== 100}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Calculation Weights"}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Auth & General System configuration docs */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 rounded-card shadow-premium-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground">Access Gatekeeper</h3>
            <p className="text-xs text-muted-foreground">
              Google OAuth signs in any @gmail.com account by default, and filters custom business domains if ALLOWED_DOMAINS is configured in env.
            </p>
            <div className="space-y-2 text-[10px] text-muted-foreground font-mono">
              <div className="bg-muted p-2 rounded border border-border">
                <strong>ALLOWED_DOMAINS:</strong> unboundyou.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

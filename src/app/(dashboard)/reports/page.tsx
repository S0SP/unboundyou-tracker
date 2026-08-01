"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ReportLog, Student } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal selector trigger
  const [selectStudentOpen, setSelectStudentOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/students"),
      ]);

      const reportsData = await reportsRes.json();
      const studentsData = await studentsRes.json();

      if (Array.isArray(reportsData)) setReports(reportsData);
      if (Array.isArray(studentsData)) setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load reports library data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLink = (reportId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(reportId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStudentName = (uuid: string) => {
    const s = students.find((item) => item.uuid === uuid);
    return s ? s.studentName : "Unknown Student";
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const studentName = getStudentName(r.uuid).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      studentName.includes(query) ||
      r.reportId.toLowerCase().includes(query) ||
      r.reportType.toLowerCase().includes(query) ||
      r.uuid.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground text-sm">Loading reports database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reports Archive
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Access compiled progress booklet files and copy secure parent access links.
          </p>
        </div>
        <button
          onClick={() => setSelectStudentOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-btn shadow-premium-md btn-transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Compile New Booklet
        </button>
      </div>

      {/* Search toolbar */}
      <div className="flex gap-3 bg-card border border-border p-4 rounded-card shadow-premium-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports by student name, ID, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted text-foreground placeholder:text-muted-foreground/80 border border-border rounded-input text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Reports Library Table */}
      <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs font-bold border-b border-border">
                <th className="p-4">Generated Date</th>
                <th className="p-4">Report ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date Range</th>
                <th className="p-4">Sharing Mode</th>
                <th className="p-4">Author</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((r) => {
                  const studentName = getStudentName(r.uuid);
                  return (
                    <tr key={r.reportId} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 whitespace-nowrap font-medium">
                        {r.generatedDate.split("T")[0]}
                      </td>
                      <td className="p-4 font-mono font-bold text-xs">{r.reportId}</td>
                      <td className="p-4">
                        <Link
                          href={`/students/${r.uuid}`}
                          className="font-bold text-primary hover:underline"
                        >
                          {studentName}
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.uuid}</p>
                      </td>
                      <td className="p-4 font-semibold">{r.reportType}</td>
                      <td className="p-4 text-xs whitespace-nowrap">
                        {r.startDate} to {r.endDate}
                      </td>
                      <td className="p-4 text-xs font-semibold">{r.mode}</td>
                      <td className="p-4 text-xs truncate max-w-[120px]">{r.generatedBy}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(r.reportId, r.publicUrl)}
                            className="p-2 bg-muted hover:bg-primary hover:text-white rounded btn-transition text-muted-foreground"
                            title="Copy parent URL link"
                          >
                            {copiedId === r.reportId ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* PDF Drive Download */}
                          <a
                            href={r.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-muted hover:bg-primary hover:text-white rounded btn-transition text-muted-foreground"
                            title="Download PDF Booklet"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Public secure view */}
                          <a
                            href={r.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-muted hover:bg-success hover:text-white rounded btn-transition text-muted-foreground"
                            title="Open public page booklet"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No generated reports match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Select Student Modal */}
      {selectStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectStudentOpen(false)}
          />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Select Student</h3>
              <button
                onClick={() => setSelectStudentOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[350px] overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">
                Choose a student to compile and generate their progress report booklets:
              </p>
              {students
                .filter((s) => s.status === "Active")
                .map((s) => (
                  <button
                    key={s.uuid}
                    onClick={() => {
                      setSelectStudentOpen(false);
                      router.push(`/students/${s.uuid}?action=report`);
                    }}
                    className="w-full text-left p-3 border border-border bg-muted/20 hover:bg-muted rounded-btn font-semibold text-sm btn-transition flex items-center justify-between"
                  >
                    <span>{s.studentName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{s.uuid}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

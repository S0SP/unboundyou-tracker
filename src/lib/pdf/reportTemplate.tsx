import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register default system sans-serif font
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

// Styles matching UnboundYou branding rules
const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    backgroundColor: "#F4F6FB",
    color: "#0B1120",
    padding: 40,
    fontSize: 10,
    lineHeight: 1.5,
  },
  coverPage: {
    fontFamily: "Inter",
    backgroundColor: "#2F80F9",
    color: "#FFFFFF",
    padding: 50,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: "#2F80F9",
    marginTop: 100,
  },
  coverSubtitle: {
    fontSize: 16,
    fontWeight: 400,
    color: "#A1A1AA",
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  coverFooter: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 20,
    marginTop: "auto",
  },
  coverMetaLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  },
  coverMetaVal: {
    fontSize: 12,
    fontWeight: 500,
    color: "#FFFFFF",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2F80F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
  },
  brandName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2F80F9",
  },
  logoImage: {
    width: 120,
    height: 32,
    objectFit: "contain",
  },
  reportMeta: {
    fontSize: 9,
    color: "#64748B",
    textAlign: "right",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridCol6: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 6,
  },
  cardLabel: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0B1120",
  },
  table: {
    display: "flex",
    flexDirection: "column",
    marginTop: 8,
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 6,
  },
  tableHeader: {
    fontWeight: 700,
    color: "#64748B",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  col: {
    flex: 1,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 99,
    fontSize: 8,
    fontWeight: 500,
    textAlign: "center",
    width: 60,
  },
  badgeSuccess: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  badgeWarning: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  badgeDanger: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletDot: {
    width: 8,
    color: "#2F80F9",
    fontWeight: 700,
  },
  bulletContent: {
    flex: 1,
  },
});

interface ReportTemplateProps {
  data: {
    student: any;
    subjects: any[];
    classes: any[];
    assignments: any[];
    tests: any[];
    exams: any[];
    learningPlans: any[];
    ptms: any[];
    mentorNotes: any[];
    reportMeta: {
      reportType: string;
      startDate: string;
      endDate: string;
      generatedBy: string;
    };
  };
  logoDataUrl?: string;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ data, logoDataUrl }) => {
  const { student, subjects, classes, assignments, tests, exams, learningPlans, ptms, mentorNotes, reportMeta } = data as any;

  // Filter lists based on date range
  const start = new Date(reportMeta.startDate);
  const end = new Date(reportMeta.endDate);

  const filterByDate = (item: any, dateKey: string) => {
    if (!item[dateKey]) return false;
    const d = new Date(item[dateKey]);
    return d >= start && d <= end;
  };

  const periodClasses = classes.filter((c: any) => filterByDate(c, "date"));
  const periodAssignments = assignments.filter((a: any) => filterByDate(a, "assignedDate"));
  const periodTests = tests.filter((t: any) => filterByDate(t, "date"));
  const periodExams = exams.filter((e: any) => filterByDate(e, "date"));
  const activePlan = learningPlans[learningPlans.length - 1];

  // Calculations
  const totalClasses = periodClasses.length;
  const presentClasses = periodClasses.filter((c: any) => c.attendance === "Present" || c.attendance === "Late").length;
  const attendancePct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  const totalAssignments = periodAssignments.length;
  const submittedAssignments = periodAssignments.filter((a: any) => a.submissionStatus !== "Pending").length;
  const assignmentPct = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 100;

  // Health badge style
  const getHealthBadge = (health: string) => {
    if (health === "Excellent") return [styles.badge, styles.badgeSuccess];
    if (health === "Needs Attention") return [styles.badge, styles.badgeWarning];
    return [styles.badge, styles.badgeDanger];
  };

  return (
    <Document>
      {/* PAGE 1: Branded Cover Booklet */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={{ width: 160, height: 40, objectFit: "contain", marginBottom: 32 }} />
          ) : (
            <Text style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 32 }}>UnboundYou</Text>
          )}
          <Text style={styles.coverSubtitle}>Academic Progress Booklet</Text>
          <Text style={styles.coverTitle}>Academic Progress Report</Text>
          <View style={{ width: 60, height: 4, backgroundColor: "rgba(255,255,255,0.6)", marginTop: 24 }} />
        </View>

        <View style={styles.coverFooter}>
          <View>
            <Text style={styles.coverMetaLabel}>Student</Text>
            <Text style={styles.coverMetaVal}>{student.studentName}</Text>
          </View>
          <View>
            <Text style={styles.coverMetaLabel}>Grade & Board</Text>
            <Text style={styles.coverMetaVal}>
              Grade {student.grade} ({student.board})
            </Text>
          </View>
          <View>
            <Text style={styles.coverMetaLabel}>Report Period</Text>
            <Text style={styles.coverMetaVal}>
              {reportMeta.startDate} - {reportMeta.endDate}
            </Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: Summary Dashboard & Notes */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logoImage} />
          ) : (
            <Text style={styles.brandName}>UnboundYou</Text>
          )}
          <Text style={styles.reportMeta}>
            Report Type: {reportMeta.reportType} | Date: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol6}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Overall Progress Score</Text>
                <Text style={[styles.cardValue, { color: "#2F80F9" }]}>
                  {student.overallProgressScore} / 100
                </Text>
              </View>
            </View>
            <View style={styles.gridCol6}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Academic Health</Text>
                <Text style={styles.cardValue}>{student.healthStatus}</Text>
              </View>
            </View>
            <View style={styles.gridCol6}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Attendance Rate</Text>
                <Text style={styles.cardValue}>{attendancePct}%</Text>
              </View>
            </View>
            <View style={styles.gridCol6}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Homework Submission</Text>
                <Text style={styles.cardValue}>{assignmentPct}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Private Mentor Notes Included (Optional) */}
        {mentorNotes && mentorNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mentor Feedback & Insights</Text>
            {mentorNotes
              .filter((n: any) => n.includeInReport === "TRUE" || (n.includeInReport as any) === true)
              .map((n: any, idx: number) => (
                <View key={n.noteId || idx} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 8 }}>
                    {n.date} - Feedback ({n.subject})
                  </Text>
                  <Text style={{ marginTop: 4, color: "#334155" }}>{n.notes}</Text>
                </View>
              ))}
          </View>
        )}
      </Page>

      {/* PAGE 3: Class Timeline & Test Scores */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logoImage} />
          ) : (
            <Text style={styles.brandName}>UnboundYou</Text>
          )}
          <Text style={styles.reportMeta}>{student.studentName}</Text>
        </View>

        {/* Test scores */}
        {periodTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapter Test Results</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.col, { flex: 2 }]}>Test Name</Text>
                <Text style={styles.col}>Subject</Text>
                <Text style={styles.col}>Date</Text>
                <Text style={styles.col}>Score</Text>
                <Text style={styles.col}>Grade %</Text>
              </View>
              {periodTests.map((t: any, idx: number) => (
                <View key={t.testId || idx} style={styles.tableRow}>
                  <Text style={[styles.col, { flex: 2 }]}>{t.testName}</Text>
                  <Text style={styles.col}>{t.subject}</Text>
                  <Text style={styles.col}>{t.date}</Text>
                  <Text style={styles.col}>
                    {t.marksObtained}/{t.totalMarks}
                  </Text>
                  <Text style={[styles.col, { fontWeight: 700 }]}>
                    {t.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exam progress */}
        {periodExams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>School Exam Tracking & Improvement</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.col, { flex: 2 }]}>Exam Name</Text>
                <Text style={styles.col}>Subject</Text>
                <Text style={styles.col}>Percentage</Text>
                <Text style={styles.col}>Improvement</Text>
              </View>
              {periodExams.map((e: any, idx: number) => (
                <View key={e.examId || idx} style={styles.tableRow}>
                  <Text style={[styles.col, { flex: 2 }]}>{e.examName}</Text>
                  <Text style={styles.col}>{e.subject}</Text>
                  <Text style={[styles.col, { fontWeight: 700 }]}>{e.percentage}%</Text>
                  <Text
                    style={[
                      styles.col,
                      {
                        color: e.improvementPercentage >= 0 ? "#08BD7E" : "#EF4444",
                        fontWeight: 700,
                      },
                    ]}
                  >
                    {e.improvementPercentage >= 0 ? "+" : ""}
                    {e.improvementPercentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Classes log */}
        {periodClasses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Classes Logged</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.col}>Date</Text>
                <Text style={styles.col}>Subject</Text>
                <Text style={[styles.col, { flex: 2 }]}>Chapter</Text>
                <Text style={styles.col}>Attendance</Text>
                <Text style={styles.col}>Participation</Text>
              </View>
              {periodClasses.slice(0, 8).map((c: any, idx: number) => (
                <View key={c.classId || idx} style={styles.tableRow}>
                  <Text style={styles.col}>{c.date}</Text>
                  <Text style={styles.col}>{c.subject}</Text>
                  <Text style={[styles.col, { flex: 2 }]}>{c.chapter}</Text>
                  <Text style={styles.col}>{c.attendance}</Text>
                  <Text style={styles.col}>{c.participation}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>

      {/* PAGE 4: Monthly Learning Plan & Goals */}
      {activePlan && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerRow}>
            {logoDataUrl ? (
              <Image src={logoDataUrl} style={styles.logoImage} />
            ) : (
              <Text style={styles.brandName}>UnboundYou</Text>
            )}
            <Text style={styles.reportMeta}>{student.studentName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Roadmap & Strategy ({activePlan.month})</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 9, textTransform: "uppercase" }}>
                Identified Strengths
              </Text>
              <Text style={{ marginTop: 4, color: "#334155" }}>{activePlan.strengths}</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 9, textTransform: "uppercase" }}>
                Focus Areas / Weaknesses
              </Text>
              <Text style={{ marginTop: 4, color: "#334155" }}>{activePlan.weakAreas}</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 9, textTransform: "uppercase" }}>
                Target Learning Goals
              </Text>
              <Text style={{ marginTop: 4, color: "#334155" }}>{activePlan.goals}</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 9, textTransform: "uppercase" }}>
                Mentor Plan & Strategy
              </Text>
              <Text style={{ marginTop: 4, color: "#334155" }}>{activePlan.mentorPlan}</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 700, color: "#64748B", fontSize: 9, textTransform: "uppercase" }}>
                Parent Action Items
              </Text>
              <Text style={{ marginTop: 4, color: "#334155" }}>{activePlan.parentFocus}</Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
};

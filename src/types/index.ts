export interface Student {
  uuid: string; // UBY-2026-XXXXX
  studentName: string;
  grade: string;
  board: string;
  parentName: string;
  parentEmail: string;
  parentWhatsApp: string;
  mentor: string;
  academicCoordinator: string;
  enrollmentDate: string;
  status: 'Active' | 'Completed' | 'Paused';
  overallProgressScore: number; // 0 - 100
  healthStatus: 'Excellent' | 'Needs Attention' | 'At Risk';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  subjectId: string; // SUBXXX
  subject: string;
}

export interface StudentSubject {
  uuid: string; // Student UUID
  subjectId: string; // Subject ID
  mentor: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Paused';
}

export interface ClassLog {
  classId: string; // CLS-XXXXXX
  studentUuid: string;
  subject: string;
  chapter: string;
  date: string;
  duration: number; // in minutes
  attendance: 'Present' | 'Absent' | 'Late' | 'No Show' | 'Rescheduled' | 'Cancelled';
  participation: number; // Percentage 0 - 100
  homeworkGiven: 'TRUE' | 'FALSE';
  homeworkCompleted: 'TRUE' | 'FALSE';
  revisionNotesShared: 'TRUE' | 'FALSE';
  remarks: string;
  createdBy: string;
  timestamp: string;
}

export interface Assignment {
  assignmentId: string; // ASN-XXXXXX
  studentUuid: string;
  subject: string;
  chapter: string;
  assignmentTitle: string;
  assignedDate: string;
  dueDate: string;
  submissionStatus: 'Pending' | 'Submitted' | 'Reviewed';
  score: number;
  totalMarks: number;
  percentage: number;
  mentorRemarks: string;
}

export interface ChapterTest {
  testId: string; // TST-XXXXXX
  studentUuid: string;
  subject: string;
  chapter: string;
  testName: string;
  date: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  mentorComment: string;
}

export interface SchoolExam {
  examId: string; // EXM-XXXXXX
  studentUuid: string;
  subject: string;
  examName: string;
  date: string;
  marks: number;
  total: number;
  percentage: number;
  previousPercentage: number;
  improvementPercentage: number;
}

export interface LearningPlan {
  planId: string; // PLN-XXXXXX
  studentUuid: string;
  subject: string;
  month: string; // e.g. "2026-08"
  strengths: string;
  weakAreas: string;
  goals: string;
  mentorPlan: string;
  parentFocus: string;
  createdBy: string;
  createdAt: string;
}

export interface PtmLog {
  ptmId: string; // PTM-XXXXXX
  studentUuid: string;
  subject: string;
  ptmDate: string;
  parentConcerns: string;
  mentorRecommendations: string;
  actionItems: string;
  nextPtmDate: string;
}

export interface MentorNote {
  noteId: string; // NTE-XXXXXX
  studentUuid: string;
  subject: string;
  date: string;
  notes: string;
  includeInReport: 'TRUE' | 'FALSE';
}

export interface ReportLog {
  reportId: string; // RPT-XXXXXX
  uuid: string; // Student UUID
  reportType: 'Weekly' | 'Monthly' | 'Custom';
  startDate: string;
  endDate: string;
  generatedBy: string;
  generatedDate: string;
  driveFileId: string;
  pdfUrl: string;
  publicToken: string;
  publicUrl: string;
  mode: 'Snapshot' | 'Live' | 'Disabled';
  status: string; // e.g., "Active"
  snapshotData?: string; // Serialized JSON of student state at generation time
}

export interface DashboardCache {
  totalStudents: number;
  activeStudents: number;
  attendancePercentage: number;
  pendingAssignments: number;
  reportsPending: number;
  averageScore: number;
  averageProgress: number;
  studentsAtRisk: number;
  updatedAt: string;
}

export interface Settings {
  attendanceWeight: number; // default 0.15
  assignmentWeight: number; // default 0.20
  participationWeight: number; // default 0.15
  homeworkWeight: number; // default 0.15
  chapterTestWeight: number; // default 0.20
  schoolExamWeight: number; // default 0.15
}

export interface AuditLog {
  action: string;
  user: string;
  time: string;
  studentUuid: string;
  module: string;
  description: string;
}

import { NextRequest, NextResponse } from "next/server";
import { getRows } from "@/lib/google/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClassLog, Assignment, Student } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [classes, assignments, students] = await Promise.all([
      getRows<ClassLog>("04_Classes"),
      getRows<Assignment>("05_Assignments"),
      getRows<Student>("01_Students"),
    ]);

    const today = new Date();
    const trendData = [];
    
    // Calculate cumulative progress score of all active students to use as a baseline
    const activeStudents = students.filter(s => s.status === "Active");
    const baselineProgress = activeStudents.length > 0 
      ? Math.round(activeStudents.reduce((sum, s) => sum + (Number(s.overallProgressScore) || 0), 0) / activeStudents.length)
      : 0;
    
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);
      
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];

      // Classes within this week
      const weekClasses = classes.filter(c => c.date >= startStr && c.date <= endStr);
      let presentCount = 0;
      let totalValidClasses = 0;
      weekClasses.forEach(c => {
        if (c.attendance === "Present" || c.attendance === "Late") {
          presentCount++;
          totalValidClasses++;
        } else if (c.attendance === "Absent" || c.attendance === "No Show") {
          totalValidClasses++;
        }
      });
      const attendance = totalValidClasses > 0 ? Math.round((presentCount / totalValidClasses) * 100) : null;

      // Let's use cumulative assignment score up to this week as "progress"
      const cumulativeAssignments = assignments.filter(a => a.assignedDate <= endStr && a.submissionStatus !== "Pending");
      let totalScore = 0;
      cumulativeAssignments.forEach(a => {
        totalScore += Number(a.percentage) || 0;
      });
      const progress = cumulativeAssignments.length > 0 ? Math.round(totalScore / cumulativeAssignments.length) : baselineProgress;
      
      const name = i === 0 ? "This Week" : i === 1 ? "Last Week" : `Week ${4 - i}`;
      
      trendData.push({
        name,
        attendance: attendance !== null ? attendance : (baselineProgress > 0 ? 100 : 0), // Fallback if no classes this week
        progress,
      });
    }

    return NextResponse.json(trendData);
  } catch (error: any) {
    console.error("Error calculating trends:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

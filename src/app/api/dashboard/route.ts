import { NextRequest, NextResponse } from "next/server";
import { getRows } from "@/lib/google/sheets";
import { refreshDashboardCache } from "@/services/studentService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardCache } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cacheRows = await getRows<DashboardCache>("12_Dashboard_Cache");
    let cache = cacheRows[0];

    // If cache doesn't exist, calculate it live
    if (!cache) {
      console.log("Dashboard cache is empty. Refreshing cache...");
      cache = await refreshDashboardCache();
    }

    return NextResponse.json(cache);
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cache = await refreshDashboardCache();
    return NextResponse.json({ success: true, cache });
  } catch (error: any) {
    console.error("Error refreshing dashboard cache:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

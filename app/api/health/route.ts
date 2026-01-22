import { NextResponse } from "next/server";

// Required for static export in Electron builds
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}

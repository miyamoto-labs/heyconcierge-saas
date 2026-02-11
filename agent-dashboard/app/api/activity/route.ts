import { NextResponse } from "next/server";
import { sampleActivity } from "@/lib/data";

export async function GET() {
  return NextResponse.json(sampleActivity);
}

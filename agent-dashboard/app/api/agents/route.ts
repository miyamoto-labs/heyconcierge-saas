import { NextResponse } from "next/server";
import { agents } from "@/lib/data";

export async function GET() {
  return NextResponse.json(agents);
}

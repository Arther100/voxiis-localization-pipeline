import { NextResponse } from "next/server";
import { PART2_STRINGS } from "@/lib/data";
import { scoreBatch } from "@/lib/score";

export const maxDuration = 60;

export async function GET() {
  const results = await scoreBatch(PART2_STRINGS);
  return NextResponse.json({ results });
}

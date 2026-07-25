import { NextResponse } from "next/server";
import { PART1_STRINGS } from "@/lib/data";
import { translateBatch } from "@/lib/translate";

export const maxDuration = 60;

export async function GET() {
  const results = await translateBatch(PART1_STRINGS);
  return NextResponse.json({ results });
}

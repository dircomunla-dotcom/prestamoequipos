import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    db.resetToSeed();
    return NextResponse.json({ success: true, message: "Base de datos restablecida al estado inicial" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

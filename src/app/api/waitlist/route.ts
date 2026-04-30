import { NextResponse } from "next/server";

const API_URL = "https://latzu-api-610441107033.us-central1.run.app";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ detail: "Name and email are required" }, { status: 400 });
    }

    try {
      await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
    } catch {
      // Backend may not have this endpoint yet — log and continue
      console.log(`Waitlist entry: ${name} <${email}>`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}

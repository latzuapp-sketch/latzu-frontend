import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const AI_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.backendToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { topic, experience_level = "beginner" } = await request.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic requerido" }, { status: 400 });
    }

    const response = await fetch(`${AI_URL}/learning/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.backendToken}`,
      },
      body: JSON.stringify({ topic: topic.trim(), experience_level }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudieron generar sugerencias" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

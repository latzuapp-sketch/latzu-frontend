import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/users/${session.user.id}/onboarding`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileType:   body.profileType,
        experience:    body.experience,
        interests:     body.interests    || [],
        goals:         body.goals        || [],
        learning_style: body.learningStyle ?? null,
        country:       body.country      ?? null,
        university:    body.university   ?? null,
        career:        body.career       ?? null,
        semester:      body.semester     ?? null,
        organization:  body.organization ?? null,
        role_title:    body.roleTitle    ?? null,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Backend error:", error);
      return NextResponse.json(
        { error: "Error al guardar onboarding" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

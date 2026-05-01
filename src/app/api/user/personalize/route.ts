import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const AI_URL = "https://latzu-api-610441107033.us-central1.run.app";

const MUTATION = `
  mutation PersonalizeUser($input: PersonalizeUserInput!) {
    personalizeUser(input: $input) {
      workspacesCreated
      pagesCreated
      knowledgeNodesCreated
      message
    }
  }
`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.backendToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${AI_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.backendToken}`,
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          input: {
            profileType:     body.profileType    ?? "aprendiz",
            experience:      body.experience     ?? null,
            interests:       body.interests      ?? [],
            goals:           body.goals          ?? [],
            learningStyle:   body.learningStyle  ?? null,
            university:      body.university     ?? null,
            career:          body.career         ?? null,
            semester:        body.semester       ?? null,
            country:         body.country        ?? null,
            studyFocus:      body.studyFocus     ?? null,
            // New deep-profile fields
            motivations:     body.motivations    ?? [],
            activeAreas:     body.activeAreas    ?? [],
            planningStyle:   body.planningStyle  ?? null,
            energyPeak:      body.energyPeak     ?? null,
            feedbackStyle:   body.feedbackStyle  ?? null,
            workPace:        body.workPace       ?? null,
            mainBlocker:     body.mainBlocker    ?? null,
            mainMotivator:   body.mainMotivator  ?? null,
            aiPersonality:   body.aiPersonality  ?? [],
            vision90:        body.vision90       ? JSON.stringify(body.vision90) : null,
            previewWorkspaces: body.previewWorkspaces ?? null,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("AI service error:", await response.text());
      return NextResponse.json({ success: true, partial: true });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, result: data.data?.personalizeUser });
  } catch (error) {
    console.error("Personalize error:", error);
    return NextResponse.json({ success: true, partial: true });
  }
}

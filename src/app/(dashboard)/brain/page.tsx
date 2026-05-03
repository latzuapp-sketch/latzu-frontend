"use client";

/**
 * /brain — "Hoy" home: mentor panel + create toolbar.
 *
 * The hub used to handle every kind via a single switch on `selection`. After
 * splitting per-type leaves (`/brain/notes`, `/brain/tasks`, `/brain/plans`,
 * etc.), this root page is just the user's daily landing — focus, due signals,
 * active goals, recent agent history.
 */

import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { MentorPanel } from "@/components/brain/MentorPanel";

export default function BrainHomePage() {
  return (
    <BrainPageShell
      title="Hoy"
      subtitle="Tu foco actual, metas activas y lo que el mentor tiene para decirte"
    >
      <MentorPanel />
    </BrainPageShell>
  );
}

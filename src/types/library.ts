export type BookCategory =
  | "productividad"
  | "habitos"
  | "finanzas"
  | "mentalidad"
  | "negocios"
  | "liderazgo";

export interface BookChapter {
  title: string;
  content: string; // markdown
}

export interface BookExercise {
  prompt: string;
  type: "reflection" | "action";
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  year: number;
  category: BookCategory;
  coverGradient: string;
  summary: string;
  overview: string; // 1-page executive summary (markdown)
  insights: string[];
  chapters: BookChapter[];
  analysis: string; // "So What" — cross-references, updates (markdown)
  critiques: string[];
  exercises: BookExercise[];
  pages: number;
  readMinutes: number;
  tags: string[];
  aiContext: string; // rich content fed to AI for Q&A
}

export interface LibraryFile {
  id: string;
  name: string;
  size: number;
  ext: string;
  uploadedAt: string;
  extractedText: string;
  truncated: boolean;
  chars: number;
}

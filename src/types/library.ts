export type BookCategory =
  | "productividad"
  | "habitos"
  | "finanzas"
  | "mentalidad"
  | "negocios"
  | "liderazgo";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  year: number;
  category: BookCategory;
  coverGradient: string;
  summary: string;
  insights: string[];
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

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedTypes = ["txt", "md", "pdf", "csv"];

    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado: .${ext}` },
        { status: 400 }
      );
    }

    let text = "";

    if (ext === "txt" || ext === "md" || ext === "csv") {
      text = await file.text();
    } else if (ext === "pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text;
    }

    text = text.trim();
    if (text.length < 20) {
      return NextResponse.json(
        { error: "El archivo no contiene texto suficiente." },
        { status: 422 }
      );
    }

    // Limit to 15k chars to avoid token overload
    return NextResponse.json({
      text: text.slice(0, 15000),
      chars: text.length,
      truncated: text.length > 15000,
    });
  } catch (err) {
    console.error("[extract-file]", err);
    return NextResponse.json(
      { error: "Error al procesar el archivo." },
      { status: 500 }
    );
  }
}

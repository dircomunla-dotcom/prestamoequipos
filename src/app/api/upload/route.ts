import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Formatos permitidos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];

// Límite de tamaño: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo de imagen válido." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Solo se admiten imágenes JPG, PNG, WEBP, GIF, AVIF o SVG.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido de 10 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Asegurar directorio public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Sanitizar nombre de archivo
    const originalName = file.name || "imagen.jpg";
    const extension = path.extname(originalName) || ".jpg";
    const cleanBaseName = path
      .basename(originalName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 30);

    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalFileName = `${cleanBaseName || "equipo"}_${uniqueSuffix}${extension.toLowerCase()}`;
    const filePath = path.join(uploadDir, finalFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error al procesar la subida de imagen:", error);
    return NextResponse.json(
      {
        error:
          "Error al procesar y almacenar la imagen en el servidor: " +
          (error?.message || "Error interno"),
      },
      { status: 500 }
    );
  }
}

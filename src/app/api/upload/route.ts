import { NextRequest, NextResponse } from "next/server";

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

    // Convertir a Data URI Base64 para que la foto quede persistida directamente dentro de db.json
    // y no se pierda nunca cuando el servidor reemplace la carpeta public/ en nuevos despliegues
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name || "imagen",
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

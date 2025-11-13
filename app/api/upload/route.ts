import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // This allows us to pass file content directly in chat
    const buffer = await file.arrayBuffer()
    const base64Content = Buffer.from(buffer).toString("base64")

    // Determine MIME type
    let mimeType = file.type
    if (!mimeType || mimeType === "application/octet-stream") {
      if (file.name.endsWith(".pdf")) mimeType = "application/pdf"
      else if (file.name.endsWith(".txt")) mimeType = "text/plain"
      else if (file.name.endsWith(".csv")) mimeType = "text/csv"
      else mimeType = "application/octet-stream"
    }

    return Response.json({
      fileId: Date.now().toString() + Math.random(),
      fileName: file.name,
      mimeType,
      base64Content,
      size: file.size,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return Response.json({ error: "Failed to process file" }, { status: 500 })
  }
}

import type { APIRoute } from "astro";
import { readFileSync, existsSync, unlinkSync } from "fs";

export const GET: APIRoute = ({ params }) => {
  const { uuid } = params; // Extract the UUID from the parameters

  // Check if the UUID is provided
  if (!uuid) {
    return new Response("UUID is required", { status: 400 });
  }

  // Define the path to the ZIP file
  const filePath = `./tmp/${uuid}.zip`;

  // Check if the file exists
  if (!existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  // Read the zip file as a Buffer
  const fileData = readFileSync(filePath);

  // Remove ZIP
  unlinkSync(filePath);

  // Create a response with the file data
  return new Response(fileData, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${uuid}.zip"`,
      "Content-Length": fileData.length.toString(),
    },
  });
};

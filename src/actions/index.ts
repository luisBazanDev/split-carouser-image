import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createCanvas, loadImage } from "canvas";
import { randomUUID } from "crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import Archiver from "archiver";

export const server = {
  splitImage: defineAction({
    input: z.object({
      type: z.enum(["horizontal", "vertical"]),
      amount: z.number().max(20).min(2).positive(),
      image: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    handler: async (input) => {
      // console.log(input);
      const splitImages = [];

      for (let i = 0; i < input.amount; i++) {
        // Decode the Base64 image
        const base64Data = input.image.split(",")[1]; // Remove the metadata part
        const buffer = Buffer.from(base64Data, "base64");

        // Load the image into a canvas
        const originalImage = await loadImage(buffer);

        // Calculate the cropping coordinates based on type
        let cropX = 0;
        let cropY = 0;
        let cropWidth = originalImage.width;
        let cropHeight = originalImage.height;

        if (input.type === "horizontal") {
          cropWidth = originalImage.width / input.amount;
          cropX = cropWidth * i;
        } else if (input.type === "vertical") {
          cropHeight = originalImage.height / input.amount;
          cropY = cropHeight * i;
        }
        // Create a canvas to draw the cropped image
        const canvas = createCanvas(cropWidth, cropHeight);
        const ctx = canvas.getContext("2d");

        // Draw the cropped image onto the canvas
        ctx.drawImage(
          originalImage,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );

        // Convert the canvas back to a Base64 string
        splitImages.push(saveTmpImage(canvas.toBuffer()));
      }

      // Generate zip with all splitImages
      const zipUuid = await zipping(splitImages);

      // Deelete splitImages
      deleteImages(splitImages);

      return zipUuid;
    },
  }),
};

function saveTmpImage(buffer: Buffer): string {
  const uuid = randomUUID();

  if (!existsSync("./tmp")) mkdirSync("./tmp");

  writeFileSync("./tmp/" + uuid + ".png", buffer);

  return uuid;
}

async function zipping(images: string[]): Promise<string> {
  const uuid = randomUUID();
  if (!existsSync("./tmp")) mkdirSync("./tmp");
  const out = createWriteStream(`./tmp/${uuid}.zip`);
  const archive = Archiver("zip", {
    zlib: { level: 6 },
  });

  archive.pipe(out);

  for (const image of images) {
    archive.file(`./tmp/${image}.png`, {
      name: `${image}.png`,
    });
  }

  await archive.finalize();

  return uuid;
}

function deleteImages(images: string[]) {
  for (const image of images) {
    const filePath = `./tmp/${image}.png`;
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Compress a video buffer for use as a muted hero background.
 * Always outputs MP4 (h264), strips audio, caps at 1080p width.
 */
export async function compressVideo(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "evt-video-"));
  const inputPath = path.join(dir, "input");
  const outputPath = path.join(dir, "output.mp4");

  try {
    await writeFile(inputPath, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-crf 28",
          "-preset fast",
          "-vf scale=1920:-2",
          "-an",
          "-movflags +faststart",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    const compressed = await readFile(outputPath);
    const beforeMB = (input.length / (1024 * 1024)).toFixed(1);
    const afterMB = (compressed.length / (1024 * 1024)).toFixed(1);
    console.log(`[compressVideo] ${beforeMB} MB → ${afterMB} MB`);

    return compressed;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {
      // cleanup is best-effort
    });
  }
}

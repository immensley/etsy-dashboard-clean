import { promises as fs } from "fs";
import path from "path";

const BASE_DIR = path.join(process.cwd(), ".cache", "mcpstore");

interface StoredPayload<T> {
  savedAt: number;
  data: T;
}

async function ensureDir() {
  await fs.mkdir(BASE_DIR, { recursive: true });
}

export async function writePersistentCache<T>(key: string, data: T): Promise<void> {
  try {
    await ensureDir();
    const payload: StoredPayload<T> = { savedAt: Date.now(), data };
    await fs.writeFile(path.join(BASE_DIR, `${encodeURIComponent(key)}.json`), JSON.stringify(payload), "utf8");
  } catch (error) {
    console.warn("Failed to persist cache", key, error);
  }
}

export async function readPersistentCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(BASE_DIR, `${encodeURIComponent(key)}.json`), "utf8");
    const payload = JSON.parse(raw) as StoredPayload<T>;
    return payload.data;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.warn("Failed to read persistent cache", key, error);
    }
    return null;
  }
}

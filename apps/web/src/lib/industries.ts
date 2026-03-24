import fs from "fs";
import path from "path";
import matter from "gray-matter";

const INDUSTRIES_DIR = path.join(process.cwd(), "content/industries");
const USE_CASES_DIR = path.join(process.cwd(), "content/use-cases");

export function getIndustryContent(slug: string): string | null {
  const filePath = path.join(INDUSTRIES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { content } = matter(raw);
    return content.trim();
  } catch {
    return null;
  }
}

export function getUseCaseContent(slug: string): string | null {
  const filePath = path.join(USE_CASES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { content } = matter(raw);
    return content.trim();
  } catch {
    return null;
  }
}

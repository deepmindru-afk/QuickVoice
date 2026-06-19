import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const DEFAULT_OG_IMAGE = "/og-image.png";

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  published: boolean;
  status?: string;
  author: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  ogImage: string;
  readTime: string;
  authorBio?: string;
  content: string;
}

function resolveOgImage(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_OG_IMAGE;

  const imagePath = value.trim();
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  if (!imagePath.startsWith("/")) return DEFAULT_OG_IMAGE;

  const publicPath = path.join(PUBLIC_DIR, imagePath.slice(1));
  return fs.existsSync(publicPath) ? imagePath : DEFAULT_OG_IMAGE;
}

function parseFile(filename: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data, content } = matter(raw);
    if (!data.slug) return null;
    return {
      slug: data.slug as string,
      title: data.title as string,
      date: data.date as string,
      draft: data.draft === true,
      published: data.published !== false,
      status: data.status as string | undefined,
      author: data.author as string,
      category: data.category as string,
      tags: (data.tags as string[]) || [],
      metaTitle: (data.metaTitle as string) || (data.title as string),
      metaDescription: data.metaDescription as string,
      canonical: data.canonical as string,
      ogImage: resolveOgImage(data.ogImage),
      readTime: (data.readTime as string) || "5 min",
      authorBio: (data.authorBio as string) || "",
      content,
    };
  } catch {
    return null;
  }
}

interface BlogQueryOptions {
  includeFuture?: boolean;
  now?: Date;
}

export function isPublishedPost(
  post: BlogPost,
  { includeFuture = false, now = new Date() }: BlogQueryOptions = {},
): boolean {
  if (post.draft || !post.published || post.status === "draft") return false;
  if (includeFuture) return true;

  const publishedAt = new Date(post.date).getTime();
  if (Number.isNaN(publishedAt)) return false;
  return publishedAt <= now.getTime();
}

export function getAllPosts(options: BlogQueryOptions = {}): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((f) => parseFile(f))
    .filter((p): p is BlogPost => p !== null)
    .filter((p) => isPublishedPost(p, options))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getPostBySlug(
  slug: string,
  options: BlogQueryOptions = { includeFuture: false },
): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  for (const filename of files) {
    const post = parseFile(filename);
    if (post?.slug === slug && isPublishedPost(post, options)) return post;
  }
  return null;
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  const cats = getAllPosts().map((p) => p.category);
  return Array.from(new Set(cats));
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(currentSlug);
  if (!current) return [];
  const all = getAllPosts().filter((p) => p.slug !== currentSlug);
  const sameCategory = all.filter((p) => p.category === current.category);
  const others = all.filter((p) => p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
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

function parseFile(filename: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data, content } = matter(raw);
    if (!data.slug) return null;
    return {
      slug: data.slug as string,
      title: data.title as string,
      date: data.date as string,
      author: data.author as string,
      category: data.category as string,
      tags: (data.tags as string[]) || [],
      metaTitle: (data.metaTitle as string) || (data.title as string),
      metaDescription: data.metaDescription as string,
      canonical: data.canonical as string,
      ogImage: (data.ogImage as string) || "",
      readTime: (data.readTime as string) || "5 min",
      authorBio: (data.authorBio as string) || "",
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((f) => parseFile(f))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  for (const filename of files) {
    const post = parseFile(filename);
    if (post?.slug === slug) return post;
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

function randomString(length = 4) {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  export function generateSlug(text: string): string {
    const baseSlug = text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    return `${baseSlug}-${randomString(4)}`;
  }
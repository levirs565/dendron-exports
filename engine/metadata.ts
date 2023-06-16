import { ParsedPath } from "std/path/mod.ts";
import { WikiLink } from "./wikilink.ts";
import { Note } from "./note.ts";

export interface NoteMetadata {
  title: string;
  id: string;
  frontmatter: Record<string, unknown>;
  links: WikiLink[];
  backlinks: Note[];
}

export function createBlankMetadata(): NoteMetadata {
  return {
    title: "",
    id: "",
    frontmatter: {},
    links: [],
    backlinks: [],
  };
}

export function getNoteTitle(note: Note, metadata: NoteMetadata): string {
  if (metadata?.frontmatter?.title) return String(metadata.frontmatter.title);

  const nonEmpty = findNonEmpty(note);
  if (!nonEmpty) return "";

  const titlecase = isUseTitleCase(nonEmpty.filePath!);
  return generateNoteTitle(note.originalName, titlecase);
}

function findNonEmpty(note: Note): Note | null {
  if (note.filePath) return note;

  for (const child of note.children) {
    const fromChild = findNonEmpty(child);
    if (fromChild) return fromChild;
  }
  return null;
}

/**
 * Check whetever generated note title must be title case or not
 * @param path file path
 */

function isUseTitleCase(path: ParsedPath) {
  return path.name.toLowerCase() === path.name;
}

function generateNoteTitle(originalName: string, titlecase: boolean) {
  if (!titlecase) return originalName;
  return originalName
    .split("-")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
}

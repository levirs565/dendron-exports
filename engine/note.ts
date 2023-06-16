import { ParsedPath } from "std/path/mod.ts";

export interface NoteMetadata {
  title?: string;
}

export class Note {
  name: string;
  children: Note[] = [];
  filePath?: ParsedPath;
  parent?: Note;
  title = "";

  constructor(private originalName: string, private titlecase: boolean) {
    this.name = originalName.toLowerCase();
    this.syncMetadata(undefined);
  }

  appendChild(note: Note) {
    if (note.parent) throw Error("Note has parent");
    note.parent = this;
    this.children.push(note);
  }

  removeChildren(note: Note) {
    note.parent = undefined;
    const index = this.children.indexOf(note);
    this.children.splice(index, 1);
  }

  findChildren(name: string) {
    const lower = name.toLowerCase();
    return this.children.find((note) => note.name == lower);
  }

  sortChildren(rescursive: boolean) {
    this.children.sort((a, b) => a.name.localeCompare(b.name));
    if (rescursive)
      this.children.forEach((child) => child.sortChildren(rescursive));
  }

  getPath() {
    const component: string[] = [];
    const notes = this.getPathNotes();

    if (notes.length === 1) return notes[0].name;

    for (const note of notes) {
      if (!note.parent && note.name === "root") continue;
      component.push(note.name);
    }

    return component.join(".");
  }

  getPathNotes() {
    const notes: Note[] = [];
    // deno-lint-ignore no-this-alias
    let current: Note | undefined = this;
    while (current) {
      notes.unshift(current);
      current = current.parent;
    }
    return notes;
  }

  syncMetadata(metadata: NoteMetadata | undefined) {
    this.title =
      metadata?.title ??
      Note.generateNoteTitle(this.originalName, this.titlecase);
  }

  static generateNoteTitle(originalName: string, titlecase: boolean) {
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
}

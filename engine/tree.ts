import { ParsedPath } from "std/path/mod.ts";
import { Note } from "./note.ts";

export class NoteTree {
  root: Note = new Note("root", true);

  sort() {
    this.root.sortChildren(true);
  }

  public static getPathFromFilePath(path: ParsedPath) {
    return path.name.split(".");
  }

  private static isRootPath(path: string[]) {
    return path.length === 1 && path[0] === "root";
  }

  /**
   * Check whetever generated note title must be title case or not
   * @param path file path
   */

  private static isUseTitleCase(path: ParsedPath) {
    return path.name.toLowerCase() === path.name;
  }

  add(filePath: ParsedPath, sort = false) {
    const titlecase = NoteTree.isUseTitleCase(filePath);
    const path = NoteTree.getPathFromFilePath(filePath);

    let currentNote: Note = this.root;

    if (!NoteTree.isRootPath(path))
      for (const name of path) {
        let note: Note | undefined = currentNote.findChildren(name);

        if (!note) {
          note = new Note(name, titlecase);
          currentNote.appendChild(note);
          if (sort) currentNote.sortChildren(false);
        }

        currentNote = note;
      }

    currentNote.filePath = filePath;
    return currentNote;
  }

  get(filePath: ParsedPath) {
    const path = NoteTree.getPathFromFilePath(filePath);

    if (NoteTree.isRootPath(path)) return this.root;

    let currentNote: Note = this.root;

    for (const name of path) {
      const found = currentNote.findChildren(name);
      if (!found) return undefined;
      currentNote = found;
    }

    return currentNote;
  }

  delete(filePath: ParsedPath) {
    const note = this.get(filePath);
    if (!note) return;

    note.filePath = undefined;
    if (note.children.length == 0) {
      let currentNote: Note | undefined = note;
      while (
        currentNote &&
        currentNote.parent &&
        !currentNote.filePath &&
        currentNote.children.length == 0
      ) {
        const parent: Note | undefined = currentNote.parent;
        parent.removeChildren(currentNote);
        currentNote = parent;
      }
    }

    return note;
  }

  private static *flattenInternal(root: Note): Generator<Note> {
    yield root;
    for (const child of root.children) yield* this.flattenInternal(child);
  }

  flatten() {
    return Array.from(NoteTree.flattenInternal(this.root));
  }
}

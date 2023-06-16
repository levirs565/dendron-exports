import { Note } from "./note.ts";

export class NoteTree {
  root: Note = new Note("root", true);

  sort() {
    this.root.sortChildren(true);
  }

  public static getPathFromFileName(name: string) {
    return name.split(".");
  }

  private static isRootPath(path: string[]) {
    return path.length === 1 && path[0] === "root";
  }

  /**
   * Check whetever generated note title must be title case or not
   * @param filename file base name
   */

  private static isUseTitleCase(filename: string) {
    return filename.toLowerCase() === filename;
  }

  addFile(filename: string, sort = false) {
    const titlecase = NoteTree.isUseTitleCase(filename);
    const path = NoteTree.getPathFromFileName(filename);

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

    currentNote.filename = filename;
    return currentNote;
  }

  getFromFileName(name: string) {
    const path = NoteTree.getPathFromFileName(name);

    if (NoteTree.isRootPath(path)) return this.root;

    let currentNote: Note = this.root;

    for (const name of path) {
      const found = currentNote.findChildren(name);
      if (!found) return undefined;
      currentNote = found;
    }

    return currentNote;
  }

  deleteByFileName(name: string) {
    const note = this.getFromFileName(name);
    if (!note) return;

    note.filename = undefined;
    if (note.children.length == 0) {
      let currentNote: Note | undefined = note;
      while (
        currentNote &&
        currentNote.parent &&
        !currentNote.filename &&
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

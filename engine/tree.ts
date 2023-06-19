import { Note } from "./note.ts";

export class NoteTree {
  root: Note = new Note("root");

  sort() {
    this.root.sortChildren(true);
  }

  public static getPathSegment(path: string) {
    return path.split(".");
  }

  private static isRootPath(path: string[]) {
    return path.length === 1 && path[0] === "root";
  }

  add(path: string, sort = false) {
    const pathSegment = NoteTree.getPathSegment(path);

    let currentNote: Note = this.root;

    if (!NoteTree.isRootPath(pathSegment))
      for (const name of pathSegment) {
        let note: Note | undefined = currentNote.findChildren(name);

        if (!note) {
          note = new Note(name);
          currentNote.appendChild(note);
          if (sort) currentNote.sortChildren(false);
        }

        currentNote = note;
      }

    return currentNote;
  }

  get(path: string) {
    const pathSegment = NoteTree.getPathSegment(path);

    if (NoteTree.isRootPath(pathSegment)) return this.root;

    let currentNote: Note = this.root;

    for (const name of pathSegment) {
      const found = currentNote.findChildren(name);
      if (!found) return undefined;
      currentNote = found;
    }

    return currentNote;
  }

  delete(path: string) {
    const note = this.get(path);
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

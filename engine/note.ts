import { ParsedPath } from "std/path/mod.ts";
import { createBlankMetadata } from "./metadata.ts";
import { Event } from "micromark-util-types";

export class Note {
  name: string;
  children: Note[] = [];
  parent?: Note;

  filePath?: ParsedPath;
  content?: string;
  metadata = createBlankMetadata();
  document: Event[] = [];

  constructor(public originalName: string) {
    this.name = originalName.toLowerCase();
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
}

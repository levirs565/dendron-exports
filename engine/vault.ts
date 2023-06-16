import { NoteTree } from "./tree.ts";
import { extname, join, parse } from "std/path/mod.ts";

export class Vault {
  tree = new NoteTree();

  constructor(public folder: string) {}

  isNote(name: string) {
    return extname(name) === ".md";
  }

  async index() {
    for await (const file of Deno.readDir(this.folder)) {
      if (!file.isFile || !this.isNote(file.name)) continue;
      const path = parse(join(this.folder, file.name));
      const note = this.tree.add(path.name, false);
      note.filePath = path;
    }

    this.tree.sort();
  }

  buildBacklinks() {
    for (const note of this.tree.flatten()) {
      for (const link of note.metadata.links) {
        const target = this.tree.get(link.target);
        if (!target) continue;

        target.metadata.backlinks.push(note);
      }
    }
  }
}

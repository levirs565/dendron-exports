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
      const path = join(this.folder, file.name);
      this.tree.add(parse(path), false);
    }

    this.tree.sort();
  }
}

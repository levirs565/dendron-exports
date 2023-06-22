import { LumeNjkRenderer, Options } from "./mod.ts";

export const options: Options = {
  baseDir: "/home/levirs565/GitHub/notes",
  vaultPath: "vault",
  vaultName: "vault",
  noteDest: ".exports",
  notePathBuilder: (note) =>
    note.getPath() === "root" ? "index" : "notes/" + note.metadata.id,
  noteRenderer: new LumeNjkRenderer(),
};

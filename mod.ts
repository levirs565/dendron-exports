import { Note } from "./engine/note.ts";
import { Renderer } from "./renderer/abstract.ts";

export { Note } from "./engine/note.ts";

export * from "./renderer/abstract.ts";
export * from "./renderer/lume-njk.ts";

export type NotePathBuilder = (note: Note) => string;

export interface Options {
  baseDir: string;
  vaultPath: string;
  vaultName: string;

  noteDest: string;
  noteRenderer: Renderer;
  notePathBuilder: NotePathBuilder;
}

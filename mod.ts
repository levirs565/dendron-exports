import { Note } from "./engine/note.ts";
import { Renderer } from "./renderer/abstract.ts";

export { Note } from "./engine/note.ts";

export * from "./renderer/abstract.ts";
export * from "./renderer/lume-njk.ts";

export type NotePathBuilder = (note: Note) => string;

export interface Options {
  /**
   * Directory that all operation is belong to.
   */
  baseDir: string;

  /**
   * Vault path to export
   * Relative to baseDir
   */
  vaultPath: string;

  /**
   * Vault name to export
   * This also used to generate note id when id is not specified.
   */
  vaultName: string;

  /**
   * Note and assets export desination
   * Relative to baseDir
   */
  noteDest: string;

  /**
   * Renderer to render single note.
   */
  noteRenderer: Renderer;

  /**
   * Function that map note into destination path.
   * The path will used to resolve link and export path.
   * The path must not start with / and end with /
   * Note export path will relative to noteDest
   */
  notePathBuilder: NotePathBuilder;
}

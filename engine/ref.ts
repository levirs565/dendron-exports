import { Note } from "./note.ts";
import { Vault } from "./vault.ts";

export interface MaybeNoteRef {
  vaultName: string;
  vault?: Vault;
  note?: Note;
  path: string;
  subpath?: RefSubpath;
}

export type RefAnchor =
  | {
      type: "begin";
    }
  | {
      type: "end";
    }
  | {
      type: "wildcard";
    }
  | {
      type: "block";
      name: string;
    }
  | {
      type: "header";
      name: string;
      lineOffset: number;
    };

export interface RefSubpath {
  text: string;
  start?: RefAnchor;
  end?: RefAnchor;
}

export function parseRefAnchor(pos: string): RefAnchor {
  if (pos === "*") {
    return {
      type: "wildcard",
    };
  } else if (pos === "^begin") {
    return {
      type: "begin",
    };
  } else if (pos === "^end") {
    return {
      type: "end",
    };
  } else if (pos.startsWith("^")) {
    return {
      type: "block",
      name: pos.slice(1),
    };
  } else {
    const [name, lineOffsetStr] = pos.split(",", 2);
    return {
      type: "header",
      name,
      lineOffset: parseInt(lineOffsetStr ?? "0"),
    };
  }
}

export function serializeRefAnchor(anchor: RefAnchor): string {
  if (anchor.type === "begin") return "^begin";
  else if (anchor.type === "end") return "^end";
  else if (anchor.type === "wildcard") return "*";
  else if (anchor.type === "block") return `^${anchor.name}`;
  else if (anchor.type === "header") return `${anchor.name}`;
  return "";
}

export function anchorToLinkSubpath(anchor: RefAnchor): string {
  if (anchor.type === "header") return `${anchor.name}`;
  else if (anchor.type === "block") return `^${anchor.name}`;
  return "";
}

export function parseRefSubpath(str: string): RefSubpath {
  const [startStr, endStr] = str.split(":#", 2);
  return {
    text: str,
    start: startStr.length > 0 ? parseRefAnchor(startStr) : undefined,
    end: endStr ? parseRefAnchor(endStr) : undefined,
  };
}

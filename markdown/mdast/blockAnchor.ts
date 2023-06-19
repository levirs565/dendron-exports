import { mdast, micromark } from "../../deps/mod.ts";

export interface BlockAnchorNode extends mdast.Literal {
  type: "blockAnchor";
}

function enterBlockAnchor(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  this.enter(
    {
      type: "blockAnchor",
      value: "",
      // deno-lint-ignore no-explicit-any
    } as BlockAnchorNode as any,
    token
  );
}

function exitBlockAnchorData(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  const node = this.stack[this.stack.length - 1] as unknown as BlockAnchorNode;
  node.value = this.sliceSerialize(token);
}

function exitBlockAnchor(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  this.exit(token);
}

export const blockAnchorFromMarkdown: mdast.FromMarkdown.Extension = {
  enter: {
    blockAnchor: enterBlockAnchor,
  },
  exit: {
    blockAnchorData: exitBlockAnchorData,
    blockAnchor: exitBlockAnchor,
  },
};

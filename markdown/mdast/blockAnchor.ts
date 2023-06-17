import { CompileContext, Extension } from "mdast-util-from-markdown";
import { Token } from "micromark-util-types";
import { Literal } from "mdast";

export interface BlockAnchorNode extends Literal {
  type: "blockAnchor";
}

function enterBlockAnchor(this: CompileContext, token: Token): void {
  this.enter(
    {
      type: "blockAnchor",
      value: "",
      // deno-lint-ignore no-explicit-any
    } as BlockAnchorNode as any,
    token
  );
}

function exitBlockAnchorData(this: CompileContext, token: Token): void {
  const node = this.stack[this.stack.length - 1] as unknown as BlockAnchorNode;
  node.value = this.sliceSerialize(token);
}

function exitBlockAnchor(this: CompileContext, token: Token): void {
  this.exit(token);
}

export const blockAnchorFromMarkdown: Extension = {
  enter: {
    blockAnchor: enterBlockAnchor,
  },
  exit: {
    blockAnchorData: exitBlockAnchorData,
    blockAnchor: exitBlockAnchor,
  },
};

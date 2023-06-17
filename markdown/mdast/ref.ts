import { CompileContext, Extension } from "mdast-util-from-markdown";
import { Token } from "micromark-util-types";
import { Node } from "unist";

export interface RefNode extends Node {
  type: "ref";
  target: string;
}

function enterRef(this: CompileContext, token: Token): void {
  this.enter(
    {
      type: "ref",
      target: "",
      // deno-lint-ignore no-explicit-any
    } as RefNode as any,
    token
  );
}

function enterRefData(this: CompileContext, token: Token): void {
  const node = this.stack[this.stack.length - 1] as unknown as RefNode;
  node.target = this.sliceSerialize(token);
}

function exitRef(this: CompileContext, token: Token): void {
  this.exit(token);
}

export const refFromMarkdown: Extension = {
  enter: {
    ref: enterRef,
  },
  exit: {
    refData: enterRefData,
    ref: exitRef,
  },
};

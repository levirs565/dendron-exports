import { unist, micromark, mdast } from "../../deps/mod.ts";

export interface RefNode extends unist.Node {
  type: "ref";
  target: string;
}

function enterRef(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  this.enter(
    {
      type: "ref",
      target: "",
      // deno-lint-ignore no-explicit-any
    } as RefNode as any,
    token
  );
}

function enterRefData(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  const node = this.stack[this.stack.length - 1] as unknown as RefNode;
  node.target = this.sliceSerialize(token);
}

function exitRef(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  this.exit(token);
}

export const refFromMarkdown: mdast.FromMarkdown.Extension = {
  enter: {
    ref: enterRef,
  },
  exit: {
    refData: enterRefData,
    ref: exitRef,
  },
};

import { mdast, micromark, unist } from "../../deps/mod.ts";

export interface WikiLinkNode extends unist.Node {
  type: "wikiLink";
  value: string[];
  target: string;
  title?: string;
}

function enterWikiLink(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  this.enter(
    {
      type: "wikiLink",
      value: [],
      target: "",
      // deno-lint-ignore no-explicit-any
    } as WikiLinkNode as any,
    token
  );
}

function exitWikiLinkData(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  const node = this.stack[this.stack.length - 1] as unknown as WikiLinkNode;
  node.value.push(this.sliceSerialize(token));
}

function exitWikiLink(
  this: mdast.FromMarkdown.CompileContext,
  token: micromark.Token
): void {
  const node = this.exit(token) as unknown as WikiLinkNode;
  if (node.value.length == 2) {
    [node.title, node.target] = node.value;
  } else {
    [node.target] = node.value;
  }
}

export const wikiLinkFromMarkdown: mdast.FromMarkdown.Extension = {
  enter: {
    wikiLink: enterWikiLink,
  },
  exit: {
    wikiLinkData: exitWikiLinkData,
    wikiLink: exitWikiLink,
  },
};

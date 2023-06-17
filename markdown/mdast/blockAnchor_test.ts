import { assertEquals } from "std/testing/asserts.ts";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { BlockAnchorNode, blockAnchorFromMarkdown } from "./blockAnchor.ts";
import { blockAnchorMicromark } from "../micromark/blockAnchor.ts";

function collectWikiLink(md: string) {
  const ast = fromMarkdown(md, "utf8", {
    extensions: [blockAnchorMicromark],
    mdastExtensions: [blockAnchorFromMarkdown],
  });
  const nodes: string[] = [];
  visit(ast, "blockAnchor", (node: BlockAnchorNode) => {
    nodes.push(node.value);
  });
  return nodes;
}

Deno.test("can parse ref", () => {
  assertEquals(collectWikiLink("begin test ^block-anchor"), ["block-anchor"]);
});

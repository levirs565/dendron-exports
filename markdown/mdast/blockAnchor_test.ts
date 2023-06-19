import { asserts, mdast, unist } from "../../deps/mod.ts";
import { BlockAnchorNode, blockAnchorFromMarkdown } from "./blockAnchor.ts";
import { blockAnchorMicromark } from "../micromark/blockAnchor.ts";

function collectWikiLink(md: string) {
  const ast = mdast.fromMarkdown(md, "utf8", {
    extensions: [blockAnchorMicromark],
    mdastExtensions: [blockAnchorFromMarkdown],
  });
  const nodes: string[] = [];
  unist.visit(ast, "blockAnchor", (node: BlockAnchorNode) => {
    nodes.push(node.value);
  });
  return nodes;
}

Deno.test("can parse ref", () => {
  asserts.assertEquals(collectWikiLink("begin test ^block-anchor"), [
    "block-anchor",
  ]);
});

import { assertEquals } from "std/testing/asserts.ts";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { refMicromark } from "../micromark/ref.ts";
import { RefNode, refFromMarkdown } from "./ref.ts";

function collectWikiLink(md: string) {
  const ast = fromMarkdown(md, "utf8", {
    extensions: [refMicromark],
    mdastExtensions: [refFromMarkdown],
  });
  const nodes: string[] = [];
  visit(ast, "ref", (node: RefNode) => {
    nodes.push(node.target);
  });
  return nodes;
}

Deno.test("can parse ref", () => {
  assertEquals(collectWikiLink("![[Ref Target]]"), ["Ref Target"]);
});

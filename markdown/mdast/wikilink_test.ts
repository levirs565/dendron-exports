import { assertEquals } from "std/testing/asserts.ts";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { WikiLinkNode, wikiLinkFromMarkdown } from "./wikilink.ts";
import { wikiLinkMicromark } from "../micromark/wikilink.ts";

function collectWikiLink(md: string) {
  const ast = fromMarkdown(md, "utf8", {
    extensions: [wikiLinkMicromark],
    mdastExtensions: [wikiLinkFromMarkdown],
  });
  const nodes: (string | undefined)[][] = [];
  visit(ast, "wikiLink", (node: WikiLinkNode) => {
    nodes.push([node.target, node.title]);
  });
  return nodes;
}

Deno.test("can parse wikilink without title", () => {
  assertEquals(collectWikiLink("[[Wiki Link]]"), [["Wiki Link", undefined]]);
});

Deno.test("parse wikilink with title", () => {
  assertEquals(collectWikiLink("[[Link Title|Wiki Link]]"), [
    ["Wiki Link", "Link Title"],
  ]);
});

import { Event } from "micromark-util-types";
import { parse } from "micromark/lib/parse.js";
import { preprocess } from "micromark/lib/preprocess.js";
import { postprocess } from "micromark/lib/postprocess.js";
import { assertEquals } from "std/testing/asserts.ts";
import { WikiLinkHandler, wikiLinkExtension } from "./wikilink.ts";
import { WikiLink } from "../engine/wikilink.ts";
import { parseMarkdown } from "./utils.ts";

type SimplifiedEvent = [Event[0], Event[1]["type"], string];

function micromarkEvents(md: string): SimplifiedEvent[] {
  return postprocess(
    parse({
      extensions: [wikiLinkExtension],
    })
      .document()
      .write(preprocess()(md, "utf8", true))
  ).map((event) => {
    return [event[0], event[1].type, event[2].sliceSerialize(event[1])];
  });
}

Deno.test("parse wikilink without alias", () => {
  const content = "[[Wiki Link]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "wikiLink", content],
    ["enter", "wikiLinkMarker", "[["],
    ["exit", "wikiLinkMarker", "[["],
    ["enter", "wikiLinkData", "Wiki Link"],
    ["exit", "wikiLinkData", "Wiki Link"],
    ["enter", "wikiLinkMarker", "]]"],
    ["exit", "wikiLinkMarker", "]]"],
    ["exit", "wikiLink", content],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("parse wikilink with title", () => {
  const content = "[[Link Title|Wiki Link]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "wikiLink", content],
    ["enter", "wikiLinkMarker", "[["],
    ["exit", "wikiLinkMarker", "[["],
    ["enter", "wikiLinkData", "Link Title"],
    ["exit", "wikiLinkData", "Link Title"],
    ["enter", "wikiLinkTitlePipe", "|"],
    ["exit", "wikiLinkTitlePipe", "|"],
    ["enter", "wikiLinkData", "Wiki Link"],
    ["exit", "wikiLinkData", "Wiki Link"],
    ["enter", "wikiLinkMarker", "]]"],
    ["exit", "wikiLinkMarker", "]]"],
    ["exit", "wikiLink", content],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle open wikilink", () => {
  const content = "t[[\nt";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handles open wiki links at end of file", () => {
  const content = "t [[";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t "],
    ["exit", "data", "t "],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});
Deno.test("handles open wiki links with partial data", () => {
  const content = "t [[tt\nt";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "t "],
    ["exit", "data", "t "],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "tt"],
    ["exit", "data", "tt"],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handles open wiki links with partial alias", () => {
  const content = "[[t|\nt";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "t|"],
    ["exit", "data", "t|"],
    ["enter", "lineEnding", "\n"],
    ["exit", "lineEnding", "\n"],
    ["enter", "data", "t"],
    ["exit", "data", "t"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle invalid wikilink with blank data", () => {
  const content = "[[]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "]]"],
    ["exit", "data", "]]"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle invalid wikilink with blank before pipe", () => {
  const content = "[[|Test]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "|Test]]"],
    ["exit", "data", "|Test]]"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

Deno.test("handle invalid wikilink with blank after pipe", () => {
  const content = "[[Test|]]";
  assertEquals(micromarkEvents(content), [
    ["enter", "content", content],
    ["enter", "paragraph", content],

    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "["],
    ["exit", "data", "["],
    ["enter", "data", "Test|]]"],
    ["exit", "data", "Test|]]"],
    ["exit", "paragraph", content],
    ["exit", "content", content],
  ] as SimplifiedEvent[]);
});

function collectWikiLink(md: string): WikiLink[] {
  const events = parseMarkdown(
    {
      extensions: [wikiLinkExtension],
    },
    md
  );
  const handler = new WikiLinkHandler();
  const links: WikiLink[] = [];

  for (const event of events) {
    if (handler.on(event) && handler.link) {
      links.push(handler.link!);
    }
  }
  return links;
}

Deno.test("handler can parse wikilink without title", () => {
  assertEquals(collectWikiLink("[[Wiki Link]]"), [
    {
      target: "Wiki Link",
    },
  ]);
});

Deno.test("handler can parse wikilink with title", () => {
  assertEquals(collectWikiLink("[[Link Title|Wiki Link]]"), [
    {
      target: "Wiki Link",
      title: "Link Title",
    },
  ]);
});

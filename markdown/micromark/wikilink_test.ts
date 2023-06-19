import { asserts } from "../../deps/mod.ts";
import { SimplifiedEvent, parseAsSimplifiedEvents } from "./utils.ts";
import { wikiLinkMicromark } from "./wikilink.ts";

function micromarkEvents(md: string) {
  return parseAsSimplifiedEvents({ extensions: [wikiLinkMicromark] }, md);
}

Deno.test("parse wikilink without alias", () => {
  const content = "[[Wiki Link]]";
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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
  asserts.assertEquals(micromarkEvents(content), [
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

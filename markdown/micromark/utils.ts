import { Code, ParseOptions, Event } from "micromark-util-types";
import { parse } from "micromark/lib/parse.js";
import { preprocess } from "micromark/lib/preprocess.js";
import { postprocess } from "micromark/lib/postprocess.js";

export const codes = {
  horizontalTab: -2,
  virtualSpace: -1,
  nul: 0,
  eof: null,
  space: 32,
};

export function markdownLineEndingOrSpace(code: Code) {
  return code == codes.eof || code < codes.nul || code === codes.space;
}

export function markdownLineEnding(code: Code) {
  return code && code < codes.horizontalTab;
}

export type SimplifiedEvent = [Event[0], Event[1]["type"], string];

export function parseMarkdown(options: ParseOptions, md: string) {
  return postprocess(
    parse(options).document().write(preprocess()(md, "utf8", true))
  );
}

export function parseAsSimplifiedEvents(
  options: ParseOptions,
  md: string
): SimplifiedEvent[] {
  return parseMarkdown(options, md).map((event) => {
    return [event[0], event[1].type, event[2].sliceSerialize(event[1])];
  });
}

import { micromark } from "../../deps/mod.ts";

export const codes = {
  horizontalTab: -2,
  virtualSpace: -1,
  nul: 0,
  eof: null,
  space: 32,
};

export function markdownLineEndingOrSpace(code: micromark.Code) {
  return code == codes.eof || code < codes.nul || code === codes.space;
}

export function markdownLineEnding(code: micromark.Code) {
  return code && code < codes.horizontalTab;
}

export type SimplifiedEvent = [
  micromark.Event[0],
  micromark.Event[1]["type"],
  string
];

export function parseMarkdown(options: micromark.ParseOptions, md: string) {
  return micromark.postprocess(
    micromark
      .parse(options)
      .document()
      .write(micromark.preprocess()(md, "utf8", true))
  );
}

export function parseAsSimplifiedEvents(
  options: micromark.ParseOptions,
  md: string
): SimplifiedEvent[] {
  return parseMarkdown(options, md).map((event) => {
    return [event[0], event[1].type, event[2].sliceSerialize(event[1])];
  });
}

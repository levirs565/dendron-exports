import { micromark } from "../../deps/mod.ts";
import {
  codes,
  markdownLineEnding,
  markdownLineEndingOrSpace,
} from "./utils.ts";

const startMarker = "[[";
const endMarker = "]]";
const aliasPipe = "|";

function wikiLinkTokenize(
  effects: micromark.Effects,
  ok: micromark.State,
  nok: micromark.State
): micromark.State {
  let startMarkerCursor = 0;
  let endMarkerCursor = 0;
  let dataLength = 0;

  return start;

  function start(code: micromark.Code): micromark.State | void {
    effects.enter("wikiLink");
    effects.enter("wikiLinkMarker");

    return consumerStartMarker(code);
  }

  function consumerStartMarker(code: micromark.Code): micromark.State | void {
    if (code !== startMarker.charCodeAt(startMarkerCursor)) {
      return nok(code);
    }

    effects.consume(code);
    startMarkerCursor++;

    if (startMarkerCursor === startMarker.length) {
      effects.exit("wikiLinkMarker");
      effects.enter("wikiLinkData");
      return consumeData;
    }
    return consumerStartMarker;
  }

  function consumeData(code: micromark.Code): micromark.State | void {
    if (code === endMarker.charCodeAt(0)) {
      if (dataLength == 0) return nok(code);
      effects.exit("wikiLinkData");
      effects.enter("wikiLinkMarker");
      return consumeEndMarker(code);
    }

    if (code === aliasPipe.charCodeAt(0)) {
      if (dataLength == 0) return nok(code);
      effects.exit("wikiLinkData");
      effects.enter("wikiLinkTitlePipe");
      return consumeAliasPipe(code);
    }

    if (markdownLineEnding(code) || code === codes.eof) {
      return nok(code);
    }

    if (!markdownLineEndingOrSpace(code)) {
      dataLength++;
    }

    effects.consume(code);
    return consumeData;
  }

  function consumeAliasPipe(code: micromark.Code): micromark.State | void {
    dataLength = 0;
    effects.consume(code);
    effects.exit("wikiLinkTitlePipe");
    effects.enter("wikiLinkData");
    return consumeData;
  }

  function consumeEndMarker(code: micromark.Code): micromark.State | void {
    if (code !== endMarker.charCodeAt(endMarkerCursor)) {
      return nok(code);
    }

    effects.consume(code);
    endMarkerCursor++;

    if (endMarkerCursor === endMarker.length) {
      effects.exit("wikiLinkMarker");
      effects.exit("wikiLink");
      return ok;
    }
    return consumeEndMarker;
  }
}

export const wikiLinkMicromark: micromark.Extension = {
  text: {
    91: {
      name: "wikiLink",
      tokenize: wikiLinkTokenize,
    },
  },
};

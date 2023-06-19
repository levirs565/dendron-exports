import { micromark } from "../../deps/mod.ts";
import {
  codes,
  markdownLineEnding,
  markdownLineEndingOrSpace,
} from "./utils.ts";

const startMarker = "![[";
const endMarker = "]]";

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
    effects.enter("ref");
    effects.enter("refMarker");

    return consumerStartMarker(code);
  }

  function consumerStartMarker(code: micromark.Code): micromark.State | void {
    if (code !== startMarker.charCodeAt(startMarkerCursor)) {
      return nok(code);
    }

    effects.consume(code);
    startMarkerCursor++;

    if (startMarkerCursor === startMarker.length) {
      effects.exit("refMarker");
      effects.enter("refData");
      return consumeData;
    }
    return consumerStartMarker;
  }

  function consumeData(code: micromark.Code): micromark.State | void {
    if (code === endMarker.charCodeAt(0)) {
      if (dataLength == 0) return nok(code);
      effects.exit("refData");
      effects.enter("refMarker");
      return consumeEndMarker(code);
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

  function consumeEndMarker(code: micromark.Code): micromark.State | void {
    if (code !== endMarker.charCodeAt(endMarkerCursor)) {
      return nok(code);
    }

    effects.consume(code);
    endMarkerCursor++;

    if (endMarkerCursor === endMarker.length) {
      effects.exit("refMarker");
      effects.exit("ref");
      return ok;
    }
    return consumeEndMarker;
  }
}

export const refMicromark: micromark.Extension = {
  text: {
    [startMarker.charCodeAt(0)]: {
      name: "ref",
      tokenize: wikiLinkTokenize,
    },
  },
};

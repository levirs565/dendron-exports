import { Code, Effects, Extension, State, Event } from "micromark-util-types";
import {
  codes,
  markdownLineEnding,
  markdownLineEndingOrSpace,
} from "./utils.ts";
import { WikiLink } from "../engine/wikilink.ts";

declare module "micromark-util-types" {
  export interface TokenTypeMap {
    wikiLink: "wikiLink";
    wikiLinkMarker: "wikiLinkMarker";
    wikiLinkData: "wikiLinkData";
    wikiLinkTitlePipe: "wikiLinkTitlePipe";
  }
}

const startMarker = "[[";
const endMarker = "]]";
const aliasPipe = "|";

function wikiLinkTokenize(effects: Effects, ok: State, nok: State): State {
  let startMarkerCursor = 0;
  let endMarkerCursor = 0;
  let dataLength = 0;

  return start;

  function start(code: Code): State {
    effects.enter("wikiLink");
    effects.enter("wikiLinkMarker");

    return consumerStartMarker(code);
  }

  function consumerStartMarker(code: Code): State {
    if (code !== startMarker.charCodeAt(startMarkerCursor)) {
      return nok(code) as State;
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

  function consumeData(code: Code): State {
    if (code === endMarker.charCodeAt(0)) {
      if (dataLength == 0) return nok(code) as State;
      effects.exit("wikiLinkData");
      effects.enter("wikiLinkMarker");
      return consumeEndMarker(code);
    }

    if (code === aliasPipe.charCodeAt(0)) {
      if (dataLength == 0) return nok(code) as State;
      effects.exit("wikiLinkData");
      effects.enter("wikiLinkTitlePipe");
      return consumeAliasPipe(code);
    }

    if (markdownLineEnding(code) || code === codes.eof) {
      return nok(code) as State;
    }

    if (!markdownLineEndingOrSpace(code)) {
      dataLength++;
    }

    effects.consume(code);
    return consumeData;
  }

  function consumeAliasPipe(code: Code): State {
    dataLength = 0;
    effects.consume(code);
    effects.exit("wikiLinkTitlePipe");
    effects.enter("wikiLinkData");
    return consumeData;
  }

  function consumeEndMarker(code: Code): State {
    if (code !== endMarker.charCodeAt(endMarkerCursor)) {
      return nok(code) as State;
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

export const wikiLinkExtension: Extension = {
  text: {
    91: {
      name: "wikiLink",
      tokenize: wikiLinkTokenize,
    },
  },
};

export class WikiLinkHandler {
  link?: WikiLink;
  datas: string[] = [];
  inWikiLink = false;

  on(event: Event): boolean {
    if (
      !this.inWikiLink &&
      event[0] === "enter" &&
      event[1].type === "wikiLink"
    ) {
      this.link = undefined;
      this.inWikiLink = true;
      return true;
    } else if (this.inWikiLink) {
      if (event[1].type === "wikiLink" && event[0] === "exit") {
        if (this.datas.length == 2) {
          this.link = {
            title: this.datas[0],
            target: this.datas[1],
          };
        } else {
          this.link = {
            target: this.datas[0],
          };
        }

        this.datas = [];
        this.inWikiLink = false;
      } else if (event[1].type === "wikiLinkData" && event[0] === "enter") {
        this.datas.push(event[2].sliceSerialize(event[1]));
      }

      return true;
    }

    return false;
  }
}

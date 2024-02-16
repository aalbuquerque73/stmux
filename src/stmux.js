#!/usr/bin/env node
/*!
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2023 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import stmuxInfo       from "./stmux-0-info.js";
import stmuxOptions    from "./stmux-1-options.js";
import stmuxParser     from "./stmux-2-parser.js";
import stmuxScreen     from "./stmux-3-screen.js";
import stmuxTitle      from "./stmux-4-title.js";
import stmuxTerminal   from "./stmux-5-terminal.js";
import stmuxBorder     from "./stmux-6-border.js";
import stmuxHelp       from "./stmux-7-help.js";
import stmuxErrors     from "./stmux-8-errors.js";
import stmuxKeys       from "./stmux-9-keys.js";
import stmuxMenus      from "./stmux-10-menus.js";
import stmuxEmitter    from "./stmux-11-emitter.js";

const Base = [
    stmuxBorder,
    stmuxEmitter,
    stmuxErrors,
    stmuxHelp,
    stmuxInfo,
    stmuxKeys,
    stmuxMenus,
    stmuxOptions,
    stmuxParser,
    stmuxScreen,
    stmuxTerminal,
    stmuxTitle,
 ].reduce(
    (base, child) => child(base),
    Object
);
export class STMUX extends Base {
    main (argv) {
        this.parseOptions(argv);
        this.parseSpec();
        this.establishEmitter();
        this.establishScreen();
        this.provisionInitially();
        this.establishHelp();
        this.establishMenus();
        this.handleErrors();
        this.handleKeys();
        this.renderScreen();
    }
    fatal (msg) {
        this.screen?.destroy();
        process.stderr.write(`${this.my.name}: ERROR: ${msg}\n`);
        process.exit(1);
    }
    terminate () {
        this.terms.forEach((t) => t.terminate());
        setTimeout(() => {
            this.screen.destroy();
            process.exit(0);
        }, 50);
    }
}

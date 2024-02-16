/*
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

import os           from "os";
import chalk        from "chalk";
import BlessedXTerm from "blessed-xterm";

export default function (Base) {
    return class stmuxTerminal extends Base {
        constructor () {
            super();
            this.terms           = [];
            this.focused         = -1;
            this.zoomed          = -1;
            this.terminated      = 0;
            this.terminatedError = 0;
        }
        provisionCommand (x, y, w, h, node, childs = []) {
            if (node.type() !== "command")
                this.fatal("invalid AST node (expected \"command\")");
            const initially = node.term == null;
            /*  determine XTerm widget  */
            let term;
            if (initially) {
                /*  create XTerm widget  */
                term = new BlessedXTerm({
                    left:          x,
                    top:           y,
                    width:         w,
                    height:        h,
                    shell:         null,
                    args:          [],
                    env:           process.env,
                    cwd:           process.cwd(),
                    cursorType:    this.argv.cursor,
                    cursorBlink:   true,
                    ignoreKeys:    [],
                    controlKey:    "none",
                    mousePassthrough : true,
                    fg:            "normal",
                    tags:          true,
                    border:        "line",
                    scrollback:    1000,
                    style: {
                        fg:        "default",
                        bg:        "default",
                        border:    { fg: "default" },
                        focus:     { border: { fg: "green" } },
                        scrolling: { border: { fg: "yellow" } },
                    },
                });
                node.term = term;
                term.node = node;

                /*  place XTerm widget on screen  */
                this.screen.append(term);
                this.terms.push(term);
                term.stmux = {
                    number: this.terms.length,
                };
            } else {
                /*  reuse XTerm widget  */
                term = node.term;

                /*  reconfigure size and position  */
                term.left   = x;
                term.top    = y;
                term.width  = w;
                term.height = h;
            }

            /*  determine zoom  */
            if (this.zoomed !== -1 && this.zoomed === (term.stmux.number - 1)) {
                term.left   = 0;
                term.top    = 0;
                term.width  = this.screenWidth;
                term.height = this.screenHeight;
                term.setIndex(2);
            } else {
                term.setIndex(1);
            }

            /*  set terminal title  */
            this.setTerminalTitle(term);

            /*  some initial initializations  */
            if (initially) {
                term.stmux.mouse = false;
                /*  optionally enable mouse event handling  */
                if (this.argv.mouse || node.get("mouse") === true) {
                    term.enableMouse();
                    term.stmux.mouse = true;
                }

                /*  determine initial focus  */
                if (node.get("focus") === true) {
                    if (this.focused >= 0)
                        this.fatal("only a single command can be focused");
                    this.focused = term.stmux.number - 1;
                }

                /*  handle focus/blur events  */
                term.on("focus", () => {
                    /*  redetermine our view of the current focused terminal  */
                    for (let i = 0; i < this.terms.length; i++) {
                        if (this.terms[i].focused) {
                            this.focused = i;
                            break;
                        }
                    }

                    /*  repaint focused  */
                    this.setTerminalTitle(term);
                    this.screen.render();
                });
                term.on("blur", () => {
                    /*  repaint blurred  */
                    this.setTerminalTitle(term);
                    this.screen.render();
                });

                /*  handle scrolling events  */
                term.on("scrolling-start", () => {
                    this.setTerminalTitle(term);
                    this.screen.render();
                });
                term.on("scrolling-end", () => {
                    this.setTerminalTitle(term);
                    this.screen.render();
                });

                /*  handle beep events  */
                term.on("beep", () => {
                    /*  pass-through to program  */
                    this.screen.program.output.write("\x07");
                });

                /*  handle error observation  */
                term.stmux.update = false;
                term.on("update", () => {
                    term.stmux.update = true;
                });
                term.on("mouse", (...args) => {
                    term.write(
                        "\r\n" +
                        chalk.yellow.inverse(" ..::") +
                        chalk.yellow.bold.inverse(` Mouse: ${JSON.stringify(args)}`) +
                        chalk.yellow.inverse("::.. ") +
                        "\r\n\r\n");
                });

                term.stmux.children = childs;
                /*  spawn command  */
                if (os.platform() === "win32") {
                    term.stmux.shell = "cmd.exe";
                    term.stmux.args  = [ "/d", "/s", "/c"];
                } else {
                    term.stmux.shell = "sh";
                    term.stmux.args  = [ "-c" ];
                }
                term.stmux.cmd = node.get("cmd");
                term.stmux.cwd = node.get("cwd") || process.cwd();
                const wait = node.get("wait");
                if (wait > 0) {
                    let count = wait;
                    const interval = setInterval(
                        () => {
                            this.setTerminalTitle(term, count);
                            this.screen.render();
                            count -= 1000;
                        },
                        1000,
                    );
                    setTimeout(
                        () => {
                            clearInterval(interval);
                            this.setTerminalTitle(term);
                            this.screen.render();
                            try {
                                term.spawn(term.stmux.shell, term.stmux.args.concat(term.stmux.cmd), term.stmux.cwd);
                            } catch (e) {
                                term.write(
                                    '\r\n' +
                                    chalk.red.inverse(' ..::') +
                                    chalk.red.bold.inverse(` Error: ${e.message} `) +
                                    chalk.red.inverse('::.. ') +
                                    '\r\n' +
                                    chalk.yellow.inverse(`cmd: ${term.stmux.cmd}`) +
                                    '\r\n' +
                                    chalk.yellow.inverse(`shell: ${term.stmux.shell}`) +
                                    '\r\n' +
                                    chalk.yellow.inverse(`cwd: ${term.stmux.cwd}`) +
                                    '\r\n' +
                                    chalk.yellow.inverse(`args: ${term.stmux.args}`) +
                                    '\r\n\r\n'
                                );
                            }
                        },
                        wait,
                    );
                } else {
                    try {
                        term.spawn(term.stmux.shell, term.stmux.args.concat(term.stmux.cmd), term.stmux.cwd);
                    } catch (e) {
                        term.write(
                            '\r\n' +
                            chalk.red.inverse(' ..::') +
                            chalk.red.bold.inverse(` Error: ${e.message} `) +
                            chalk.red.inverse('::.. ') +
                            '\r\n' +
                            chalk.yellow.inverse(`cmd: ${term.stmux.cmd}`) +
                            '\r\n' +
                            chalk.yellow.inverse(`shell: ${term.stmux.shell}`) +
                            '\r\n' +
                            chalk.yellow.inverse(`cwd: ${term.stmux.cwd}`) +
                            '\r\n' +
                            chalk.yellow.inverse(`args: ${term.stmux.args}`) +
                            '\r\n\r\n'
                        );
                    }
                }

                /*  handle command termination (and optional restarting)  */
                term.on("exit", (code) => {
                    if (code === 0) {
                        if (childs.length > 0) {
                            if (term.stmux.child == null) {
                                term.stmux.child = 1;
                            } else {
                                term.stmux.child++;
                            }
                            term.write(
                                "\r\n" +
                                chalk.yellow.inverse(" ..::") +
                                chalk.yellow.bold.inverse(` PROGRAM TERMINATED (${childs.length - term.stmux.child} left)`) +
                                chalk.yellow.inverse("::.. ") +
                                "\r\n\r\n");
                            if (term.stmux.child < childs.length) {
                                term.stmux.cmd = childs[term.stmux.child].get("cmd");
                                term.stmux.cwd = childs[term.stmux.child].get("cwd") || process.cwd();
                                childs[term.stmux.child].term = term;
                                term.node = childs[term.stmux.child];
                                this.setTerminalTitle(term);
                                term.spawn(term.stmux.shell, term.stmux.args.concat(term.stmux.cmd), term.stmux.cwd);
                                term.stmux.restarting = false;
                                return;
                            }
                            term.stmux.child = 0;
                        }
                        term.write(
                            "\r\n" +
                            chalk.green.inverse(" ..::") +
                            chalk.green.bold.inverse(" PROGRAM TERMINATED ") +
                            chalk.green.inverse("::.. ") +
                            "\r\n\r\n");
                    } else {
                        term.write(
                            "\r\n" +
                            chalk.red.inverse(" ..::") +
                            chalk.red.bold.inverse(` PROGRAM TERMINATED (code: ${code}) `) +
                            chalk.red.inverse("::.. ") +
                            "\r\n\r\n");
                    }

                    /*  handle termination and restarting  */
                    if (node.get("restart") === true && !term.stmux.restarting) {
                        /*  restart command  */
                        const delay = node.get("delay");
                        if (delay > 0)
                            setTimeout(() => term.spawn(term.stmux.shell, term.stmux.args.concat(term.stmux.cmd), term.stmux.cwd), delay);
                        else
                            term.spawn(term.stmux.shell, term.stmux.args.concat(term.stmux.cmd), term.stmux.cwd);
                    } else {
                        /*  handle automatic program termination  */
                        this.terminated++;
                        if (code !== 0)
                            this.terminatedError++;
                        if (this.terminated >= this.terms.length) {
                            if (this.argv.wait === "" || (this.argv.wait === "error" && this.terminatedError === 0))
                                setTimeout(() => this.terminate(), 2 * 1000);
                        }
                    }
                })
            }
        }
        provisionGroup (x, y, w, h, node) {
            if (node.type() !== "group")
                this.fatal("invalid AST node (expected \"group\")");

            const childs = node.childs();
            this.provisionCommand(x, y, w, h, childs[0], childs);
        }
        provisionSplit (x, y, w, h, node) {
            if (node.type() !== "split")
                this.fatal("invalid AST node (expected \"split\")");

            /*  provision terminals in a particular direction  */
            const childs = node.childs();
            const divide = (s, l, childs) => {
                /*  sanity check situation  */
                const n = childs.length;
                if (l < (n * 3))
                    this.fatal("terminal too small");
                const k = Math.floor(l / n);
                if (k === 0)
                    this.fatal("terminal too small");

                /*  pass 1: calculate size of explicitly sized terminals  */
                const sizes = [];
                for (let i = 0; i < n; i++) {
                    sizes[i] = -1;
                    let size = childs[i].get("size");
                    if (size) {
                        let m;
                        if (size.match(/^\d+$/))
                            size = parseInt(size);
                        else if (size.match(/^\d+\.\d+$/))
                            size = Math.floor(l * parseFloat(size));
                        else if ((m = size.match(/^(\d+)\/(\d+)$/)))
                            size = Math.floor(l * (parseInt(m[1]) / parseInt(m[2])));
                        else if ((m = size.match(/^(\d+)%$/)))
                            size = Math.floor(l * (parseInt(m[1]) / 100));
                        if (size < 3)
                            size = 3;
                        else if (size > l)
                            size = l;
                        sizes[i] = size;
                    }
                }

                /*  pass 2: calculate size of implicitly sized terminals  */
                for (let i = 0; i < n; i++) {
                    if (sizes[i] === -1) {
                        let size = Math.floor(l / n);
                        if (size < 3)
                            size = 3;
                        sizes[i] = size;
                    }
                }

                /*  pass 3: optionally shrink/grow sizes to fit total available size  */
                while (true) {
                    let requested = 0;
                    for (let i = 0; i < n; i++)
                        requested += sizes[i];
                    if (requested > l) {
                        let shrink = requested - l;
                        for (let i = 0; i < n && shrink > 0; i++) {
                            if (sizes[i] > 3) {
                                sizes[i]--;
                                shrink--;
                            }
                        }
                        continue;
                    } else if (requested < l) {
                        let grow = l - requested;
                        for (let i = 0; i < n && grow > 0; i++) {
                            sizes[i]++;
                            grow--;
                        }
                        continue;
                    }
                    break;
                }

                /*  pass 4: provide results  */
                const SL = [];
                for (let i = 0; i < n; i++) {
                    SL.push({ s, l: sizes[i] });
                    s += sizes[i];
                }
                return SL;
            }
            if (node.get("horizontal") === true) {
                const SL = divide(x, w, childs);
                for (let i = 0; i < childs.length; i++)
                    this.provision(SL[i].s, y, SL[i].l, h, childs[i]);
            } else if (node.get("vertical") === true) {
                const SL = divide(y, h, childs);
                for (let i = 0; i < childs.length; i++)
                    this.provision(x, SL[i].s, w, SL[i].l, childs[i]);
            }
        }
        provision (x, y, w, h, node) {
            if (node.type() === "split")
                return this.provisionSplit(x, y, w, h, node);
            if (node.type() === "group")
                return this.provisionGroup(x, y, w, h, node);
            else if (node.type() === "command")
                return this.provisionCommand(x, y, w, h, node);
            else
                this.fatal("invalid AST node (expected \"split\", \"group\" or \"command\")");
        }
        provisionInitially () {
            this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast);

            /*  manage initial terminal focus  */
            if (this.focused === -1)
                this.focused = 0;
            this.terms[this.focused].focus();
        }
        provisionAgain () {
            this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast);
        }
    };
}


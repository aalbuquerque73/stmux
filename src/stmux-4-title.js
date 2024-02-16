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

export default function (Base) {
    return class stmuxTitle extends Base {
        /*  determine title of terminal  */
        setTerminalTitle (term, count) {
            let title = term.node.get("title") || term.node.get("cmd");
            if (count != null)
                title = `( {bold}${title}{/bold} {yellow-bg}{black-fg}${count}{/black-fg}{/yellow-bg} )`;
            else
                title = `( {bold}${title}{/bold} )`;
            if (this.argv.number)
                title = `[${term.stmux.number}]-${title}`;
            if (this.zoomed !== -1 && this.zoomed === (term.stmux.number - 1))
                title = `${title}-[ZOOMED]`;
            if (term.stmux.error)
                title = `${title}-[ERROR]`;
            if (term.stmux.mouse)
                title = `${title}-[MOUSE]`;
            if (term.stmux.mode === 1)
                title = `${title}-[PREF]`;
            if (term.stmux.mode === 2)
                title = `${title}-[ACT]`;
            if (term.stmux.mode === 3)
                title = `${title}-{blue-fg}[MENU]{/blue-fg}`;
            if (term.scrolling)
                title = `{yellow-fg}${title}{/yellow-fg}`;
            else if (term.stmux.error)
                title = `{red-fg}${title}{/red-fg}`;
            else if (this.focused !== -1 && this.focused === (term.stmux.number - 1))
                title = `{green-fg}${title}{/green-fg}`;
            term.stmux.title = title;
            term.setLabel(term.stmux.title);
        }
    };
}


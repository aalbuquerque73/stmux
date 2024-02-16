

import Blessed from "blessed";

export default function (Base) {
    return class stmuxMenus extends Base {
        establishMenus () {
            const menuText = `{bold}${this.my.name} ${this.my.version} <${this.my.homepage}>{/bold}
{bold}${this.my.description}{/bold}
Copyright (c) 2017 ${this.my.author.name} <${this.my.author.url}>
Licensed under ${this.my.license} <http://spdx.org/licenses/${this.my.license}.html>

X`;
            this.menuW = 80;
            this.menuH = 22;
            this.menuBox = new Blessed.Box({
                left:          Math.floor((this.screenWidth  - this.menuW) / 2),
                top:           Math.floor((this.screenHeight - this.menuH) / 2),
                width:         this.menuW,
                height:        this.menuH,
                padding:       1,
                tags:          true,
                border:        "line",
                content:       menuText,
                hidden:        true,
                style: {
                    fg:        "default",
                    bg:        "default",
                    border:    { fg: "default" },
                },
            });
            this.menuList = new Blessed.List({
                // left: Math.floor((this.screenWidth  - this.menuW) / 2),
                // top: Math.floor((this.screenHeight - this.menuH) / 2) + 5,
                left: 0,
                top: 5,
                with: this.menuW,
                height: this.menuH - 5,
                padding: 0,
                tags:          true,
                border:        "line",
                hidden:        true,
                mouse: true,
                style: {
                    fg:        "default",
                    bg:        "default",
                    selected:    { fg: "blue" },
                    item:    { fg: "default" },
                    border:    { fg: "default" },
                },
            });
            this.titleBox = new Blessed.Box({
                left:          0,
                top:           5,
                width:         this.menuW,
                height:        3,
                padding:       0,
                tags:          true,
                border:        "line",
                content:       '',
                hidden:        true,
                style: {
                    fg:        "default",
                    bg:        "default",
                    border:    { fg: "default" },
                },
            });
            this.actionList = new Blessed.List({
                // left: Math.floor((this.screenWidth  - this.menuW) / 2),
                // top: Math.floor((this.screenHeight - this.menuH) / 2) + 5,
                left: 0,
                top: 7,
                with: this.menuW,
                height: this.menuH - 7,
                padding: 0,
                tags:          true,
                border:        "line",
                hidden:        true,
                mouse: true,
                style: {
                    fg:        "default",
                    bg:        "default",
                    selected:    { fg: "blue" },
                    item:    { fg: "default" },
                    border:    { fg: "default" },
                },
            });
            const indexes = {
                menu: 0,
                action: 0,
            };
            const list = this.terms.map(term => term.node.get("title") || term.node.get("cmd"));
            const actions = [
                'Start',
                'Stop',
                'Restart',
                'Zoom',
                'Visual',
            ];
            this.menuList.setItems(list);
            this.actionList.setItems(actions);
            this.screen.append(this.menuBox);
            this.menuBox.append(this.menuList);
            this.menuBox.append(this.titleBox);
            this.menuBox.append(this.actionList);
            this.menuBox.setIndex(100);
            this.menuList.setIndex(101);
            this.actionList.setIndex(102);
            this.titleBox.setIndex(103);

            this.on('menu:show', () => {
                indexes.menu = 0;
                indexes.action = 0;
                this.menuList.select(0);
                this.actionList.select(0);
                this.menuBox.show();
                this.menuList.show();
                this.menuList.focus();
                this.titleBox.hide();
                this.actionList.hide();
                this.screen.render();
            });
            this.on('menu:hide', () => {
                this.menuBox.hide();
                this.menuList.hide();
                this.titleBox.hide();
                this.actionList.hide();
                this.screen.render();
            });
            this.on('menu:up', (value) => {
                if (this.menuList.visible) {
                    if (indexes.menu < list.length - 1) {
                        indexes.menu += value;
                        this.menuList.up(value);
                        this.screen.render();
                    }
                } else  if (this.actionList.visible) {
                    if (indexes.action < actions.length - 1) {
                        indexes.action += value;
                        this.actionList.up(value);
                        this.screen.render();
                    }
                }
            });
            this.on('menu:down', (value) => {
                if (this.menuList.visible) {
                    if (indexes.menu > 0) {
                        indexes.menu -= value;
                        this.menuList.down(value);
                        this.screen.render();
                    }
                } else  if (this.actionList.visible) {
                    if (indexes.action > 0) {
                        indexes.action -= value;
                        this.actionList.down(value);
                        this.screen.render();
                    }
                }
            });
            this.on('menu:enter', (value) => {
                if (this.menuList.visible) {
                    const item = list[indexes.menu];
                    this.terms[this.focused].write('Item: ');
                    this.terms[this.focused].write(JSON.stringify(item) + '\r\n');
                    this.menuList.hide();
                    this.titleBox.setContent(item);
                    this.titleBox.show();
                    this.actionList.show();
                    this.actionList.focus();
                    this.screen.render();
                } else  if (this.actionList.visible) {
                    const item = actions[indexes.action];
                    this.terms[this.focused].write('Item: ');
                    this.terms[this.focused].write(JSON.stringify(item) + '\r\n');
                    this.emit('menu:close');
                }
            });
        }
    };
}

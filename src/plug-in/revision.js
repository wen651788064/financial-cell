import {h} from "../component/element";
import {cssPrefix} from "../config";
import ContextMenu from "./contextmenu";


export function setColor() {
    for (let i = 0; i < this.dateArr.length; i++) {
        let d = this.dateArr[i];
        d.css('color', 'black');
    }
}

function loadNeatFlex(neat_flex) {
    if (neat_flex) {
        return neat_flex.neat_flex;
    }
    return {};
}

function findData(sp) {
    for (let i = 0; i < this.sheet_data.length; i++) {
        let {sheet_path} = this.sheet_data[i];
        if (sp === sheet_path) {
            return this.sheet_data[i];
        }
    }

    return null;
}

function loadRowAndCol(options, neat_flex, op) {
    if (neat_flex) {
        options.row = {
            len: neat_flex["rows"],
        };
        options.rowWidth = {
            state: !0,
            width: 240
        };
        options.view = {
            height: () => 150 * 25,
        };
        options.col = {
            len: neat_flex["col"],
        };

    }
    options.view = {
        width: () => {
            return document.body.clientWidth - 280 - 10 - 68;
        }
    };
    if(typeof op === 'string') {
        op = JSON.parse(op)
    }
    if(op.cols) {
        options.cols = op.cols
    }
    if(op.row) {
        options.row = op.row
    }
    options.showFreeze = true;
    return options;
}

function sendRequest(info, sheet_path, el) {
    let {axios, url} = info;
    axios.get(url, {
        params: {
            sheet_path: sheet_path,
        }
    }).then(res => {
        if(res.data.status === true) {
            if(res.data.data === "error") {
                return;
            }
            let data = typeof res.data.data.sheet_details == 'string'
                ? JSON.parse(res.data.data.sheet_details) : res.data.data.sheet_details;
            let styles = "";
            if (typeof res.data.data.sheet_styles === "string" && JSON.parse(res.data.data.sheet_styles)) {
                styles = JSON.parse(res.data.data.sheet_styles);
            } else {
                styles = res.data.data.sheet_styles;
            }
            let options = loadRowAndCol({}, res.data.data.neat_flex, res.data.data.sheet_options);

            let args = {
                styles: styles,
                rows:  data,
                options: options,
                merges:  res.data.data.sheet_merges,
                autofilter:  res.data.data.sheet_auto_filter,
                pictures:  res.data.data.sheet_pictures,
                flex: loadNeatFlex(res.data.data.neat_flex),
                cols: ( options && options.cols) || {}
            };

            el.css('color', 'red');
            this.sheet_data.push({
                "sheet_path": sheet_path,
                "sheet_data": args
            })
            this.sheet.loadData(args);
        }
    })
}

export default class revision {
    constructor(width, sheet) {
        this.el = h('div', `${cssPrefix}-revisions-sidebar`);
        this.el.css('width', width);
        this.sheet = sheet;

        this.title = h('div', `${cssPrefix}-revisions-sidebar-title`).html('版本历史记录');
        this.contextMenu = new ContextMenu(() => () => {
            return "300px";
        }, false);
        this.el.children(
            this.title,
        );

        this.sheet_data = [];
        this.dateArr = [];
        this.el.on('mousedown', evt => {
            let {buttons, target} = evt;
            let className = target.className;
            if (buttons === 2 && className === `${cssPrefix}-revisions-sidebar-date`) {
                setColor.call(this);
                target.style['color'] = 'red';
                this.contextMenu.setPosition(evt.layerX, evt.layerY, this);
            } else if (buttons === 2) {
                setColor.call(this);
                this.contextMenu.hide();
            }
        });

    }

    clickEvent(el, data, info) {
        el.on('mousedown', evt => {
            let {buttons} = evt;
            if(buttons === 2) {
                return;
            }
            let {sheet_path} = data;
            let sd = findData.call(this, sheet_path);
            if (sd && sd.sheet_data) {
                setColor.call(this);
                el.css('color', 'red');
                this.sheet.loadData(sd.sheet_data);
                this.contextMenu.hide();
                evt.stopPropagation();
            } else {
                setColor.call(this);
                sendRequest.call(this, info, sheet_path);
            }
        });
    }

    setData(d, args, info) {
        let enter = false;
        Object.keys(d).forEach(i => {
            let year = d[i];
            let el = h('div', `${cssPrefix}-revisions-sidebar-year`).html(i);
            this.el.children(el);
            Object.keys(year).forEach(j => {
                let {date, history_id, sheet_id, sheet_path} = year[j];
                el = h('div', `${cssPrefix}-revisions-sidebar-date`).html(date);
                this.dateArr.push(el);
                this.el.children(el);
                this.clickEvent(el, {
                    "history_id": history_id,
                    "sheet_id": sheet_id,
                    "sheet_path": sheet_path
                }, info);
                if (!enter) {
                    el.css('color', 'red');
                    this.sheet.loadData(args);
                    enter = true;
                    this.sheet_data.push({
                        "sheet_path": sheet_path,
                        "sheet_data": args
                    })
                }
            });
        });
    }
}
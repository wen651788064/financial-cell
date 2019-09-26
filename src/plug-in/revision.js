import {h} from "../component/element";
import {cssPrefix} from "../config";
import ContextMenu from "./contextmenu";


export function setColor() {
    for (let i = 0; i < this.dateArr.length; i++) {
        let d = this.dateArr[i];
        d.css('color', 'black');
    }
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

    clickEvent(el, data) {
        el.on('mousedown', evt => {
            let {sheet_path} = data;
            let sd = findData.call(this, sheet_path);
            if (sd.sheet_data) {
                el.css('color', 'red');
                this.sheet.loadData(sd.sheet_data);
            }
        });
    }

    setData(d, args) {
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
                });
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
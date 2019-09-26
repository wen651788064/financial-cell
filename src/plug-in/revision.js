import {h} from "../component/element";
import {cssPrefix} from "../config";
import ContextMenu from "./contextmenu";


export function setColor() {
    for(let i = 0; i < this.dateArr.length; i++) {
        let d = this.dateArr[i];
        d.css('color', 'black');
    }
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

       this.dateArr = [];
        this.el.on('mousedown', evt => {
            let {buttons, target} = evt;
            let className = target.className;
            if(buttons === 2 && className === `${cssPrefix}-revisions-sidebar-date`) {
                setColor.call(this);
                target.style['color'] = 'red';
                this.contextMenu.setPosition(evt.layerX, evt.layerY, this);
            } else {
                setColor.call(this);
                this.contextMenu.hide();
            }
        });

    }

    clickEvent(el, data) {
        el.on('mousedown', evt => {
            this.sheet.loadData(data);
        });
    }

    setData(d, args) {
        d = {
            "2019年": [
                {
                    "date": "09-25 17:21:59",
                    "data": {

                    }
                }
            ],
            "2018年": [
                {
                    "date": "09-25 17:21:59",
                    "data": {

                    }
                }
            ]
        };
        let enter = false;
        Object.keys(d).forEach(i => {
            let year = d[i];
            let el = h('div', `${cssPrefix}-revisions-sidebar-year`).html(i);
            this.el.children(el);
            Object.keys(year).forEach(j => {
                let {date, data} = year[j];
                el = h('div', `${cssPrefix}-revisions-sidebar-date`).html(date);
                this.dateArr.push(el);
                this.el.children(el);
                this.clickEvent(el, data);
                if(!enter) {
                    el.css('color', 'red');
                    this.sheet.loadData(args);
                    enter = true;
                }
            });
        });
    }
}
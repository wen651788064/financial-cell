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
    constructor(width) {
        this.el = h('div', `${cssPrefix}-revisions-sidebar`);
        this.el.css('width', width);

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
                this.contextMenu.setPosition(evt.pageX, evt.pageY, this);
            } else {
                setColor.call(this);
                this.contextMenu.hide();
            }
        });

    }

    setData(d) {
        d = {
            "2019年": [
                {
                    "date": "9月18日",
                    "data": [
                        {},
                        {}
                    ]
                },
                {
                    "date": "9月18日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "9月15日",
                    "data": [
                        {}
                    ]
                }
            ],
            "2018年": [
                {
                    "date": "9月12日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "9月11日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "9月10日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "9月2日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "8月22日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "2月12日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "1月12日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "2月10日",
                    "data": [
                        {}
                    ]
                },
                {
                    "date": "2月9日",
                    "data": [
                        {}
                    ]
                }
            ]
        };
        Object.keys(d).forEach(i => {
            let year = d[i];
            let el = h('div', `${cssPrefix}-revisions-sidebar-year`).html(i);
            this.el.children(el);
            Object.keys(year).forEach(j => {
                let {date} = year[j];
                el = h('div', `${cssPrefix}-revisions-sidebar-date`).html(date);
                this.dateArr.push(el);
                this.el.children(el);
                // for(let k = 0; k < date.length; k++) {
                //     // let {date} = year[i];
                // }
            });
        });
    }
}
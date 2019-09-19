import {h} from "../component/element";
import {cssPrefix, look} from "../config";
import CellRange from "../core/cell_range";
import {bind} from "./event";

export default class Website {
    constructor(data) {
        this.data = data;
        this.el = h('div', `${cssPrefix}-hyperlink-tooltip`)
            .hide();

        this.tableEl = h('div', `${cssPrefix}-hyperlink-tooltip`)
            .hide();
        this.tableEl.attr('tabindex', 0);
        this.tableEl.css('overflow-y', 'auto');
        this.tableEl.css('max-height', '400px');
        bind(this.tableEl.el, 'paste', evt => {
            evt.stopPropagation();
        });
        bind(this.tableEl.el, 'copy', evt => {
            evt.stopPropagation();
        });
        bind(this.tableEl.el, 'keydown', evt => {
            evt.stopPropagation();
        });
        bind(this.tableEl.el, 'keyup', evt => {
            evt.stopPropagation();
        });
        this.timer = null;
        this.timer2 = null;
    }

    show(ri, ci) {
        let {data} = this;
        let text = data.getCellTextOrDefault(ri, ci) + "";
        clearTimeout(this.timer);
        clearTimeout(this.timer2);
        if (text.indexOf(look) != -1) {
            let rect = data.getRect(new CellRange(ri, ci, ri, ci));
            let left = rect.left + 55;
            let top = rect.top + 50;
            let arr = JSON.parse(text.substring(text.indexOf("!") + 1, text.length));

            this.tableEl.css('left', `${left}px`);
            this.tableEl.css('top', `${top}px`);
            this.tableEl.css('user-select', 'text');

            this.tableEl.html('');
            let table = h('table', '');
            table.css('border-spacing', '0px');
            let tr = h('tr', '');
            tr.children(
                h('td', '').css('border', '1px solid black').html('序号'),
                h('td', '').css('border', '1px solid black').html('项目名称'),
                h('td', '').css('border', '1px solid black').html('城市'),
                h('td', '').css('border', '1px solid black').html('占地面积'),
                h('td', '').css('border', '1px solid black').html('差额')
            );
            table.children(
                tr
            );

            for (let j = 0; j < arr.length; j++) {
                let {number, name, city, area, value} = arr[j];
                let tr = h('tr', '');
                let td = h('td', '');
                td.html(number);
                td.css('border', '1px solid black');

                let td2 = h('td', '');
                td2.html(name);
                td2.css('border', '1px solid black');

                let td3 = h('td', '');
                td3.html(city);
                td3.css('border', '1px solid black');

                let td4 = h('td', '');
                td4.html(area);
                td4.css('border', '1px solid black');

                let td5 = h('td', '');
                td5.html(value);
                td5.css('border', '1px solid black');
                tr.children(
                    td,
                    td2,
                    td3,
                    td4,
                    td5
                );
                table.children(
                    tr
                );
            }

            this.tableEl.children(
                table
            );

            this.timer = setTimeout(() => {
                this.tableEl.show();
            }, 300);
        } else {
            let regex = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
            text = text.substr(0, 3).toLowerCase() == "www" ? "http://" + text : text;
            // console.log(regex.test(text))
            if (!regex.test(text)) {
                this.el.hide();
                this.tableEl.hide();
                return;
            }

            let rect = data.getRect(new CellRange(ri, ci, ri, ci));
            let left = rect.left + 55;
            let top = rect.top;
            this.el.html('');
            this.el.css('color', 'blue');
            this.el.children(
                h('div', 'aaa').css("border-bottom", "1px solid blue")
                    .on('click', evt => {
                        console.log("115");
                        var iWidth = 650; //弹出窗口的宽度;
                        var iHeight = 500; //弹出窗口的高度;

                        console.log(evt);
                        let {screenX, screenY} = evt;
                        window.open(text, "", `width=${iWidth},height=${iHeight},left=${screenX + rect.width},top=${screenY}`);
                    })
                    .html(text)
            );
            this.el.css('left', `${left}px`);
            this.el.css('top', `${top}px`);

            this.timer2 = setTimeout(() => {
                this.el.show();
            }, 300);
        }
    }
}
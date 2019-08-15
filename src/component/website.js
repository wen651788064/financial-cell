import {h} from "../component/element";
import {cssPrefix} from "../config";

export default class Website {
    constructor(data) {
        this.data = data;
        this.el = h('div', `${cssPrefix}-hyperlink-tooltip`)
            .hide()

        this.el.html('www.baidu.com');
    }

    show(ri, ci) {
        let {data} = this;
        let rect = data.cellRect(ri, ci);
        let left = rect.left + 70;
        let top = rect.top + 41;
        this.el.css('left', `${left}px`);
        this.el.css('top', `${top}px`);

        this.el.show();
    }
}
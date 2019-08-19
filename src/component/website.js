import {h} from "../component/element";
import {cssPrefix} from "../config";

export default class Website {
    constructor(data) {
        this.data = data;
        this.el = h('div', `${cssPrefix}-hyperlink-tooltip`)
            .hide();

        this.el.on('mousedown', evt => {
            console.log("11");
        });
    }

    show(ri, ci) {
        let {data} = this;
        let text = data.getCellTextOrDefault(ri, ci) + "";
        let regex = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
        text = text.substr(0, 3).toLowerCase() == "www" ? "http://" + text : text;
        // console.log(regex.test(text))
        if (!regex.test(text)) {
            this.el.hide();
            return;
        }

        let rect = data.cellRect(ri, ci);
        let left = rect.left + 55;
        let top = rect.top;
        this.el.html('');
        this.el.children(
            h('a', 'aaa').attr('href', text).attr('target', '_blank').html(text)
        );
        this.el.css('left', `${left}px`);
        this.el.css('top', `${top}px`);

        this.el.show();
    }
}
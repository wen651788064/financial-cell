import {sheetReset} from "../component/sheet";
import {createEvent} from "../component/event";
import Revision from "./revision";

function setCssToRight() {
    this.sheet.el.css('left', '150px');
    this.sheet.toolbar.el.css('left', '150px');
}

export default class PlugIn {
    constructor(targetEl, sheet, data) {
        this.targetEl = targetEl;
        this.sheet = sheet;
        this.data = data;
        this.revision = new Revision();

    }

    openFrame(w = document.body.clientWidth) {
        w = w - 150 < 0 ? 0 : w - 150;
        this.data.settings.view.width = () => {
            return w;
        };
        setCssToRight.call(this);
        createEvent.call(this, 8, false, 'resize');
        sheetReset.call(this.sheet);

        this.revision = new Revision('150px');
        this.revision.setData();
        this.targetEl.children(
            this.revision.el,
            this.revision.contextMenu.el
        );
    }
}
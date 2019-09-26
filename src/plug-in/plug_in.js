import {sheetReset} from "../component/sheet";
import {createEvent} from "../component/event";
import Revision from "./revision";

function setCssToRight() {
    this.sheet.el.css('float', 'right');
    this.sheet.toolbar.el.css('float', 'right');
}

export default class PlugIn {
    constructor(targetEl, sheet, data) {
        this.targetEl = targetEl;
        this.sheet = sheet;
        this.data = data;
        this.revision = new Revision();

    }

    openFrame(w = document.body.clientWidth) {
        this.data.settings.view.width = () => {
            return w - 150 < 0 ? 0 : w - 150;
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
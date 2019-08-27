// import helper from '../helper';
import {deleteAllImg} from "../event/paste";

export default class History {
    constructor() {
        this.undoItems = [];
        this.redoItems = [];
    }

    add(data) {
        this.undoItems.push(JSON.stringify(data));
        this.redoItems = [];
    }

    addPic(data, operation) {
        this.undoItems.push({
            type: "picture",
            pic: data,
            operation: operation
        });
        this.redoItems = [];
    }

    canUndo() {
        return this.undoItems.length > 0;
    }

    canRedo() {
        return this.redoItems.length > 0;
    }

    undo(currentd, cb, sheet) {
        const {undoItems, redoItems} = this;
        if (this.canUndo()) {
            let item = undoItems.pop();
            redoItems.push(JSON.stringify(currentd));
            if (item && item.type && item.type === 'picture') {
                let data = item.pic;
                deleteAllImg.call(sheet);
                let {container} = sheet;
                Object.keys(data).forEach(i => {
                    container.child(data[i].img);
                });
                sheet.data.pasteDirectionsArr = data;
            } else {
                cb(JSON.parse(item));
            }
        }
    }

    redo(currentd, cb) {
        const {undoItems, redoItems} = this;
        if (this.canRedo()) {
            undoItems.push(JSON.stringify(currentd));
            cb(JSON.parse(redoItems.pop()));
        }
    }
}

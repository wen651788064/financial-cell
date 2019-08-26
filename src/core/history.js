// import helper from '../helper';

function unique(arr) {
    return Array.from(new Set(arr))
}

export default class History {
    constructor() {
        this.undoItems = [];
        this.redoItems = [];
    }

    add(data) {
        this.undoItems.push(JSON.stringify(data));
        this.redoItems = [];
        this.undoItems = unique(this.undoItems);
    }

    addPic(data) {
        this.undoItems.push({
            type: "picture",
            pic: data
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
                Object.keys(data).forEach(i => {
                    if (!data[i].img.el || !data[i].img.el.parentNode) {
                        let {container} = sheet;
                        container.child(data[i].img);
                    }
                });
                sheet.pasteDirectionsArr = data;
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

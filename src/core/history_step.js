export default class HistoryStep {
    constructor(data) {
        this.undoItems = [];
        this.redoItems = [];
        this.data = data;
    }

    addStep({type, action, ri, ci, expr}, oldCell) {
        this.undoItems.push({
            type,
            action, ri, ci, expr, oldCell
        });
    }

    getStepType(type, {ri, ci, expr, text}) {
        let str = "";
        switch (type) {
            case 1:
                str = `在${expr}中键入"${text}"`;
                break;
        }

        return {
            action: str,
            type,
            ri, ci, expr,
        };
    }

    undo() {
        if (!this.data.settings.showEditor) {
            return;
        }

        let ui = this.getItems(1);
        let {data} = this;
        let {sheet} = data;
        if (ui.length <= 0) {
            return;
        }

        let {type, ri, ci, oldCell} = ui.pop();

        if (type === 1) {
            data.rows.setCellText(ri, ci, oldCell, sheet.table.proxy, data.name, 'cell');
        }
    }

    getItems(type) {
        if (type === 1) {
            return this.undoItems;
        } else {
            return this.redoItems;
        }
    }
}
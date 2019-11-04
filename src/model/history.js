import {deepCopy} from "../core/operator";

export default class History {
    constructor({type = -1, action = "", ri = -1, ci = -1, expr = "", cellRange = "", cells = {}, height = -1, width = -1, oldCell = {}, newCell= {}}) {
        this.type = type;
        this.action = action;
        this.ri = ri;
        this.ci = ci;
        this.expr = expr;
        this.cellRange = cellRange;
        this.cells = cells;
        this.height = height;
        this.width = width;
        this.oldCell = oldCell;
        this.newCell = newCell;
    }

    restore(data, sheet, action) {
        let {type} = this;

        if (type === 1) {
            let {ri, ci, oldCell, newCell} = this;
            let cell = "";
            if(action === 1) {
                cell = deepCopy(oldCell);
            } else {
                cell = deepCopy(newCell);
            }

            data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');
        } else if (type === 2) {
            let {cells} = this;
            for (let i = 0; i < cells.length; i++) {
                let {cell, ri, ci} = cells[i];

                data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');
            }
        } else if(type === 3) {
            let {ri, height} = this;
            data.rows.setHeight(ri,  height);
        } else if(type === 4) {
            let {ci, width} = this;
            data.cols.setWidth(ci,  width);
        }
    }
}
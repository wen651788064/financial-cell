import {deepCopy} from "../core/operator";
import { isHave } from '../core/helper';

export default class PreAction {
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

    restore(data, sheet, isRedo) { // 如果是2值的参数，用is前缀命名   ，多值   xxxType
        let {type} = this;

        if (type === 1) { // shuru
            let {ri, ci, oldCell, newCell} = this;
            let cell = "";
            // redo 1  undo 2
            if(isRedo === 1) {
                cell = deepCopy(oldCell);
            } else {
                cell = deepCopy(newCell);
            }

            data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');
        } else if (type === 2 || type === 5 || type === 6 || type === 11) {
            let {cells, oldCell} = this;
            let _cells = "";
            if(isRedo === 1) {
                _cells = deepCopy(oldCell);
            } else {
                _cells = deepCopy(cells);
            }
            for (let i = 0; i < _cells.length; i++) {
                let {cell, ri, ci} = _cells[i];

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

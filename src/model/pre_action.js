import {deepCopy} from "../core/operator";
import { isHave } from '../core/helper';
function getCellDepend(cells) {

    let arr = [];
    for(let i = 0; i < cells.length; i++) {
        if(isHave(cells[i]) && isHave(cells[i].cell) && isHave(cells[i].cell.depend)) {
            arr.push(...cells[i].cell.depend);
        }
    }

    return arr;
}

export default class PreAction {
    constructor({type = -1, action = "", ri = -1, ci = -1, expr = "", oldStep = "", cellRange = "", cells = {}, height = -1, width = -1, oldCell = {}, newCell= {}, newMergesData = "", oldMergesData = "", property = "", value = ""}, data) {
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
        this.oldMergesData = oldMergesData;
        this.newMergesData = newMergesData;
        this.property = property;
        this.value = value;
        this.oldStep = oldStep;

        this.data = data;
    }

    findAllNeedCalcCell() {
        let changeArr = [];
        let {oldCell, newCell} = this;
        changeArr.push(...getCellDepend(oldCell));
        changeArr.push(...getCellDepend(newCell));

        return changeArr;
    }


    restore(data, sheet, isRedo) { // 如果是2值的参数，用is前缀命名   ，多值   xxxType
        let {type} = this;

        if (type === 1) { // shuru
            let {  oldCell, newCell} = this;
            let cell = "";
            // redo 1  undo 2
            if(isRedo === 1) {
                cell = deepCopy(oldCell);
            } else {
                cell = deepCopy(newCell);
            }
            for (let i = 0; i < cell.length; i++) {
                let {cell, ri, ci} = cell[i];
                data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');

            }

            data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');
        } else if (type === 2 || type === 5 || type === 6 || type === 11 || type === 12) {
            let {newCell, oldCell, oldMergesData, newMergesData, cellRange, property, value} = this;
            let _cells = "";
            if(isRedo === 1) {
                _cells = deepCopy(oldCell);
            } else {
                _cells = deepCopy(newCell);
            }

            //
            if(property === 'merge') {
                if(isRedo === 1) {
                    this.data.merges.setData(oldMergesData);
                } else {
                    this.data.merges.setData(newMergesData);
                }
            }

            for (let i = 0; i < _cells.length; i++) {
                let {cell, ri, ci} = _cells[i];
                data.rows.setCellText(ri, ci, cell, sheet.table.proxy, data.name, 'cell');

            }

        } else if(type === 3) {
            let {ri, height, oldStep} = this;
            if(isRedo === 1) {
                data.rows.setHeight(ri, oldStep.height);
            } else {
                data.rows.setHeight(ri, height);
            }
        } else if(type === 4) {
            let {ci, width, oldStep} = this;
            if(isRedo === 1) {
                data.cols.setWidth(ci,  oldStep.width);
            } else {
                data.cols.setWidth(ci,  width);
            }

        }
    }
}

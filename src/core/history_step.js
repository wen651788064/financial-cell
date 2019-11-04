import {xy2expr} from "./alphabet";
import {isHave} from "./helper";
import {deepCopy} from "./operator";
import History from "../model/history";

export default class HistoryStep {
    constructor(data) {
        this.undoItems = [];
        this.redoItems = [];
        this.data = data;
    }

    addStep({type, action, ri, ci, expr, cellRange, cells, height, width}, {oldCell, newCell}) {
        let history = "";
        switch (type) {
            case 1:
                history = new History({
                    type,
                    action, ri, ci, expr, oldCell, newCell
                });
                this.undoItems.push(history);
                this.redoItems = [];
                break;
            case 2:
                history = new History({
                    type,
                    action, cellRange, cells
                });
                this.undoItems.push(history);
                this.redoItems = [];
                break;
            case 3:
                history = new History({
                    type,
                    action, height, ri
                });
                this.undoItems.push(history);
                this.redoItems = [];
                break;
            case 4:
                history = new History({
                    type,
                    action, width, ci
                });
                this.undoItems.push(history);
                this.redoItems = [];
                break;
        }
    }

    getStepType(type, {ri, ci, expr, text, range}) {
        let str = "";
        let {rows, cols} = this.data;

        switch (type) {
            case 1:
                str = `在${expr}中键入"${text}"`;
                return {
                    action: str,
                    type,
                    ri, ci, expr
                };
                break;
            case 2:
                let cells = [];
                 range.each((i, j) => {
                    let cell = rows.getCell(i, j);
                    if(isHave(cell)) {
                        cell = deepCopy(cell);
                    } else cell = {};
                    cells.push({
                        ri: i,
                        ci: j,
                        cell: cell
                    });
                });
                let expr1 = xy2expr(range.sci, range.sri);
                let expr2 = xy2expr(range.eci, range.eri);
                expr = expr1 === expr2 ? expr1 : `${expr1}:${expr2}`;
                str = `删除${expr}的单元格内容`;
                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: cells,
                };
                break;
            case 3:
                let height = rows.getHeight(ri);
                str = `行宽`;
                return {
                    action: str,
                    type,
                    height: height,
                    ri: ri
                };
                break;
            case 4:
                let width = cols.getWidth(ci);
                str = `列宽`;
                return {
                    action: str,
                    type,
                    width: width,
                    ci: ci
                };
                break;
        }
    }

    undo() {
        let history = this.does(this.getItems(1), 1);
        this.redoItems.push(history);
    }

    redo() {
        this.does(this.getItems(2), 2);
    }

    does(ui, action) {
        if (!this.data.settings.showEditor) {
            return;
        }

        if (ui.length <= 0) {
            return;
        }
        let {data} = this;
        let {sheet} = data;

        let history = ui.pop();
        history.restore(data, sheet, action);

        return history;
    }

    getItems(type) {
        if (type === 1) {
            return this.undoItems;
        } else {
            return this.redoItems;
        }
    }
}
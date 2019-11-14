import {xy2expr} from "./alphabet";
import {isHave} from "./helper";
import {deepCopy} from "./operator";
import PreAction from "../model/pre_action";
import {testValid} from "../utils/test";

export default class MultiPreAction {
    constructor(data) {
        this.undoItems = [];
        this.redoItems = [];
        this.data = data;
    }

    addStep({type, action, ri, ci, expr, cellRange, cells, height, width}, {oldCell, newCell, merges}) {
        let preAction = "";
        switch (type) {
            case 1:
                preAction = new PreAction({
                    type,
                    action, ri, ci, expr, oldCell, newCell
                });
                this.undoItems.push(preAction);
                this.redoItems = [];
                break;
            case 2:
            case 5:
            case 11:
            case 6:
                preAction = new PreAction({
                    type,
                    action, cellRange, cells, oldCell
                });
                this.undoItems.push(preAction);
                this.redoItems = [];
                break;
            case 3:
                preAction = new PreAction({
                    type,
                    action, height, ri
                });
                this.undoItems.push(preAction);
                this.redoItems = [];
                break;
            case 4:
                preAction = new PreAction({
                    type,
                    action, width, ci
                });
                this.undoItems.push(preAction);
                this.redoItems = [];
                break;
            case 12:
                preAction = new PreAction({
                    type, merges,
                    action, cellRange, cells, oldCell
                });
                this.undoItems.push(preAction);
                this.redoItems = [];
                break;
        }
        testValid.call(this);
    }

    getStepType(type, {ri, ci, expr, text, range, cellRange, property, value, merges}) {
        let str = "";
        let {rows, cols} = this.data;
        // let cells = [];

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
                let expr1 = xy2expr(range.sci, range.sri);
                let expr2 = xy2expr(range.eci, range.eri);
                expr = expr1 === expr2 ? expr1 : `${expr1}:${expr2}`;
                str = `删除${expr}的单元格内容`;
                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: this.eachRange(range),
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
            case 5:
                str = '自动填充';
                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: this.eachRange(cellRange),
                };
                break;
            case 11:
                if(property === 'font-bold' || property === 'font-italic'
                    || property === 'font-name' || property === 'font-size' || property === 'color') {
                    str = "字体";
                } else if(property === 'underline') {
                    str = "下划线";
                } else if(property === 'bgcolor' || property === 'format') {
                    str = "单元格格式";
                } else if(property === 'align' ) {
                    if(value === 'left') {
                        str = "左对齐";
                    } else if(value === 'center'){
                        str = "居中";
                    } else if(value === 'right') {
                        str = "右对齐";
                    }
                } else if(property === 'valign') {
                    if(value === 'top') {
                        str = "顶端对齐";
                    }else if(value === 'center'){
                        str = "居中";
                    } else if(value === 'bottom') {
                        str = "底端对齐";
                    }
                } else if(property === 'border') {
                    str = "边框";
                } else if(property === 'strike') {
                    str = "删除线";
                }

                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: this.eachRange(cellRange),

                };
                break;
            case 6:
                str = '粘贴';
                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: this.eachRange(cellRange),
                };
                break;
            case 12:
                str = '合并单元格';
                return {
                    action: str,
                    type,
                    cellRange: range,
                    cells: this.eachRange(cellRange),
                };
                break;

        }
    }

    undo() {
        let preAction = this.does(this.getItems(1), 1);
        this.redoItems.push(preAction);
    }

    redo() {
        this.does(this.getItems(2), 2);
    }

    eachRange(range) {
        let {rows} = this.data;
        let cells = rows.eachRange(range);

        return cells;
    }

    // todo: actionItems,actionType
    // todo: 所有的历史操作对应MultiPreAction, 单个历史操作 PreAction  单个叫xxx, 多个multixxx
    does(actionItems, actionType) {
        if (!this.data.settings.showEditor) {
            return;
        }

        if (actionItems.length <= 0) {
            return;
        }
        let {data} = this;
        let {sheet} = data;

        let preAction = actionItems.pop();
        preAction.restore(data, sheet, actionType);

        return preAction;
    }

    getItems(type) {
        if (type === 1) {
            return this.undoItems;
        } else {
            return this.redoItems;
        }
    }
}

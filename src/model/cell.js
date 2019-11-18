import {isHave} from "../core/helper";

export default class Cell {
    constructor() {
        this.text = "";
        this.style = undefined;
        this.merge = undefined;
        this.depend = [];
        this.formulas = "";
    }



    setCell(cell) {
        if (!isHave(cell)) {
            return;
        }

        if (isHave(cell.text)) {
            this.text = cell.text;
        }

        if (isHave(cell.formulas)) {
            this.formulas = cell.formulas;
        }

        if (isHave(cell.depend)) {
            this.depend = cell.depend;
        }

        if (isHave(cell.style)) {
            this.style = cell.style;
        }

        if (isHave(cell.merge)) {
            this.merge = cell.merge;
        }
    }
}
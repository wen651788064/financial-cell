import {isHave} from "../core/helper";
import {expr2xy} from "../core/alphabet";

export default class CellProp {
    constructor(ri, ci, cell, expr) {
        this.ri = ri;
        this.ci = ci;
        this.cell = cell;
        this.expr = expr;
    }

    isInclude() {

    }

    each(cb) {
        let {cell} = this;
        if(isHave(cell.depend) === false) {
            return;
        }
        for(let i = 0; i < cell.depend.length; i++) {
            let expr = cell.depend[i];
            let [ci, ri] = expr2xy(expr);
            cb(ri, ci);
        }
    }
}
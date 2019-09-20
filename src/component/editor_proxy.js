import {filterFormula} from "../config";
// import {loadData} from "./table";
import {expr2xy, xy2expr} from "../core/alphabet";
import {contain, division} from "../core/operator";

export default class EditorProxy {
    constructor() {
        this.items = [];
        this.init = false;
    }


    associatedArr(rows) {
        rows.each((ri) => {
            rows.eachCells(ri, (ci) => {
                let cell = rows.getCell(ri, ci);
                if (cell) {
                    if (!cell.formulas) {
                        cell.formulas = "";
                    }

                    cell.formulas = cell.formulas + "";

                    if (this.indexOf(cell.formulas)) {
                        this.items.push({
                            erpx: xy2expr(ci * 1, ri * 1),
                            f: cell.formulas
                        });
                    }
                }
            })
        });
    }

    indexOf(text) {
        for (let i = 0; i < filterFormula.length; i++) {
            if (text.indexOf(filterFormula[i]) != -1) {
                return true;
            }
        }
        return false;
    }

    change(ri, ci, text, rows,  data) {
        let erpx = xy2expr(ci, ri);
        let has = -1;
        for (let i = 0; i < this.items.length && has === -1; i++) {
            let {f} = this.items[i];
            if (f === text) {
                has = i;
            }
        }

        let th = this.indexOf(text);
        if (th && has === -1) {
            this.items.push(erpx);
        } else if (!th && has !== -1) {
            this.items.splice(has - 1, has);
        }

        let e = false;
        for (let i = 0; i < this.items.length; i++) {
            let args = this.items[i];
            let a = expr2xy(args);
            let {f} = args;

            if (contain(division(f, []), erpx)) {
                console.log(a, f);
                data.setCellWithFormulas(a[1], a[0], f, '-');
                e = true;
            }
        }
        if(e) {
            data.change(data.getData());
        }
    }
}
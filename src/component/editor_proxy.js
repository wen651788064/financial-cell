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
                if(cell) {
                    if(!cell.formulas) {
                        cell.formulas = "";
                    }

                    cell.formulas = cell.formulas + "";

                    if(this.indexOf(cell.formulas)) {
                        this.items.push(xy2expr(ri, ci));
                    }
                }
            })
        });
    }

    indexOf(text) {
        for(let i = 0; i < filterFormula.length; i++) {
            if(text.indexOf(filterFormula[i]) != -1) {
                return true;
            }
        }
        return false;
    }

    change(ri, ci, text, rows, proxy, name) {
        let erpx = xy2expr(ri, ci);
        let has = this.items.indexOf(erpx);
        let th = this.indexOf(text);
        if(th && has === -1) {
            this.items.push(erpx);
        } else if(!th && has !== -1) {
            this.items.splice(has - 1, has);
        }

        for(let i = 0; i < this.items.length; i++) {
            let [ci, ri] = expr2xy(this.items[i]);
            let cell = rows.getCell(ri, ci);

            if(cell) {
                if(!cell.f) {
                    cell.f = "";
                }

                cell.f = cell.f + "";
                if (contain(division(cell.f, []), erpx)) {
                    proxy.setCell(name, erpx);
                }
            }
        }
    }
}
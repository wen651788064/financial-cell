import {xy2expr} from "./alphabet";
import {deepCopy, distinct} from "./operator";
import {isHave} from "./helper";

export default class WorkBook {
    constructor() {
         this.workbook = "";
        this.name = "";

        this.need_calc = false;
        this.contextualArr = [];
        this.data = "";
        this.proxy = "";
        this.table = "";
    }

    init(_, data, proxy, table) {
        this.workbook = [];
         this.workbook.Sheets = {};
        this.workbook.Sheets[data.name] = {};

        this.name = data.name;
        this.data = data;
        this.proxy = proxy;
        this.table = table;

        let viewRange = data.viewRange();
        let {mri, mci} = data.getMax();
        viewRange.eachGivenRange((ri, ci, eri, eci,) => {
            let cell2 = proxy.deepCopy(data.getCell(ri, ci));
            let cell = data.getCell(ri, ci);

            this.change(ri, ci, cell, cell2);
        }, mri, mci);
    }

    setWorkBook(  workbook) {
        this.workbook = workbook;
    }

    getWorkbook() {
        if (this.workbook === "") {
            return "";
        }

        return this.workbook;
    }

    calcNeedCalcBool(v) {
        if (v === false) {
            this.need_calc = this.need_calc ? this.need_calc : v;
        } else {
            this.need_calc = v;
        }
    }

    setContextualArr() {
        this.contextualArr = [];
    }

    getNeedCalc() {
        let value = this.need_calc;
        this.need_calc = false;
        let ca = distinct(deepCopy(this.contextualArr));
        this.setContextualArr(ca);
        return {
            value,
            contextualArr: ca
        };
    }

    isDataEmpty() {
        let {data } = this;
        if (typeof data === 'string') { // todo: if this.isDataEmpty():{ return}
            return false;
        }
        return true;
    }

    deleteWorkbook(ri, ci, what = 'all') {
        let expr = xy2expr(ci, ri);
        delete this.workbook.Sheets[this.name][expr];
        delete this.workbook.Sheets[this.name][expr];
    }

    change(ri, ci, cell, deep_cell, what = 'input') {
        let expr = xy2expr(ci, ri);
        let {data,  table} = this;

        if (this.isDataEmpty() === false) {
            return;
        }

        let empty = data.isEmpty(cell);
        if (empty === true) {
            delete this.workbook.Sheets[data.name][expr];

        } else {
            let {state, text} = data.tryParseToNum(what, cell, ri, ci);
            if (!state) {
                cell.text = data.toString(text);
                cell = deepCopy(cell);
            } else {
                cell = deepCopy(cell);
                cell.text = data.toString(text);
            }

            if (data.isBackEndFunc(cell.text)) {
                this.workbook.Sheets[data.name][expr] = {v: "", f: ""};
            } else {
                if (data.isReferOtherSheet(cell)) {
                    let {factory} = table;
                    factory.push(cell.formulas);
                }

                let cell_f = !cell.formulas ? cell.text : cell.formulas;
                this.workbook.Sheets[data.name][expr] = {
                    v: cell.text,
                    f: cell_f,
                    z: true,
                    id: expr,
                    rawFormulaText: cell_f,
                    typedValue: cell.text,
                    row: ri,
                    col: ci,
                    error: null,
                };

                if (data.isFormula(cell.text)) {
                    this.calcNeedCalcBool(true);
                } else {
                    this.calcNeedCalcBool(false);
                }
            }
        }

        if (empty === false) {
            if (isHave(cell.depend) && cell.depend.length > 0) {
                this.contextualArr.push(...cell.depend);
                this.calcNeedCalcBool(true);
            }
        }
    }
}

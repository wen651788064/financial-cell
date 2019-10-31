import {xy2expr} from "./alphabet";
import {textReplaceAndToUpperCase, textReplaceQM} from "../component/context_process";
import {toUpperCase} from "../component/table";
import {deepCopy, distinct} from "./operator";
import {isHave} from "./helper";

export default class WorkBook {
    constructor() {
        this.workbook = "";
        this.workbook_no_formula = "";
        this.name = "";

        this.need_calc = false;
        this.contextualArr = [];
        this.data = "";
        this.proxy = "";
        this.table = "";
    }

    init(_, data, proxy, table) {
        this.workbook = [];
        this.workbook_no_formula = [];
        this.workbook.Sheets = {};
        this.workbook.Sheets[data.name] = {};
        this.workbook_no_formula.Sheets = {};
        this.workbook_no_formula.Sheets[data.name] = {};
        this.name = data.name;
        this.data = data;
        this.proxy = proxy;
        this.table = table;

        let viewRange = data.viewRange();
        let {mri, mci} = data.rows.getMax();
        viewRange.eachGivenRange((ri, ci, eri, eci,) => {
            let cell2 = proxy.deepCopy(data.getCell(ri, ci));
            let cell = data.getCell(ri, ci);

            this.change(ri, ci, cell, cell2);
        }, mri, mci);
    }

    setWorkBook(type, workbook) {
        if (type === 1) {
            this.workbook = workbook;
        } else if (type === 2) {
            this.workbook_no_formula = workbook;
        }
    }

    getWorkbook(type) {
        if (type === 1) {
            if (this.workbook === "") {
                return "";
            }

            return deepCopy(this.workbook);
        }
        if (type === 2) {
            if (this.workbook_no_formula === "") {
                return "";
            }
            return deepCopy(this.workbook_no_formula);
        }
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

    deleteWorkbook(ri, ci, what = 'all') {
        let expr = xy2expr(ci, ri);
        delete this.workbook.Sheets[this.name][expr];
        delete this.workbook_no_formula.Sheets[this.name][expr];
        // if (what === 'all') {
        //     delete this.workbook.Sheets[this.name][expr];
        //     delete this.workbook_no_formula.Sheets[this.name][expr];
        // } else if (what === 'text') {
        //     let cell = this.workbook.Sheets[this.name][expr];
        //     let cell2 = this.workbook.Sheets[this.name][expr];
        //     if (cell.text) {
        //         delete cell.v;
        //         delete cell2.v;
        //     }
        //     if (cell.formulas) {
        //         delete cell.f;
        //         delete cell2.f;
        //     }
        // }
    }

    change(ri, ci, cell, deep_cell, what = 'input') {
        let expr = xy2expr(ci, ri);
        let {data, proxy, table} = this;


        if (typeof data === 'string') {
            return;
        }

        let empty = data.isEmpty(cell);
        if (empty === false) {
            let {state, text} = data.tryParseToNum(what, cell, ri, ci);
            if (!state) {
                cell.text = text;
                cell.text = data.toString(cell.text);
                cell = deepCopy(cell);
            } else {
                cell = deepCopy(cell);
                cell.text = text;
                cell.text = data.toString(cell.text);
            }


            if (data.isBackEndFunc(cell.text)) {
                this.workbook.Sheets[data.name][expr] = {v: "", f: ""};
            } else {
                if (data.isReferOtherSheet(cell)) {
                    let {factory} = table;
                    factory.push(cell.formulas);
                }
                this.workbook_no_formula.Sheets[data.name][expr] = {
                    v: cell.text,
                    f: !cell.formulas ? cell.text : cell.formulas,
                    z: true,
                    id: expr,
                    rawFormulaText: !cell.formulas ? cell.text : cell.formulas,
                    typedValue:cell.text,
                    row: ri,
                    col: ci,
                    error: null,
                };

                if (data.isFormula(cell.text)) {
                    if (isNaN(cell.text)) {
                        cell.text = toUpperCase(cell.text); // 为什么要.toUpperCase() 呢？ => =a1 需要变成=A1
                    }

                    this.workbook.Sheets[data.name][expr] = {
                        v: '',
                        f: cell.text,
                        z: true,
                        id: expr,
                        rawFormulaText: cell.text,
                        row: ri,
                        col: ci,
                        error: null,
                    };
                    this.calcNeedCalcBool(true);
                } else {
                    this.calcNeedCalcBool(false);
                    if (!isNaN(textReplaceAndToUpperCase(cell.text))) {
                        this.workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text, true),
                            z: true,
                            id: expr,
                            typedValue: textReplaceQM(cell.text, true),
                            row: ri,
                            col: ci,
                            error: null,
                        };
                    } else {
                        this.workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text),
                            z: true,
                            id: expr,
                            typedValue: textReplaceQM(cell.text),
                            row: ri,
                            col: ci,
                            error: null,
                        };
                    }
                }
            }
        } else {
            delete this.workbook_no_formula.Sheets[data.name][expr];
            this.workbook.Sheets[data.name][expr] = {
                v: 0, f: 0, z: false,
                id: expr,
                typedValue: 0,
                row: ri,
                col: ci,
                error: null,
            };
        }

        if (empty === false) {
            if (isHave(cell.depend) && cell.depend.length > 0) {
                this.contextualArr.push(...cell.depend);
                this.calcNeedCalcBool(true);
            }
        }
    }
}
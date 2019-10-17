import {xy2expr} from "./alphabet";
import {textReplaceAndToUpperCase, textReplaceQM} from "../component/context_process";
import {toUpperCase} from "../component/table";
import {deepCopy} from "./operator";

export default class WorkBook {
    constructor() {
        this.workbook = "";
        this.workbook_no_formula = "";
        this.name = "";

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

    deleteWorkbook(ri, ci, what = 'all') {
        let expr = xy2expr(ci, ri);
        if (what === 'all') {
            delete this.workbook.Sheets[this.name][expr];
            delete this.workbook_no_formula.Sheets[this.name][expr];
        } else if (what === 'text') {
            let cell = this.workbook.Sheets[this.name][expr];
            let cell2 = this.workbook.Sheets[this.name][expr];
            if (cell.text) {
                delete cell.v;
                delete cell2.v;
            }
            if (cell.formulas) {
                delete cell.f;
                delete cell2.f;
            }
        }
    }

    change(ri, ci, cell, cell2) {
        let expr = xy2expr(ci, ri);
        let {data, proxy, table} = this;

        if (data.isEmpty(cell) === false) {
            let {state, text} = table.specialHandle('date', cell, ri, ci);
            cell.text = text;
            cell.text = data.getRegularText(cell.text);

            if (data.backEndCalc(cell.text)) {
                this.workbook.Sheets[data.name][expr] = {v: "", f: ""};
            } else {
                if (data.isNeedCalc(cell)) {
                    let {factory} = table;
                    factory.push(cell.formulas);
                }
                this.workbook_no_formula.Sheets[data.name][expr] = {
                    v: cell.text,
                    f: !cell.formulas ? cell.text : cell.formulas,
                    z: true
                };

                if (data.textIsFormula(cell.text)) {
                    if (isNaN(cell.text)) {
                        cell.text = toUpperCase(cell.text); // 为什么要.toUpperCase() 呢？ => =a1 需要变成=A1
                    }

                    this.workbook.Sheets[data.name][expr] = {
                        v: '',
                        f: cell.text,
                        z: true,
                    };
                } else {
                    if (!isNaN(textReplaceAndToUpperCase(cell.text))) {
                        this.workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text, true),
                            z: true
                        };
                    } else {
                        this.workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text),
                            z: true
                        };
                    }
                }
            }
            if (state) {
                data.setCellWithFormulas(ri, ci, cell2.text, cell.formulas, 'date');
            }
        } else {
            this.workbook.Sheets[data.name][expr] = {v: 0, f: 0, z: false};
        }
    }
}
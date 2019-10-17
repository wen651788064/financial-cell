import {xy2expr} from "./alphabet";
import {textReplaceAndToUpperCase, textReplaceQM} from "../component/context_process";
import {toUpperCase} from "../component/table";

export default class WorkBook {
    constructor() {
        this.workbook = [];
        this.workbook_no_formula = [];

    }

    init(_, data, proxy, table) {
        this.workbook.Sheets = {};
        this.workbook.Sheets[data.name] = {};
        this.workbook_no_formula.Sheets = {};
        this.workbook_no_formula.Sheets[data.name] = {};

        let viewRange = data.viewRange();
        let {mri, mci} = data.rows.getMax();
        viewRange.eachGivenRange((ri, ci, eri, eci,) => {
            let cell2 = proxy.deepCopy(data.getCell(ri, ci));
            let cell = data.getCell(ri, ci);
            let expr = xy2expr(ci, ri);
            if (data.isEmpty(cell) === false) {
                let {state, text} = table.specialHandle('date', cell, ri, ci);
                cell.text = text;
                cell.text = data.getRegularText(cell.text);

                if (data.backEndCalc(cell.text)) {
                    this.workbook.Sheets[data.name][expr] = {v: "", f: ""};
                } else {
                    // if (data.isNeedCalc(cell)) {
                    //     let {factory} = this;
                    //     factory.push(cell.formulas);
                    // }

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
                    data.setCellWithFormulas(ri, ci, cell2.text, cell.formulas);
                }
            } else {
                this.workbook.Sheets[data.name][expr] = {v: 0, f: 0, z: false};
            }
        }, mri, mci);
    }

    getWorkbook(type) {
        if (type === 1) {
            return this.workbook;
        }
        if (type === 2) {
            return this.workbook_no_formula;
        }
    }

    change() {

    }
}
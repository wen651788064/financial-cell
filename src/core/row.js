import helper, {isHave} from './helper';
import {xy2expr} from './alphabet';
import {changeFormula, cutStr, isAbsoluteValue, value2absolute} from "../core/operator";
import {expr2xy} from "../core/alphabet";
import dayjs from 'dayjs'
import {deepCopy, isSheetVale, splitStr} from "./operator";
import Recast from "./recast";
import WorkBook from "./workbook_cacl_proxy";
import PasteProxy from "./paste_proxy";
import CellProxy from "./cell_proxy";

export function isFormula(text) {
    if (text && text[0] === "=") {
        return true;
    }

    return false;
}

function otherAutoFilter(d, darr, direction, isAdd, what, cb, other) {
    let ncell = other ? {
        "text": d.v,
        "formulas": d.v,
    } : this.getCellByTopCell(d, direction, isAdd, 'other');
    let {text, formulas} = ncell;
    let iText = formulas != "" ? formulas : text;

    if (other) {
        this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
    } else if (this.isFormula(iText)) {
        this.calcFormulaCellByTopCell(iText, darr, d, direction, isAdd);
    } else {
        this.calcCellByTopCell(cb, what, ncell, darr, isAdd, iText, d, text);
    }
}

function numberAutoFilter(d, darr, direction, isAdd, diffValue, what, cb, isNumber) {
    let ncell = "";

    if (isAdd) {
        diffValue = Math.abs(diffValue);
    } else {
        diffValue = diffValue * -1;
    }

    if (!isNumber) {
        ncell = {
            "text": d.v,
            "formulas": d.v,
        }
        diffValue = 0;
    } else {
        ncell = this.getCellByTopCell(d, direction, isAdd);
    }

    this.calcNumberCellByTopCell(ncell, diffValue, darr, d, what, cb);
}

function dateAutoFilter(d, line, isDown, darr, what, cb, isDate) {
    let direction = line;
    let ncell = "";
    let diff = isDown ? 1 : -1;
    if (!isDate) {
        ncell = {
            "text": d.v,
            "formulas": d.v,
        };
        diff = 0;
    } else {
        ncell = this.getCellByTopCell(d, direction, isDown, 'date');
    }
    this.calcDateCellByTopCell(ncell, darr, d, isDown, what, cb, diff);
}

class Rows {
    constructor({len, height}) {
        this._ = {};
        this.workbook = new WorkBook();
        this.len = len;
        // default row height
        this.height = height;
        this.pasteProxy = new PasteProxy();
    }

    getHeight(ri) {
        const row = this.get(ri);
        if (row && row.height) {
            return row.height;
        }
        return this.height;
    }

    setHeight(ri, v) {
        const row = this.getOrNew(ri);
        row.height = v;
    }

    setStyle(ri, style) {
        const row = this.getOrNew(ri);
        row.style = style;
    }

    sumHeight(min, max, exceptSet) {
        return helper.rangeSum(min, max, (i) => {
            if (exceptSet && exceptSet.has(i)) return 0;
            return this.getHeight(i);
        });
    }

    totalHeight() {
        return this.sumHeight(0, this.len);
    }

    get(ri) {
        return this._[ri];
    }

    getOrNew(ri) {
        this._[ri] = this._[ri] || {cells: {}};
        return this._[ri];
    }

    getCell(ri, ci) {
        const row = this.get(ri);
        if (row !== undefined && row.cells !== undefined && row.cells[ci] !== undefined
            && (isHave(row.cells[ci].text) || isHave(row.cells[ci].formulas))) {
            return row.cells[ci];
        }
        return null;
    }

    getCellMerge(ri, ci) {
        const cell = this.getCell(ri, ci);
        if (cell && cell.merge) return cell.merge;
        return [0, 0];
    }

    getCellOrNew(ri, ci) {
        const row = this.getOrNew(ri);
        row.cells[ci] = row.cells[ci] || {};
        return row.cells[ci];
    }

    toString(text) {
        return text + "";
    }

    isBackEndFunc(text) {
        if (text.indexOf("MD.RTD") != -1) {
            return true;
        }

        return false;
    }

    isReferOtherSheet(cell, state = false) {
        if (cell.formulas && cell.formulas[0] == "=" && (state || isSheetVale(cell.formulas))) {
            return true;
        }
        return false;
    }

    isEmpty(cell) {
        if (cell && (cell.text || cell.formulas)) {
            return false;
        }
        return true;
    }

    isFormula(text) {
        return isFormula(text);
    }

    setValue(value, cell) {
        cell.value = value;
    }

    // what: all | text | format
    setCell(ri, ci, cell, what = 'all') {
        const row = this.getOrNew(ri);
        if (what === 'all') {
            row.cells[ci] = cell;
            row.cells[ci].value = cell.text;
            this.workbook.change(ri, ci, row.cells[ci], deepCopy(row.cells[ci]));
        } else if (what === 'text') {
            row.cells[ci] = row.cells[ci] || {};
            row.cells[ci].text = cell.text;
            row.cells[ci].value = cell.text;
            this.workbook.change(ri, ci, row.cells[ci], deepCopy(row.cells[ci]));
        } else if (what === 'format') {
            row.cells[ci] = row.cells[ci] || {};
            row.cells[ci].style = cell.style;
            if (cell.merge) row.cells[ci].merge = cell.merge;
            this.workbook.change(ri, ci, row.cells[ci], deepCopy(row.cells[ci]));
        } else if (what === 'date') {
            // row.cells[ci] = {};
            if (!row.cells[ci]) {
                row.cells[ci] = {}
            }
            if (!this.isFormula(cell.formulas) && !cell.minute) {
                row.cells[ci].formulas = cell.text;
            } else {
                row.cells[ci].formulas = cell.formulas;
            }
            row.cells[ci].text = cell.text;
            row.cells[ci].style = cell.style;
            row.cells[ci].to_calc_num = cell.to_calc_num;
            row.cells[ci].value = cell.value;
        } else if (what === 'normal' || what === 'number') {
            // row.cells[ci] = {};
            if (!row.cells[ci]) {
                row.cells[ci] = {}
            }
            if (!this.isFormula(cell.formulas)) {
                row.cells[ci].formulas = cell.text;
            } else {
                row.cells[ci].formulas = cell.formulas;
            }
            row.cells[ci].value = cell.value;
            row.cells[ci].text = cell.text;
            row.cells[ci].style = cell.style;
        } else if (what === 'rmb') {
            if (!row.cells[ci]) {
                row.cells[ci] = {}
            }
            row.cells[ci].value = cell.value;
            row.cells[ci].text = cell.text;
            row.cells[ci].formulas = cell.formulas;
            row.cells[ci].style = cell.style;
        } else if (what === 'all_with_no_workbook') {
            row.cells[ci] = cell;
            row.cells[ci].value = cell.text;
        }
    }

    useOne(param, other, value = true) {
        if (isHave(param) === false) {
            return other;
        }

        if (value && this.isFormula(param)) {
            return other;
        }
        return param;
    }

    setCellText(ri, ci, {text, style}, proxy = "", name = "", what = 'all') {
        const cell = this.getCellOrNew(ri, ci);
        if (what === 'style') {
            cell.style = style;
            cell.formulas = text;
        } else {
            cell.formulas = text;
            cell.value = text;
        }
        cell.text = text;  // todo 自定义公式： text 为公式计算结果, formulas 为公式
        // this.recast(cell);
        if (typeof proxy != "string") {
            proxy.setCell(name, xy2expr(ci, ri));
        }
        if (what !== 'date') {
            this.workbook.change(ri, ci, cell, deepCopy(cell));
        }
    }

    setCellAll(ri, ci, text, formulas = "", what = '') {
        const cell = this.getCellOrNew(ri, ci);
        cell.formulas = formulas == "" ? cell.formulas : formulas;
        cell.text = text;
        if (isHave(cell.value) === false) {
            cell.value = cell.text;
        }
        if (what !== 'date') {
            this.workbook.change(ri, ci, cell, deepCopy(cell));
        }
    }

    moveChange(arr, arr2, arr3) {
        if (arr.length != arr2.length && arr3.length != arr2.length) {
            return;
        }
        this.each((ri) => {
            this.eachCells(ri, (ci) => {
                for (let i = 0; i < arr.length; i++) {
                    let cell = this.getCell(ri, ci);
                    let s1 = arr[i];
                    if (!cell) {
                        cell = {};
                    }
                    if (!isHave(cell.formulas)) {
                        cell.formulas = "";
                    }

                    let formulas = changeFormula(cutStr(cell.formulas));

                    if (formulas.indexOf(s1) != -1) {
                        let ca = arr3[i].replace(/\$/g, "\\$");

                        this.setCellAll(ri, ci, cell.text.replace(new RegExp(ca, 'g'), arr2[i]),
                            cell.formulas.replace(ca, arr2[i]));
                    } else {
                        let s = value2absolute(s1);
                        let es = value2absolute(arr2[i]);
                        if (formulas.indexOf(s.s3) != -1) {
                            s = value2absolute(arr3[i]);

                            s.s3 = s.s3.replace(/\$/g, "\\$");
                            this.setCellAll(ri, ci, cell.text.replace(new RegExp(s.s3, 'g'), es.s3),
                                cell.formulas.replace(new RegExp(s.s3, 'g'), es.s3));
                        } else if (formulas.indexOf(s.s2) != -1) {
                            s = value2absolute(arr3[i]);
                            s.s2 = s.s2.replace(/\$/g, "\\$");
                            this.setCellAll(ri, ci, cell.text.replace(new RegExp(s.s2, 'g'), es.s2),
                                cell.formulas.replace(new RegExp(s.s2, 'g'), es.s2));
                        } else if (formulas.indexOf(s.s1) != -1) {
                            s = value2absolute(arr3[i]);
                            s.s1 = s.s1.replace(/\$/g, "\\$");

                            this.setCellAll(ri, ci, cell.text.replace(new RegExp(s.s1, 'g'), es.s1),
                                cell.formulas.replace(new RegExp(s.s1, 'g'), es.s1));
                        }
                    }
                }
            });
        });
    }

    formatMoney(s, type) {
        if (/[^0-9\.]/.test(s))
            return "0";
        if (s == null || s == "")
            return "0";
        s = s.toString().replace(/^(\d*)$/, "$1.");
        s = (s + "00").replace(/(\d*\.\d\d)\d*/, "$1");
        s = s.replace(".", ",");
        let re = /(\d)(\d{3},)/;
        while (re.test(s))
            s = s.replace(re, "$1,$2");
        s = s.replace(/,(\d\d)$/, ".$1");
        if (type == 0) {
            let a = s.split(".");
            if (a[1] == "00") {
                s = a[0];
            }
        }
        return s;
    }

    // isValid => true 为日期  false 为 数字
    getCellStyleConvert(cellStyle, isValid) {
        if (cellStyle && cellStyle.format && cellStyle.format === 'number') {
            return "number";
        } else if (
            (isValid && cellStyle === null)
            || (isValid && cellStyle && cellStyle.format !== 'normal')
            || cellStyle && cellStyle.format && cellStyle.format === 'date') {
            return "date";
        } else if ((cellStyle && cellStyle.format && cellStyle.format === 'normal')) {
            return "normal";
        } else if (cellStyle && cellStyle.format && cellStyle.format === 'rmb') {
            return 'rmb';
        }

        return "";
    }

    getCellTextByShift(arr, dei, dci) {
        let bad = false;
        let newStr = "";

        for (let i = 0; i < arr.length; i++) {
            if (arr[i].search(/^[A-Z]+\d+$/) != -1) {
                let ds = expr2xy(arr[i]);
                if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                    bad = true;
                }
                arr[i] = xy2expr(ds[0] + dei, ds[1] + dci);
            } else if (arr[i].search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) != -1) {
                let a1 = arr[i].split(":")[0];
                let a2 = arr[i].split(":")[1];
                let ds1 = expr2xy(a1);
                let ds2 = expr2xy(a2);

                if (ds1[0] + dei < 0 || ds1[1] + dci < 0) {
                    bad = true;
                }
                if (ds2[0] + dei < 0 || ds2[1] + dci < 0) {
                    bad = true;
                }

                let s = xy2expr(ds1[0] + dei, ds1[1] + dci) + ":";
                s += xy2expr(ds2[0] + dei, ds2[1] + dci)
                arr[i] = s;
            } else {
                let value = isAbsoluteValue(arr[i], 5);

                if (value === 2) {
                    let ds = expr2xy(arr[i].replace(/\$/g, ''));
                    if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                        bad = true;
                    }

                    arr[i] = xy2expr(ds[0] + dei, ds[1], 2);
                } else if (value === 1) {
                    let ds = expr2xy(arr[i].replace(/\$/g, ''));
                    if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                        bad = true;
                    }

                    arr[i] = xy2expr(ds[0], ds[1] + dci, 1);
                } else if (value === 4) {
                    let sp = arr[i].split(":");
                    console.log(arr[i], sp);
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }

                        sp[item] = xy2expr(ds[0] + dei, ds[1], 2);
                    }
                    arr[i] = sp.join(':');
                } else if (value === 5) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }
                        if (item === 1) {
                            sp[item] = xy2expr(ds[0], ds[1] + dci, 1);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 2);
                        }
                    }
                    arr[i] = sp.join(':');
                } else if (value === 7) {
                    let sp = arr[i].split(':');
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }
                        sp[item] = xy2expr(ds[0], ds[1] + dci, 1);
                    }
                    arr[i] = sp.join(':');
                } else if (value === 6) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }
                        if (item === 0) {
                            sp[item] = xy2expr(ds[0], ds[1] + dci, 1);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 2);
                        }
                    }
                    arr[i] = sp.join(':');
                } else if (value === 8) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }

                        if (item === 0) {
                            sp[item] = xy2expr(ds[0] + dei, ds[1] + dci, 0);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 1);
                        }
                    }
                    arr[i] = sp.join(':');
                } else if (value === 9) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }

                        if (item === 0) {
                            sp[item] = xy2expr(ds[0] + dei, ds[1] + dci, 0);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 2);
                        }
                    }
                    arr[i] = sp.join(':');
                } else if (value === 10) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }

                        if (item === 1) {
                            sp[item] = xy2expr(ds[0] + dei, ds[1] + dci, 0);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 2);
                        }
                    }
                    arr[i] = sp.join(':');
                } else if (value === 11) {
                    let sp = arr[i].split(":");
                    for (let item = 0; item < sp.length; item++) {
                        let ds = expr2xy(sp[item].replace(/\$/g, ''));
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }

                        if (item === 1) {
                            sp[item] = xy2expr(ds[0] + dei, ds[1] + dci, 0);
                        } else {
                            sp[item] = xy2expr(ds[0] + dei, ds[1], 1);
                        }
                    }
                    arr[i] = sp.join(':');
                }
            }
            newStr += arr[i];
        }

        return {
            "bad": bad,
            "result": newStr
        };
    }

    autoFilterRef(ref, range) {
        console.log(range, ref);
        let [ci, ri] = expr2xy(ref);
        let cell = this.getCell(ri, ci);
        while (cell !== null) {
            ri += 1;
            cell = this.getCell(ri, ci);
        }
        range.eri = ri;

        return range;
    }

    // getAllDataType(cellRange)
    getAllDataType(cellRange) {
        const {pasteProxy} = this;
        let isNumber = true, isDate = true, sarr = [];

        cellRange.each((i, j) => {
            let und = false, cell = this.getCell(i, j);
            if (cell) {
                cell = deepCopy(cell);
                let args = new CellProxy(cell).getCellDataType(sarr, {isDate, isNumber});
                // pasteProxy.getCellDataType(cell, sarr, {isDate, isNumber}); // let args = CellProxy(cell).getCellDataType()
                isDate = args.isDate;
                isNumber = args.isNumber;
            } else {
                und = true;
                isNumber = false;
                isDate = false;
            }

            if (und) {
                sarr.push({
                    text: 0,
                    formulas: 0,
                    tmp: "",
                    type: "other",
                });
            }
        });

        return {
            isDate: isDate, isNumber: isNumber, sarr
        }
    }

    calcNumberCellByTopCell(ncell, diffValue, darr, d, what, cb) {
        let {text} = ncell;
        text = this.toString(text);
        let cell = {};
        if (this.isFormula(text)) {
            let last1 = text.replace("=", "") * 1;

            let value = last1 + diffValue;
            cell = {
                "text": "=" + value + "",
                "formulas": "=" + value + "",
            };
        } else if (text !== '') {
            let last1 = text * 1;
            if (text.indexOf(",") != -1) {
                last1 = last1.replace(/,/g, '');
                let value = parseFloat(last1) + diffValue;
                last1 = this.formatMoney(value, 0);
            } else {
                last1 = last1 + diffValue;
            }

            cell = {
                "text": last1 + "",
                "formulas": last1 + "",
            };
        }

        this.copyRender(darr, d.ri, d.ci, cell, what, cb);
    }

    calcFormulaCellByTopCell(iText, darr, d, direction, isAdd) {
        let strList = splitStr(iText);
        let args = this.getRangeByTopCell({ri: d.ri, ci: d.ci}, direction, isAdd);
        let dci = d.ri - args.ri;
        let dri = d.ci - args.ci;
        let {bad, result} = this.getCellTextByShift(strList, dri, dci);
        this.updateCellReferenceByShift(bad, result, d.ri, d.ci);
    }

    calcCellByTopCell(cb, what, ncell, darr, isAdd, iText, d, text) {

        if (!isHave(iText)) {
            iText = "";
        }
        if (!isNaN(iText)) {
            ncell.text = iText;
            ncell.formulas = ncell.text;
        } else {
            let arr = this.toString(iText).split(/\d+/g);
            if (arr) {
                let count = 0;
                if (isAdd) {
                    ncell.text = iText.replace(/\d+/g, (word) => {
                        count = count + 1;
                        if (arr.length - 1 === count) {
                            return word * 1 + 1;
                        } else {
                            return word;
                        }
                    });
                } else {
                    ncell.text = iText.replace(/\d+/g, (word) => {
                        count = count + 1;
                        if (arr.length - 1 === count) {
                            return word * 1 - 1;
                        } else {
                            return word;
                        }
                    });
                }
                ncell.formulas = ncell.text;
            }
        }
        this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
    }

    calcDateCellByTopCell(ncell, darr, d, isAdd, what, cb, diff) {
        if (ncell.text != '') {
            let last1 = ncell.text;

            let value = "";
            if (isAdd) {
                value = dayjs(last1).add(diff, 'day').format('YYYY-MM-DD');
            } else {
                value = dayjs(last1).add(diff, 'day').format('YYYY-MM-DD');
            }
            ncell.text = this.toString(value);
            ncell.formulas = this.toString(value);
            this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
        }
    }

    getRangeByTopCell({ri, ci}, direction, isAdd) {
        if (isAdd) {
            ri = !direction ? ri - 1 : ri;
            ci = !direction ? ci : ci - 1;
        } else {
            ri = !direction ? ri + 1 : ri;
            ci = !direction ? ci : ci + 1;
        }

        return {ri, ci};
    }

    // logProxy.log({"msg":"12312"})  console.log --> logProxy.log
    getCellByTopCell(d, direction, isAdd, what = 'all') {
        if (what === 'date') {
            if (direction === 1) {
                let {ri, ci} = this.getRangeByTopCell({ri: d.ri, ci: d.ci}, false, isAdd);
                return this.getCellByCell(ri, ci);
            } else if (direction === 2) {
                return this.getCellByCell(d.ri, d.ci - 1);
            } else if (direction === 3) {
                return this.getCellByCell(d.ri, d.ci + 1);
            }
        } else {
            let {ri, ci} = this.getRangeByTopCell({ri: d.ri, ci: d.ci}, direction, isAdd);
            return this.getCellByCell(ri, ci);
        }
    }

    getCellByCell(ri, ci) {
        let ncell = this.getCell(ri, ci);
        if (!ncell) {
            ncell = {
                text: '',
                formulas: '',
            }
        }

        return helper.cloneDeep(ncell);
    }

    updateCellReferenceByShift(bad, result, ri, ci) {
        let _cell = {};
        if (bad) {
            _cell.text = "#REF!";
            _cell.formulas = "#REF!";
        } else {
            _cell.text = result != "" ? result : innerText;
            _cell.formulas = result != "" ? result : innerText;
        }
        this.setCell(ri, ci, _cell, 'all');
    }

    // what: all | format | text
    // 填充
    copyPaste(srcCellRange, dstCellRange, what, autofill = false, cb = () => { // todo 用面向对象的思想来重构
    }) {
        const {pasteProxy} = this;
        pasteProxy.setSrcAndDstCellRange(srcCellRange, dstCellRange);
        let {rn, cn} = pasteProxy.use();
        let isLeftRight = pasteProxy.autoFilterDirection(); // todo: upOrDownOrLeftOrRight = pateProxy.getUpDownLeftRight() 去掉482

        let len = isLeftRight ? rn : cn;
        for (let i = 0; i < len; i++) {
            let isDown = pasteProxy.upOrDown();
            let {srcOneDRange, dstOneDRange} = pasteProxy.getOneDRangeObj(isLeftRight, i);
            let {isNumber, isDate, sarr} = this.getAllDataType(srcOneDRange); // todo: 改成与Excel一样的逻辑 let {isNumber, isDate, sarr} = this.getRangeDataType(srcOneDRange);
            // let isCopy = pasteProxy.isCopy(sarr, i);

            let darr = dstOneDRange.getLocationArray(sarr); //let dstOneDLocationAarray = dstOneDRange.getLocationArray()
            let line = pasteProxy.leftOrRight(); // 向左或者向右
            let other = false;

            for (let i = 0; i < darr.length; i++) {
                let d = darr[i];
                if (isNumber || d.type === 'number' || isDate || d.type === 'date') {
                    other = true;
                }
            }

            if (isDown) {
                for (let i = 0; i < darr.length; i++) {
                    let d = darr[i];
                    if (isNumber || d.type === 'number') {
                        let diffValue = pasteProxy.calcDiff(sarr, isDown);
                        numberAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, diffValue, what, cb, isNumber);
                    } else if (isDate || d.type === 'date') {
                        dateAutoFilter.call(this, darr[i], line, isDown, darr, what, cb, isDate);
                    } else {
                        otherAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, what, cb, other);
                    }
                }
            } else {
                for (let i = darr.length - 1; i >= 0; i--) {
                    let d = darr[i];
                    if (isNumber || d.type === 'number') {
                        let diffValue = pasteProxy.calcDiff(sarr, isDown);
                        numberAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, diffValue, what, cb, isNumber);
                    } else if (isDate || d.type === 'date') {
                        dateAutoFilter.call(this, darr[i], line, isDown, darr, what, cb, isDate);
                    } else {
                        otherAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, what, cb, other);
                    }
                }
            }

            // if (isNumber) {
            //     let diffValue = pasteProxy.calcDiff(sarr, isDown);
            //
            //     if (isDown) {
            //         for (let i = 0; i < darr.length; i++) {
            //             numberAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, diffValue, what, cb);
            //         }
            //     } else {
            //         for (let i = darr.length - 1; i >= 0; i--) {
            //             numberAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, diffValue, what, cb);
            //         }
            //     }
            // } else if (isDate) {
            //     if (isDown) {
            //         for (let i = 0; i < darr.length; i++) {
            //             dateAutoFilter.call(this, darr[i], line === 3 ? true : false, isDown, darr, what, cb);
            //         }
            //     } else {
            //         for (let i = darr.length - 1; i >= 0; i--) {
            //             dateAutoFilter.call(this, darr[i], line === 2 ? true : false, isDown, darr, what, cb);
            //         }
            //     }
            // } else {
            //     if (isDown) {
            //         for (let i = 0; i < darr.length; i++) {
            //             otherAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, what, cb);
            //         }
            //     } else {
            //         for (let i = darr.length - 1; i >= 0; i--) {
            //             otherAutoFilter.call(this, darr[i], darr, isLeftRight, isDown, what, cb);
            //         }
            //     }
            // }
        }
    }

    getMax() {
        let mri = 0, mci = 0;
        this.each((ri) => {
            ri = ri * 1;
            if (mri < ri) {
                mri = ri;
            }

            this.eachCells(ri, (ci) => {
                ci = ci * 1;
                if (mci < ci) {
                    mci = ci;
                }
            });
        });
        return {
            mri,
            mci
        }
    }

    copyRender(darr, nri, nci, ncell, what, cb) {
        let as = false;
        for (let k = 0; as == false && k < darr.length; k++) {
            if (darr[k].ri == nri && darr[k].ci == nci) {
                as = true;
            }
        }
        if (as) {
            this.setCell(nri, nci, ncell, what);
            cb(nri, nci, ncell);
        }
    }

    cutPaste(srcCellRange, dstCellRange) {
        let srcCell = [];
        // const ncellmm = {};
        this.each((ri) => {
            this.eachCells(ri, (ci) => {
                let nri = parseInt(ri, 10);
                let nci = parseInt(ci, 10);
                if (srcCellRange.includes(ri, ci)) {
                    nri = dstCellRange.sri + (nri - srcCellRange.sri);
                    nci = dstCellRange.sci + (nci - srcCellRange.sci);
                }

                if (ri * 1 !== nri || ci * 1 !== nci) {
                    // ncellmm[nri] = ncellmm[nri] || {cells: {}};
                    if (this._[ri].cells[ci].text != '' && this._[ri].cells[ci].formulas != '') {
                        srcCell.push({
                            nri: nri,
                            nci: nci,
                            ri: ri,
                            ci: ci,
                            cell: deepCopy(this._[ri].cells[ci]),
                        })
                        // this.setCell(nri, nci, this._[ri].cells[ci], 'all');
                    }

                    // if (this._[ri].cells[ci].style) {
                    //     this.setCell(nri, nci, this._[ri].cells[ci], 'all');
                    // }
                }
            });
        });
        for (let i = 0; i < srcCell.length; i++) {
            let {ri, ci, cell} = srcCell[i];
            this.setCell(ri, ci, {}, 'all');
        }

        for (let i = 0; i < srcCell.length; i++) {
            let {nri, nci, cell} = srcCell[i];
            this.setCell(nri, nci, cell, 'all');
        }

        // this._ = ncellmm;
    }

    insert(sri, n = 1) {
        const ndata = {};
        this.each((ri, row) => {
            let nri = parseInt(ri, 10);
            if (nri >= sri) {
                nri += n;
            }
            ndata[nri] = row;
        });
        this._ = ndata;
        this.len += n;
    }

    delete(sri, eri) {
        const n = eri - sri + 1;
        const ndata = {};
        this.each((ri, row) => {
            const nri = parseInt(ri, 10);
            if (nri < sri) {
                ndata[nri] = row;
            } else if (ri > eri) {
                ndata[nri - n] = row;
            }
        });
        this._ = ndata;
        this.len -= n;
    }

    insertColumn(sci, n = 1) {
        this.each((ri, row) => {
            const rndata = {};
            this.eachCells(ri, (ci, cell) => {
                let nci = parseInt(ci, 10);
                if (nci >= sci) {
                    nci += n;
                }
                rndata[nci] = cell;
            });
            row.cells = rndata;
        });
    }

    deleteColumn(sci, eci) {
        const n = eci - sci + 1;
        this.each((ri, row) => {
            const rndata = {};
            this.eachCells(ri, (ci, cell) => {
                const nci = parseInt(ci, 10);
                if (nci < sci) {
                    rndata[nci] = cell;
                } else if (nci > eci) {
                    rndata[nci - n] = cell;
                }
            });
            row.cells = rndata;
        });
    }

    // what: all | text | format | merge
    deleteCells(cellRange, what = 'all') {
        cellRange.each((i, j) => {
            this.deleteCell(i, j, what);
        });
    }

    // what: all | text | format | merge
    deleteCell(ri, ci, what = 'all') {
        const row = this.get(ri);
        if (row !== null) {
            const cell = this.getCell(ri, ci);
            if (cell !== null) {
                this.workbook.deleteWorkbook(ri, ci, what);
                if (what === 'all') {
                    delete row.cells[ci];
                } else if (what === 'text') {
                    if (cell.text) delete cell.text;
                    if (cell.value) delete cell.value;
                    if (cell.formulas) delete cell.formulas;
                } else if (what === 'format') {
                    if (cell.style !== undefined) delete cell.style;
                    if (cell.merge) delete cell.merge;
                } else if (what === 'merge') {
                    if (cell.merge) delete cell.merge;
                }
            }
        }
    }

    each(cb) {
        Object.entries(this._).forEach(([ri, row]) => {
            cb(ri, row);
        });
    }

    eachCells(ri, cb) {
        if (this._[ri] && this._[ri].cells) {
            Object.entries(this._[ri].cells).forEach(([ci, cell]) => {
                cb(ci, cell);
            });
        }
    }

    recast(cell) {
        try {
            if (this.isReferOtherSheet(cell, true)) {
                let recast = new Recast(cell.formulas);
                recast.parse();
                cell['recast'] = recast;
            } else {
                cell['recast'] = null;
            }
        } catch (e) {
            cell['recast'] = null;
        }
    }

    setWorkBook(type, workbook) {
        this.workbook.setWorkBook(type, workbook);
    }

    setData(d, sheet = "", out = false) {
        try {
            if (d.len) {
                this.len = d.len;
                delete d.len;
            }
            this._ = d;

            // 为什么要判断sheet = '' ?
            if (out) {
                const {table, data} = sheet;
                const {proxy} = table;
                let workbook = proxy.outCalc(this._, this.workbook.getWorkbook(2), data.name);
                this.workbook.setWorkBook(2, workbook);
                proxy.setOldData(workbook);
            } else if (sheet !== '') {
                const {table, data} = sheet;
                const {proxy} = table;
                this.workbook.init(this._, data, proxy, table);
                let viewRange = data.viewRange();

                let workbook_no_formula = this.workbook.getWorkbook(2);
                proxy.setOldData(workbook_no_formula);
            }

            // this.each((ri, row) => {
            //     this.eachCells(ri, (ci, cell) => {
            //         if(this.isReferOtherSheet(cell, true)) {
            //             this.recast(cell);
            //         }
            //     });
            // });

        } catch (e) {
            console.error("745", e);
        }
    }

    getData() {
        const {len} = this;
        return Object.assign({len}, this._);
    }
}

export default {};
export {
    Rows,
};

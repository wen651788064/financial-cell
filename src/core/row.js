import helper, {isHave} from './helper';
import {expr2expr, xy2expr} from './alphabet';
import {absoluteType, changeFormula, cutStr, isAbsoluteValue, value2absolute} from "../core/operator";
import {expr2xy} from "../core/alphabet";
import dayjs from 'dayjs'
import {deepCopy, isSheetVale} from "./operator";
import Recast from "./recast";
import WorkBook from "./workbook_cacl_proxy";
import PasteProxy from "./paste_proxy";

export function isFormula(text) {
    if (text && text[0] === "=") {
        return true;
    }

    return false;
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
        if (row !== undefined && row.cells !== undefined && row.cells[ci] !== undefined) {
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

    compile() {
        const {pasteProxy} = this;
        let number = true, nA = true, nD = true, sarr = [];
        let {fackSRange} = pasteProxy.getRangeByWay();

        fackSRange.each((i, j) => {
            let und = false, cell = this.getCell(i, j);
            if (cell) {
                nA, nD, number = pasteProxy.calcType(cell, sarr);
            } else {
                und = true;
            }

            if (und) {
                sarr.push({
                    text: 0,
                    formulas: 0
                });
            }
        });

        return {
            nA, nD, number, sarr
        }
    }

    rangeDArr() {
        const {pasteProxy} = this;
        let {fackDRange} = pasteProxy.getRangeByWay();

        let darr = [];
        fackDRange.each((i, j) => {
            darr.push({ri: i, ci: j});
        });

        return darr;
    }

    calcCellByTopCell(ncell, diffValue, darr, what, cb) {
        let {text} = ncell;
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

    getCellByTopCell(d, direction) {
        let {ri, ci} = d;
        let ncell = "";
        if (!direction) {
            ncell = this.getCell(ri - 1, ci);

            if (!ncell) {
                ncell = {
                    text: 0,
                    formulas: 0,
                }
            }
        } else {
            ncell = this.getCell(ri, ci - 1);

            if (!ncell) {
                ncell = {
                    text: 0,
                    formulas: 0,
                }
            }
        }

        return helper.cloneDeep(ncell);
    }

    // what: all | format | text
    copyPaste(srcCellRange, dstCellRange, what, autofill = false, cb = () => { // todo 用面向对象的思想来重构
    }) {
        const {pasteProxy} = this;
        pasteProxy.setSrcAndDstCellRange(srcCellRange, dstCellRange);
        let {sri, sci, eri, eci, dsri, dsci, deri, deci, rn, cn} = pasteProxy.use();
        let direction = pasteProxy.autoFilterDirection();

        let len = direction ? rn : cn;
        for (let i = 0; i < len; i++) {
            let {isAdd, dn} = pasteProxy.upOrDown();
            pasteProxy.rangeByWay(direction, i);
            let diffValue = 0;
            let {number, nA, nD, sarr} = this.compile();
            let isCopy = pasteProxy.isCopy(sarr, i);

            let darr = this.rangeDArr();
            let line = pasteProxy.leftOrRight(); // 向左或者向右

            if (number && isCopy) {
                if (isAdd) {
                    let diffValue = pasteProxy.calcDiff(sarr, isAdd);

                    for (let i = 0; i < darr.length; i++) {
                        let d = darr[i];
                        let ncell = this.calcCellByTopCell(d, direction);
                        this.calcCellByTopCell(ncell, diffValue, darr, what, cb);
                    }
                } else {
                    let diffValue = pasteProxy.calcDiff(sarr, isAdd);

                    for (let i = darr.length - 1; i >= 0; i--) {
                        let d = darr[i];
                        let ncell = "";
                        if (!direction) {
                            if (!this._ || !this._[d.ri + 1] || !this._[d.ri + 1].cells[d.ci]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri + 1].cells[d.ci]);
                            }
                        } else {
                            if (!this._ || !this._[d.ri] || !this._[d.ri].cells[d.ci + 1]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri].cells[d.ci + 1]);
                            }
                        }
                        if (ncell.text[0] == "=") {
                            let last1 = ncell.text.replace("=", "") * 1;

                            let value = last1 + diffValue;
                            ncell.text = "=" + value + "";
                            ncell.formulas = "=" + value + "";
                            this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
                        } else if (ncell.text != '') {
                            if (ncell.text.indexOf(",") != -1) {
                                let last1 = ncell.text;
                                last1 = last1.replace(/,/g, '');
                                let value = parseFloat(last1) + diffValue;
                                last1 = this.formatMoney(value, 0);

                                ncell.text = last1 + "";
                                ncell.formulas = last1 + "";
                                this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
                            } else {
                                let last1 = ncell.text * 1;

                                let value = last1 + diffValue;
                                ncell.text = value + "";
                                ncell.formulas = value + "";
                                this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
                            }
                        }
                    }
                }
            } else if (nD && isCopy) {
                if (isAdd) {
                    for (let i = 0; i < darr.length; i++) {
                        let d = darr[i];
                        let ncell = "";
                        if (line === 1) {
                            if (!this._ || !this._[d.ri - 1] || !this._[d.ri - 1].cells[d.ci]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri - 1].cells[d.ci]);
                            }
                        } else {
                            if (line == 3) {
                                if (!this._ || !this._[d.ri] || !this._[d.ri].cells[d.ci - 1]) {
                                    ncell = {
                                        text: 0,
                                        formulas: 0,
                                    }
                                } else {
                                    ncell = helper.cloneDeep(this._[d.ri].cells[d.ci - 1]);
                                }
                            }
                        }
                        if (ncell.text != '') {
                            let last1 = ncell.text;

                            let value = dayjs(last1).add(1, 'day').format('YYYY-MM-DD');
                            ncell.text = value + "";
                            ncell.formulas = value + "";
                            this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
                        }
                    }
                } else {
                    for (let i = darr.length - 1; i >= 0; i--) {
                        let d = darr[i];
                        let ncell = "";
                        if (line === 1) {
                            if (!this._ || !this._[d.ri + 1] || !this._[d.ri + 1].cells[d.ci]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri + 1].cells[d.ci]);
                            }
                        }
                        else if (line == 2) {
                            if (!this._ || !this._[d.ri] || !this._[d.ri].cells[d.ci + 1]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri].cells[d.ci + 1]);
                            }
                        }

                        if (ncell.text != '') {
                            let last1 = ncell.text;

                            let value = dayjs(last1).add(-1, 'day').format('YYYY-MM-DD');
                            ncell.text = value + "";
                            ncell.formulas = value + "";
                            this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
                        }
                    }
                }
            } else {
                for (let i = sri; i <= eri; i += 1) {
                    if (this._[i]) {
                        for (let j = sci; j <= eci; j += 1) {
                            if (this._[i].cells && this._[i].cells[j]) {
                                let added = 1;
                                for (let ii = dsri; ii <= deri; ii += rn) {
                                    for (let jj = dsci; jj <= deci; jj += cn) {
                                        const nri = ii + (i - sri);
                                        const nci = jj + (j - sci);
                                        const ncell = helper.cloneDeep(this._[i].cells[j]);
                                        // ncell.text
                                        if (autofill && ncell && ncell.text && ncell.text.length > 0 && isCopy) {
                                            let {text, formulas} = ncell;
                                            if (formulas != "") {
                                                text = formulas;
                                            }
                                            let n = (jj - dsci) + (ii - dsri) + 2;
                                            if (!isAdd) {
                                                n -= dn + 1;
                                            }
                                            if (text[0] === '=') {
                                                ncell.text = text.replace(/\w{1,5}\d|\w{1,5}\$\d|\$\w{1,5}\d/g, (word) => {
                                                    word = word.toUpperCase();
                                                    if (isAbsoluteValue(word, 3) == false) {
                                                        return word;
                                                    }
                                                    let type = absoluteType(word);
                                                    let [xn, yn] = [0, 0];
                                                    if (sri === dsri && type != 1) {
                                                        xn = n - 1;
                                                        // if (isAdd) xn -= 1;
                                                    } else if (type != 2) {
                                                        if (type == 1 && sri === dsri) {

                                                        } else {
                                                            yn = n - 1;
                                                        }
                                                    }

                                                    // 往下是true  往上是false
                                                    yn += 1;
                                                    let a = expr2xy(word.replace("$", ""), '');
                                                    if ((a[0] - Math.abs(xn) < 0 && xn < 0) || (a[1] - Math.abs(yn) < 0 && yn <= 0)) {
                                                        return "#REF!";
                                                    }


                                                    if (text.toUpperCase().indexOf(word + "!") != -1) {
                                                        return word;
                                                    }
                                                    let txt = expr2expr(word.replace("$", ""), xn, yn);
                                                    if (type == 1) {
                                                        // txt = "$" + word.replace("$", "");
                                                        txt = "$" + txt;
                                                    } else if (type == 2) {
                                                        let str = "", enter = 1;
                                                        for (let i = 0; i < txt.length; i++) {
                                                            if (parseInt(txt[i]) >= 0 && parseInt(txt[i]) <= 9 && enter == 1) {
                                                                str += "$";
                                                                enter = 2;
                                                            }
                                                            str += txt[i];
                                                        }
                                                        txt = str;
                                                    }

                                                    // console.log('xn:', xn, ', yn:', yn, word, expr2expr(word, xn, yn));
                                                    if (txt.replace(/[^-(0-9)]/ig, "") <= 0) {
                                                        return "#REF!";
                                                    }
                                                    return txt;
                                                });

                                                if (ncell.text.indexOf("#REF!") != -1) {
                                                    ncell.text = "#REF!";
                                                }

                                                // if(text.indexOf("CITY(") == -1) {
                                                ncell.formulas = ncell.text;
                                                // }

                                            } else {
                                                const result = /[\\.\d]+$/.exec(text);
                                                // console.log('result:', result);
                                                if (result !== null) {
                                                    const index = Number(result[0]) + added;
                                                    added += 1;
                                                    ncell.text = text.substring(0, result.index) + index;
                                                    ncell.formulas = ncell.text;
                                                }
                                            }
                                        }
                                        this.copyRender(darr, nri, nci, ncell, what, cb);
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
        const ncellmm = {};
        this.each((ri) => {
            this.eachCells(ri, (ci) => {
                let nri = parseInt(ri, 10);
                let nci = parseInt(ci, 10);
                if (srcCellRange.includes(ri, ci)) {
                    nri = dstCellRange.sri + (nri - srcCellRange.sri);
                    nci = dstCellRange.sci + (nci - srcCellRange.sci);
                }

                if (ri * 1 !== nri || ci * 1 !== nci) {
                    ncellmm[nri] = ncellmm[nri] || {cells: {}};
                    if (this._[ri].cells[ci].text != '' && this._[ri].cells[ci].formulas != '') {
                        this.setCell(nri, nci, this._[ri].cells[ci], 'all');
                    }

                    if (this._[ri].cells[ci].style) {
                        // if (!ncellmm[nri].cells[nci]) {
                        //     ncellmm[nri].cells[nci] = {
                        //         "style": this._[ri].cells[ci].style,
                        //     }
                        //     this.setCell(ri, ci, this._[ri].cells[ci], 'all');
                        // } else {
                        //     this.setCell(ri, ci, this._[ri].cells[ci], 'all');
                        //     ncellmm[nri].cells[nci]['style'] = this._[ri].cells[ci].style;
                        // }
                        this.setCell(nri, nci, this._[ri].cells[ci], 'all');
                    }

                    this.setCell(ri, ci, {}, 'all');
                }
            });
        });
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

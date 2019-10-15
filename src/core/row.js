import helper from './helper';
import {expr2expr, xy2expr} from './alphabet';
import {absoluteType, changeFormula, cutStr, isAbsoluteValue, value2absolute} from "../core/operator";
import {expr2xy} from "../core/alphabet";
import CellRange from "./cell_range";
import dayjs from 'dayjs'
import {isSheetVale} from "./operator";
import Recast from "./recast";
import {loadData, parseCell2} from "../component/table";

// 2019-10-11 cell里新增一个字段   recast
/* 目前数据结构 =>
    cell = {
        "text": "",
        "formula: "",
        "style": "",
        "recast": recast
    }
 */
class Rows {
    constructor({len, height}) {
        this._ = {};
        this.len = len;
        // default row height
        this.height = height;
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

    getRegularText(text) {
        return text + "";
    }

    backEndCalc(text) {
        if (text.indexOf("MD.RTD") != -1) {
            return true;
        }

        return false;
    }

    isNeedCalc(cell, state = false) {
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

    textIsFormula(text) {
        if (text && text[0] === "=") {
            return true;
        }
        return false;
    }

    // what: all | text | format
    setCell(ri, ci, cell, what = 'all') {
        const row = this.getOrNew(ri);
        if (what === 'all') {
            row.cells[ci] = cell;
        } else if (what === 'text') {
            row.cells[ci] = row.cells[ci] || {};
            row.cells[ci].text = cell.text;
        } else if (what === 'format') {
            row.cells[ci] = row.cells[ci] || {};
            row.cells[ci].style = cell.style;
            if (cell.merge) row.cells[ci].merge = cell.merge;
        }
        // this.recast(cell);
    }

    setCellText(ri, ci, text, proxy = "", name = "") {
        const cell = this.getCellOrNew(ri, ci);
        cell.formulas = text;
        cell.text = text;  // todo 自定义公式： text 为公式计算结果, formulas 为公式
        // this.recast(cell);
        if (typeof proxy != "string") {
            proxy.setCell(name, xy2expr(ci, ri));
        }
    }

    setCellAll(ri, ci, text, formulas = "") {
        const cell = this.getCellOrNew(ri, ci);
        cell.formulas = formulas == "" ? cell.formulas : formulas;
        cell.text = text;
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
        var re = /(\d)(\d{3},)/;
        while (re.test(s))
            s = s.replace(re, "$1,$2");
        s = s.replace(/,(\d\d)$/, ".$1");
        if (type == 0) {
            var a = s.split(".");
            if (a[1] == "00") {
                s = a[0];
            }
        }
        return s;
    }

    // what: all | format | text
    copyPaste(srcCellRange, dstCellRange, what, autofill = false, cb = () => {
    }) {
        const {
            sri, sci, eri, eci,
        } = srcCellRange;

        const dsri = dstCellRange.sri;
        const dsci = dstCellRange.sci;
        const deri = dstCellRange.eri;
        const deci = dstCellRange.eci;


        const [rn, cn] = srcCellRange.size();
        const [drn, dcn] = dstCellRange.size();

        let level = false;
        if (sri == dsri && deri == eri) {
            level = true;
        }

        let len = level ? rn : cn;
        for (let i = 0; i < len; i++) {
            let isAdd = true;       // 往上是false, 往下是true
            let isCopy = false;
            let dn = 0;
            if (deri < sri || deci < sci) {
                isAdd = false;
                if (deri < sri) dn = drn;
                else dn = dcn;
            }

            let fackSRange = "";
            let fackDRange = "";
            if (!level) {
                fackSRange = new CellRange(sri, sci + i, eri, sci + i);
                fackDRange = new CellRange(dsri, dsci + i, deri, dsci + i);
            } else if (level) {
                fackSRange = new CellRange(sri + i, sci, sri + i, eci);
                fackDRange = new CellRange(dsri + i, dsci, dsri + i, deci);
            }

            let sarr = [];

            let number = true, diffValue = 0, nA = true, nD = true;
            fackSRange.each((i, j) => {
                let und = false;
                if (this._[i]) {
                    if (this._[i].cells && this._[i].cells[j]) {
                        const ncell = helper.cloneDeep(this._[i].cells[j]);
                        let enter = false;
                        for (let k = 0; enter == false && k < sarr.length; k++) {
                            if (sarr[k].text === ncell.text) {
                                enter = true;
                            }
                        }
                        if (enter == false) {
                            sarr.push(ncell);
                        }

                        let value = ncell.formulas !== "" ? ncell.formulas + "" : ncell.text + "";
                        value = value.replace(/,/g, "");
                        let ns = value.replace("=", "") * 1;
                        if ((ns || ns == 0) && typeof ns === 'number' && number == true) {
                            number = true;
                            nA = false;
                            nD = false;
                            // nF = false;
                        } else if (value && nA == true && value[0] === '=') {
                            nA = true;
                            number = false;
                            nD = false;
                            // nF = false;
                        } else if (value && nD == true && value.search(/((^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(10|12|0?[13578])([-\/\._])(3[01]|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(11|0?[469])([-\/\._])(30|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(0?2)([-\/\._])(2[0-8]|1[0-9]|0?[1-9])$)|(^([2468][048]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([3579][26]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][13579][26])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][13579][26])([-\/\._])(0?2)([-\/\._])(29)$))/ig, '') != -1) {
                            nA = false;
                            number = false;
                            nD = true;
                            // nF = false;
                        } else {
                            nA = false;
                            number = false;
                            nD = false;
                            // nF = false;
                        }
                    } else {
                        und = true;
                    }
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

            if (sarr.length > 1) {
                isCopy = true;
            }
            if (sri == eri && sci + i == sci + i) {
                isCopy = true;
            }

            let darr = [];
            fackDRange.each((i, j) => {
                darr.push({
                    ri: i,
                    ci: j
                });
            });

            let line = 1;       // 往左往右
            if (fackDRange.sri === fackDRange.eri && fackSRange.eci > fackDRange.eci) {
                line = 2;       // 往右
            } else if (fackDRange.sri === fackDRange.eri && fackSRange.eci < fackDRange.eci) {
                line = 3;       // 往左
            }


            if (number && isCopy) {
                if (isAdd) {
                    if (number && sarr.length > 1) {
                        let last2 = sarr[sarr.length - 2];
                        let last1 = sarr[sarr.length - 1];
                        diffValue = last1.text * 1 - last2.text * 1;
                    } else {
                        diffValue = 1;
                    }
                    for (let i = 0; i < darr.length; i++) {
                        let d = darr[i];
                        let ncell = "";
                        if (!level) {
                            if (!this._ || !this._[d.ri - 1] || !this._[d.ri - 1].cells[d.ci]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri - 1].cells[d.ci]);
                            }
                        } else {
                            if (!this._ || !this._[d.ri] || !this._[d.ri].cells[d.ci - 1]) {
                                ncell = {
                                    text: 0,
                                    formulas: 0,
                                }
                            } else {
                                ncell = helper.cloneDeep(this._[d.ri].cells[d.ci - 1]);
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
                } else {
                    if (number && sarr.length > 1) {
                        let last2 = sarr[1];
                        let last1 = sarr[0];
                        diffValue = last1.text * 1 - last2.text * 1;
                    } else {
                        diffValue = -1;
                    }

                    for (let i = darr.length - 1; i >= 0; i--) {
                        let d = darr[i];
                        let ncell = "";
                        if (!level) {
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

                ncellmm[nri] = ncellmm[nri] || {cells: {}};
                if (this._[ri].cells[ci].text != '' && this._[ri].cells[ci].formulas != '') {
                    ncellmm[nri].cells[nci] = this._[ri].cells[ci];
                }
                if (this._[ri].cells[ci].style) {
                    if (!ncellmm[nri].cells[nci]) {
                        ncellmm[nri].cells[nci] = {
                            "style": this._[ri].cells[ci].style,
                        }
                    } else {
                        ncellmm[nri].cells[nci]['style'] = this._[ri].cells[ci].style;
                    }

                }
            });
        });
        this._ = ncellmm;
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
            if (this.isNeedCalc(cell, true)) {
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

    setData(d, sheet = "") {
        try {
            if (d.len) {
                this.len = d.len;
                delete d.len;
            }
            this._ = d;
            if (sheet !== '') {
                const {table, data} = sheet;
                const {proxy} = table;
                let viewRange = data.viewRange();
                let {workbook2} = loadData.call(table, viewRange, false, true);
                proxy.setOldData(workbook2);
            }

            // this.each((ri, row) => {
            //     this.eachCells(ri, (ci, cell) => {
            //         if(this.isNeedCalc(cell, true)) {
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

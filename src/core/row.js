import helper from './helper';
import {expr2expr} from './alphabet';
import {absoluteType, isAbsoluteValue, value2absolute, changeFormula} from "../core/operator";
import {expr2xy} from "../core/alphabet";
import {cutStr} from "../core/operator";

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
    }

    setCellText(ri, ci, text) {
        const cell = this.getCellOrNew(ri, ci);
        cell.formulas = text;
        cell.text = text;  // todo 自定义公式： text 为公式计算结果, formulas 为公式
    }

    setCellAll(ri, ci, text, formulas) {
        const cell = this.getCellOrNew(ri, ci);
        cell.formulas = formulas;
        cell.text = text;
    }


     moveChange(arr, arr2, arr3) {
        if (arr.length != arr2.length && arr3.length != arr2.length)  {
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
                        } else if(formulas.indexOf(s.s2) != -1) {
                            s = value2absolute(arr3[i]);
                            s.s2 = s.s2.replace(/\$/g, "\\$");
                            this.setCellAll(ri, ci, cell.text.replace(new RegExp(s.s2, 'g'), es.s2),
                                cell.formulas.replace(new RegExp(s.s2, 'g'), es.s2));
                        } else if(formulas.indexOf(s.s1) != -1) {
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
        // console.log(srcIndexes, dstIndexes);
        let isAdd = true;
        let dn = 0;
        if (deri < sri || deci < sci) {
            isAdd = false;
            if (deri < sri) dn = drn;
            else dn = dcn;
        }
        // console.log('drn:', drn, ', dcn:', dcn, dn, isAdd);
        for (let i = sri; i <= eri; i += 1) {
            if (this._[i]) {
                for (let j = sci; j <= eci; j += 1) {
                    if (this._[i].cells && this._[i].cells[j]) {
                        for (let ii = dsri; ii <= deri; ii += rn) {
                            for (let jj = dsci; jj <= deci; jj += cn) {
                                const nri = ii + (i - sri);
                                const nci = jj + (j - sci);
                                const ncell = helper.cloneDeep(this._[i].cells[j]);
                                // ncell.text
                                if (autofill && ncell && ncell.text && ncell.text.length > 0) {
                                    const {text} = ncell;
                                    let n = (jj - dsci) + (ii - dsri) + 2;
                                    if (!isAdd) {
                                        n -= dn + 1;
                                    }
                                    if (text[0] === '=') {
                                        ncell.text = text.replace(/\w{1,3}\d|\w{1,3}\$\d|\$\w{1,3}\d/g, (word) => {
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

                                            let txt = expr2expr(word.replace("$", ""), xn, yn);
                                            if (type == 1) {
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
                                        ncell.formulas = ncell.text;
                                    } else {
                                        const result = /[\\.\d]+$/.exec(text);
                                        // console.log('result:', result);
                                        if (result !== null) {
                                            const index = Number(result[0]) + n - 1;
                                            ncell.text = text.substring(0, result.index) + index;
                                            ncell.formulas = ncell.text;
                                        }
                                    }
                                }
                                this.setCell(nri, nci, ncell, what);
                                cb(nri, nci, ncell);
                            }
                        }
                    }
                }
            }
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
                ncellmm[nri].cells[nci] = this._[ri].cells[ci];
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

    setData(d) {
        if (d.len) {
            this.len = d.len;
            delete d.len;
        }
        this._ = d;
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

import CellRange from "./cell_range";
import {isFormula} from "./row";
import helper from "./helper";

export default class PasteProxy {
    constructor(srcCellRange, dstCellRange, rows) {
        this.srcCellRange = "";
        this.dstCellRange = "";
        this.fackSRange = "";
        this.fackDRange = "";
    }

    setSrcAndDstCellRange(srcCellRange, dstCellRange) {
        this.srcCellRange = srcCellRange;
        this.dstCellRange = dstCellRange;
    }

    use() {
        let {srcCellRange, dstCellRange} = this;
        const {
            sri, sci, eri, eci,
        } = srcCellRange;

        const dsri = dstCellRange.sri;
        const dsci = dstCellRange.sci;
        const deri = dstCellRange.eri;
        const deci = dstCellRange.eci;
        const [rn, cn] = srcCellRange.size();
        const [drn, dcn] = dstCellRange.size();

        return {
            sri, sci, eri, eci, dsri, dsci, deri, deci, rn, cn, drn, dcn
        }
    }

    autoFilterDirection() {
        let {sri, dsri, deri, eri} = this.use();

        let way = false; // 识别方向  上下false、左右true
        if (sri == dsri && deri == eri) {
            way = true;
        }

        return way;
    }

    upOrDown() {
        let {deri, sri, deci, sci, drn, dcn} = this.use();
        let isAdd = true;       // 往上是false, 往下是true
        let dn = 0;
        if (deri < sri || deci < sci) {
            isAdd = false;
            if (deri < sri) dn = drn;
            else dn = dcn;
        }

        return {
            dn, isAdd
        }
    }

    leftOrRight() {
        let {fackSRange, fackDRange} = this.getRangeByWay();
        let line = 1;       // 往左往右
        if (fackDRange.sri === fackDRange.eri && fackSRange.eci > fackDRange.eci) {
            line = 2;       // 往右
        } else if (fackDRange.sri === fackDRange.eri && fackSRange.eci < fackDRange.eci) {
            line = 3;       // 往左
        }
        return line;
    }

    rangeByWay(way, offset) {
        let {sri, sci, eri, eci, dsri, dsci, deri, deci} = this.use();

        if (!way) {
            this.fackSRange = new CellRange(sri, sci + offset, eri, sci + offset);
            this.fackDRange = new CellRange(dsri, dsci + offset, deri, dsci + offset);
        } else {
            this.fackSRange = new CellRange(sri + offset, sci, sri + offset, eci);
            this.fackDRange = new CellRange(dsri + offset, dsci, dsri + offset, deci);
        }

        return this.getRangeByWay();
    }

    getRangeByWay() {
        return {
            "fackSRange": this.fackSRange,
            "fackDRange": this.fackDRange
        }
    }

    isCopy(sarr, i) {
        let {sri, sci, eri} = this.use();
        let isCopy = false;
        if (sarr.length > 1) {
            isCopy = true;
        }
        if (sri == eri && sci + i == sci + i) {
            isCopy = true;
        }

        return isCopy;
    }

    calcDiff(sarr, isAdd) {
        let diffValue = 1;

        if(!isAdd) {
            diffValue = 1;
        }

        if (isAdd && sarr.length > 1) {
            let last2 = sarr[sarr.length - 2];
            let last1 = sarr[sarr.length - 1];
            diffValue = last1.text * 1 - last2.text * 1;
        } else if (sarr.length > 1) {
            let last2 = sarr[1];
            let last1 = sarr[0];
            diffValue = last1.text * 1 - last2.text * 1;
        }

        return diffValue;
    }

    // 得到上一个单元格，并计算本单元格
    calcCellByTopCell(d, direction) {
        let ncell = "";
        if (!direction) {
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
    }

    calcType(ncell, sarr) {
        let enter = false;
        let number = true, nA = true, nD = true;
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
        } else if (value && nA == true && isFormula(value)) {
            nA = true;
            number = false;
            nD = false;
        } else if (value && nD == true && value.search(/((^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(10|12|0?[13578])([-\/\._])(3[01]|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(11|0?[469])([-\/\._])(30|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(0?2)([-\/\._])(2[0-8]|1[0-9]|0?[1-9])$)|(^([2468][048]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([3579][26]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][13579][26])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][13579][26])([-\/\._])(0?2)([-\/\._])(29)$))/ig, '') != -1) {
            nA = false;
            number = false;
            nD = true;
        } else {
            nA = false;
            number = false;
            nD = false;
        }

        return {
            nA, nD, number
        }
    }
}
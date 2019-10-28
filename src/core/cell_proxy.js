import {isHave} from "./helper";
import {isFormula} from "./row";

export default class CellProxy {
    constructor(cell) {
        this.cell = cell;
    }

    getCellDataType(sarr, {isDate, isNumber}) {
        let ncell = this.cell;
        // let enter = false;
        let nA = true;
        // for (let k = 0; enter == false && k < sarr.length; k++) {
        //     if (sarr[k].text === ncell.text) {
        //         enter = true;
        //     }
        // }
        // if (enter == false) {
        //     sarr.push(ncell);
        // }

        if (!isHave(ncell.formulas)) {
            ncell.formulas = "";
        }
        if (!isHave(ncell.text)) {
            ncell.text = "";
        }

        let value = ncell.formulas !== "" ? ncell.formulas + "" : ncell.text + "";
        value = value.replace(/,/g, "");
        let ns = value.replace("=", "") * 1;

        if ((ns || ns == 0) && typeof ns === 'number' && isNumber == true) {
            isNumber = true;
            nA = false;
            isDate = false;
        } else if (value && nA == true && isFormula(value)) {
            nA = true;
            isNumber = false;
            isDate = false;
        } else if (value && isDate == true && value.search(/((^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(10|12|0?[13578])([-\/\._])(3[01]|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(11|0?[469])([-\/\._])(30|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))([-\/\._])(0?2)([-\/\._])(2[0-8]|1[0-9]|0?[1-9])$)|(^([2468][048]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([3579][26]00)([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][0][48])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][2468][048])([-\/\._])(0?2)([-\/\._])(29)$)|(^([1][89][13579][26])([-\/\._])(0?2)([-\/\._])(29)$)|(^([2-9][0-9][13579][26])([-\/\._])(0?2)([-\/\._])(29)$))/ig, '') != -1) {
            nA = false;
            isNumber = false;
            isDate = true;
        } else {//
            nA = false;
            isNumber = false;
            isDate = false;
        }
        ncell.tmp = value;
        sarr.push(ncell);

        return {
            nA, isDate: isDate, isNumber: isNumber
        }
    }
}
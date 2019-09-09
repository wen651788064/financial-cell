import {getSheetVale, isAbsoluteValue, isSheetVale} from "../core/operator";

export default class CellProxy {
    constructor() {
        this.oldData = "";
    }

    deepCalc() {

    }

    calc(newData, name, wb) {
        if (typeof this.oldData == "string") {
            this.oldData = newData;
            return;
        }

        let workbook = [];
        workbook.Sheets = {};
        workbook.Sheets[name] = {};

        let {oldData} = this;
        let result = {};
        let deep = [];

        Object.keys(newData).forEach(i => {
            Object.keys(newData[i]).forEach(j => {
                if (j == name) {
                    Object.keys(newData[i][j]).forEach(k => {
                        let newCell = newData[i][j][k];
                        let oldCell = oldData[i][j][k];
                        if (newCell && oldCell && oldCell.v != undefined && newCell.v != undefined && newCell.v + "" && oldCell.v + "" && newCell.v + "" !== oldCell.v + "") {
                            let expr = k;
                            newCell.v = newCell.v + "";
                            if (!isNaN(newCell.v.replace(/ /g, '').toUpperCase().replace(/\"/g, "\""))) {
                                workbook.Sheets[name][expr] = {
                                    v: newCell.v.replace(/ /g, '').toUpperCase().replace(/\"/g, "\"") * 1,
                                };
                            } else {
                                workbook.Sheets[name][expr] = {
                                    v: newCell.v.replace(/ /g, '').toUpperCase().replace(/\"/g, "\""),
                                };
                            }
                        } else if (newCell && oldCell && oldCell.f != undefined && newCell.f != undefined && newCell.f + "" && oldCell.f + "" && newCell.f + "" !== oldCell.f + "") {
                            let expr = k;
                            newCell.f = newCell.f + "";
                            if (newCell.f && newCell.f[0] === "=" && isSheetVale(newCell.f)) {
                                deep.push(newCell.f);
                            }

                            if (isNaN(newCell.f)) {
                                newCell.f = newCell.f.toUpperCase();
                            }

                            workbook.Sheets[name][expr] = {
                                v: '',
                                f: newCell.f.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                            };
                        }
                    });
                }
            });
        });


        this.oldData = newData;

        Object.keys(deep).forEach(i => {
            let target = deep[i];
            let v = getSheetVale(target);
            for (let j = 0; j < i; j++) {
                target = v[j];
                let name = target.split("!")[0].replace("=", '');
                let value = target.split("!")[1].replace(/\$/g, '');

                if (isAbsoluteValue(value, 2) && name) {

                } else {

                }
            }
        });

        return workbook;
    }
}
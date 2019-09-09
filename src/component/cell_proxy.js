import {getSheetVale, isSheetVale} from "../core/operator";

export default class CellProxy {
    constructor() {
        this.oldData = "";
        this.newData = ""
    }

    deepCalc(deep, newData, n) {
        for (let i = 0; i < deep.length; i++) {
            let target = deep[i];
            let v = getSheetVale(target);
            for (let j = 0; j < v.length; j++) {
                target = v[j];
                let name = target.split("!")[0].replace("=", '');
                let value = target.split("!")[1].replace(/\$/g, '');

                if (isSheetVale(value) && name && newData[name]) {
                    this.deepCalc(deep, newData);
                } else if (name && newData.Sheets[name]) {
                    n.push(target);
                } else if(!newData.Sheets[name]) {
                    return [];
                }
            }
        }
        return n;
    }

    concat(name, workbook) {
        this.newData = this.deepCopy(this.oldData);
        Object.keys(workbook.Sheets[name]).forEach(i => {
            this.newData.Sheets[name][i] = workbook.Sheets[name][i];
        });

        return this.newData;
    }

    deepCopy(obj) {
        var result = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key]!==null) {
                    result[key] = this.deepCopy(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }
        return result;
    }

    pack(name, workbook) {
        if(this.newData == "") {
            return workbook;
        }

        let data = this.deepCopy(this.newData);
        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                Object.keys(data[i][j]).forEach(k => {
                    data[i][j][k].f = "";
                })
            })
        });

        Object.keys(workbook.Sheets[name]).forEach(i => {
            data.Sheets[name][i] = workbook.Sheets[name][i];
        });

        return data;
    }

    calc(newData, name) {
        if (typeof this.oldData == "string") {
            this.oldData = this.deepCopy(newData);
            return {
                "state": false,
                "data": this.oldData.Sheets[name],
            };
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

                        if ((newCell && oldCell && oldCell.v != undefined && newCell.v != undefined && newCell.v + ""  && newCell.v + "" !== oldCell.v + "")) {
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
                        } else if (
                            (newCell && oldCell && oldCell.f != undefined && newCell.f != undefined && newCell.f + ""  && newCell.f + "" !== oldCell.f + "")
                        ) {
                            let expr = k;
                            newCell.f = newCell.f + "";
                            if (newCell.f && newCell.f[0] === "=" && isSheetVale(newCell.f)) {
                                deep.push(newCell.f);
                            }

                            if (isNaN(newCell.f)) {
                                newCell.f = newCell.f;
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


        if(Object.getOwnPropertyNames(workbook.Sheets[name]).length <= 0) {
            return {
                "state": false,
                "data": this.oldData.Sheets[name],
            };
        }

        let n = this.deepCalc(deep, newData, []);
        if(n.length <= 0 && deep.length > 0) {
            return {
                "state": false,
                "data": this.oldData.Sheets[name],
            };
        }
        this.oldData = this.deepCopy(newData);

        return {
            "state": true,
            "data": workbook.Sheets[name]
        };
    }
}
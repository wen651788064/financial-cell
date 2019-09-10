import {getSheetVale, isSheetVale} from "../core/operator";
import {expr2xy} from "../core/alphabet";

export default class CellProxy {
    constructor() {
        this.oldData = "";
        this.newData = "";
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
                } else if (!newData.Sheets[name]) {
                    return [];
                }
            }
        }
        return n;
    }

    // concat的主要作用是把计算出来的公式填入到olddata中，然后返回出去
    // 因为在前面有一步， 把不是此次change的公式都主动设置为""了，所以不能以此为基准。
    concat(name, workbook) {
        Object.keys(workbook.Sheets[name]).forEach(i => {
            if(workbook.Sheets[name][i].f != "") {
                this.oldData.Sheets[name][i] = workbook.Sheets[name][i];
            }
        });
        return this.oldData;
    }

    deepCopy(obj) {
        var result = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    result[key] = this.deepCopy(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }
        return result;
    }

    // =a1 要变成=A1  不破坏数据源
    pack(name, workbook) {
        if (typeof this.oldData === "string") {
            return workbook;
        }

        let data = this.deepCopy(this.oldData);
        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                Object.keys(data[i][j]).forEach(k => {
                    data[i][j][k].f = "";
                })
            })
        });

        Object.keys(workbook.Sheets[name]).forEach(i => {
            data.Sheets[name][i] = workbook.Sheets[name][i];
            if (workbook.Sheets[name][i].f && workbook.Sheets[name][i].f[0] === '=') {
                data.Sheets[name][i].v = "-";
                data.Sheets[name][i].f = workbook.Sheets[name][i].f.toUpperCase();
            }
        });
        // this.oldData = data;

        return data;
    }

    unpack(cells, _) {
        let data = _;
        Object.keys(cells).forEach(i => {
            let [ci, ri] = expr2xy(i);
            if (!data[ri]) {
                data[ri] = {}
            }
            if (!data[ri]['cells']) {
                data[ri]['cells'] = {}
            }

            if (!data[ri]['cells'][ci]) {
                data[ri]['cells'][ci] = {}
            }

            if (cells[i].v + "" === '0' && cells[i].f && cells[i].f[0] && cells[i].f[0] === '=') {
                data[ri]['cells'][ci].text = cells[i].v + "";
                data[ri]['cells'][ci].formulas = cells[i].f + "";
            } else {
                data[ri]['cells'][ci].text = cells[i].v;
                data[ri]['cells'][ci].formulas = cells[i].f;
            }
        });

        return data;
    }

    setOldData(newData) {
        this.oldData = this.deepCopy(newData);
        this.newData = this.deepCopy(newData);
    }

    calc(newData, name, initd = false) {
        if (initd) {
            return {
                "state": false,
            }
        }

        let workbook = [];
        workbook.Sheets = {};
        workbook.Sheets[name] = {};

        let {oldData} = this;
        let deep = [];

        Object.keys(newData).forEach(i => {
            Object.keys(newData[i]).forEach(j => {
                if (j == name) {
                    Object.keys(newData[i][j]).forEach(k => {
                        let newCell = newData[i][j][k];
                        if(typeof oldData === 'string') {
                            let expr = k;
                            let d = newCell.f;

                            if (!newCell || (!d && d + "" != '0') ) {
                                d = "";
                            }
                            d = d + "";
                            if (d && d[0] === "=" && isSheetVale(d)) {
                                deep.push(newCell.f);
                            }

                            if (isNaN(d)) {
                                d = d + "";
                            }

                            workbook.Sheets[name][expr] = {
                                v: '',
                                f: d.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                            };
                        } else {
                            let oldCell = oldData[i][j][k];

                            if (
                                (newCell && oldCell && oldCell.f != undefined
                                    && newCell.f != undefined && newCell.f + "" && newCell.f + "" !== oldCell.f + "") ||
                                (!oldCell && newCell) || (!oldCell.f && newCell.f)
                            ) {
                                let expr = k;
                                let d = newCell.f;

                                if (!newCell || (!d && d + "" != '0') ) {
                                    d = "";
                                }
                                d = d + "";
                                if (d && d[0] === "=" && isSheetVale(d)) {
                                    deep.push(newCell.f);
                                }

                                if (isNaN(d)) {
                                    d = d + "";
                                }

                                workbook.Sheets[name][expr] = {
                                    v: '',
                                    f: d.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                                };
                            }
                        }
                    });
                }
            });
        });


        if (Object.getOwnPropertyNames(workbook.Sheets[name]).length <= 0) {
            return {
                "state": false,
                "data": this.oldData.Sheets[name],
            };
        }

        let n = this.deepCalc(deep, newData, []);
        if (n.length <= 0 && deep.length > 0) {
            return {
                "state": false,
                "data":   "",
            };
        }
        this.oldData = this.deepCopy(newData);

        return {
            "state": true,
            "data": workbook.Sheets[name]
        };
    }
}
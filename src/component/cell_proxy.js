import {contain, division, getSheetVale, isSheetVale} from "../core/operator";
import {expr2xy, xy2expr} from "../core/alphabet";
// import Worker from 'worker-loader!../external/Worker.js';
import {filterFormula} from "../config";
import {toUpperCase} from "./table";

export default class CellProxy {
    constructor(refRow) {
        this.oldData = "";
        // diff 为 101 => 则为跨sheet但是没找到跨sheet的数据  402 => 则为跨sheet而且找到跨sheet的数据
        // 305 => 为重新计算
        this.diff = 0;
        this.refRow = refRow;
        // this.worker = new Worker();
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
            if (workbook.Sheets[name][i].f != "") {
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

    preProcess(v, f) {
        if (typeof v === 'string' && v.indexOf("%") !== -1) {
            return f;
        }

        if (typeof v === 'string' && v.indexOf(",") !== -1) {
            let t = v.replace(/,/g, '');
            if (!isNaN(t)) {
                return t;
            }
        }

        return v;
    }

    filter(data) {
        let fd = {};

        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                Object.keys(data[i][j]).forEach(k => {
                    if (!fd[i]) {
                        fd[i] = {};
                    }
                    if (!fd[i][j]) {
                        fd[i][j] = {};
                    }
                    let value = data[i][j][k].f + "";
                    if (value[0] === '=') {
                        fd[i][j][k] = data[i][j][k];
                    }
                })
            })
        });

        return fd;
    }

    filter2(data, arr) {
        let fd = {};

        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                Object.keys(data[i][j]).forEach(k => {
                    if (!fd[i]) {
                        fd[i] = {};
                    }
                    if (!fd[i][j]) {
                        fd[i][j] = {};
                    }
                    let value = data[i][j][k].f + "";
                    if (value[0] === '=') {
                        for (let c = 0; c < arr.length; c++) {
                            if (value.indexOf(arr[c]) != -1) {
                                fd[i][j][k] = data[i][j][k];
                            }
                        }
                    }
                })
            })
        });

        return fd;
    }

    associated(name, workbook, oldData = this.oldData, d = true) {
        let enter = false;
        let data = this.deepCopy(oldData);
        data = this.filter(data);
        let deepArr = [];
        let arr = [];
        let tileArr = [];

        Object.keys(workbook.Sheets[name]).forEach(n => {
            arr.push(n);
            tileArr.push(n);
        });
        deepArr.push(arr);

        for (let i = 0; i < deepArr.length; i++) {
            let targetArr = deepArr[i];
            arr = [];

            Object.keys(data).forEach(i => {
                Object.keys(data[i]).forEach(j => {
                    Object.keys(data[i][j]).forEach(k => {
                        let value = data[i][j][k].f + "";
                        value = value.replace(/\$/g, "");

                        for (let f = 0; f < targetArr.length; f++) {
                            let n = targetArr[f];
                            if (value.indexOf(n) !== -1) {
                                if (contain(division(value), n)) {
                                    workbook.Sheets[name][k] = data[i][j][k];
                                    enter = true;

                                    if (tileArr.indexOf(k) == -1) {
                                        arr.push(k);
                                        tileArr.push(k);
                                    }
                                }
                            }
                        }
                    })
                })
            });


            if (arr.length > 0) {
                deepArr.push(arr);
            }
        }

        if (d) {
            // setTimeout(() => {
            this.refCell(tileArr, name);
            // });
        }

        return {
            enter: enter,
            nd: workbook
        };
    }

    refCell(tileArr, name) {
        console.time("xx");
        let rr = this.refRow._;
        let arr = [];

        for (let j = 0; j < rr.length; j++) {
            let recordArr = [];
            let data = this.deepCopy(rr[j].workbook);
            data = this.filter2({
                data: data
            }, tileArr);

            for (let s = 0; s < tileArr.length; s++) {
                Object.keys(data).forEach(i => {
                    Object.keys(data[i]).forEach(j => {
                        Object.keys(data[i][j]).forEach(k => {
                            let value = data[i][j][k].f + "";
                            value = value.replace(/\$/g, "");

                            if (contain(division(value), tileArr[s])) {
                                recordArr.push(k);
                            }
                        })
                    })
                });
            }
            arr.push({
                recordArr: recordArr,
                rr: rr[j]
            });
        }

        let workbook = [];
        workbook.Sheets = {};
        let nameArr = [];
        for (let i = 0; i < arr.length; i++) {
            let ra = arr[i].recordArr;

            if (ra.length > 0) {
                let data = this.deepCopy(rr[i].workbook);
                let fd = this.refRow.refCalc({
                    Sheets: data
                }, ra, {
                    Sheets: data
                });
                for (let f in fd.Sheets) {
                    workbook.Sheets[f] = fd.Sheets[f];
                    nameArr.push(f);
                }
            }
        }
        let oldData = this.deepCopy(this.oldData);
        for (let f in oldData.Sheets) {
            if (f !== name) {
                delete oldData.Sheets[f];
            }
        }
        let fd = this.refRow.refCalc(oldData, [], oldData);
        for (let f in fd.Sheets) {
            workbook.Sheets[f] = fd.Sheets[f];

        }

        workbook = this.refRow.calc(workbook);
        workbook = this.refRow.concat(nameArr, workbook);
        for (let f in workbook.Sheets) {
            if (f !== name) {
                this.oldData.Sheets[f] = workbook.Sheets[f];
            }
        }

        this.refRow.unpack(nameArr);
        this.refRow.change(nameArr);

        console.timeEnd("xx");
    }


    countProperties(workbook) {
        let count = 0;
        Object.keys(workbook).forEach(i => {
            Object.keys(workbook[i]).forEach(j => {
                Object.keys(workbook[i][j]).forEach(k => {
                    let cell = workbook[i][j][k];
                    if (cell && cell.f && cell.f[0] === "=") {
                        count++;
                    }
                })
            });
        });

        if (count >= 50) {
            return true;
        }
        return false;
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
                    data[i][j][k].v = this.preProcess(data[i][j][k].v, data[i][j][k].f);
                    data[i][j][k].f = "";
                })
            })
        });

        Object.keys(workbook.Sheets[name]).forEach(i => {
            data.Sheets[name][i] = workbook.Sheets[name][i];

            if (workbook.Sheets[name][i].f && workbook.Sheets[name][i].f[0] === '=') {
                data.Sheets[name][i].v = "-";
                if (isSheetVale(workbook.Sheets[name][i].f)) {
                    data.Sheets[name][i].f = workbook.Sheets[name][i].f;
                } else {
                    data.Sheets[name][i].f = toUpperCase(workbook.Sheets[name][i].f);
                }
            }
        });

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

            if (typeof cells[i].v === 'undefined') {
                cells[i].v = "#ERROR!"
            }

            if (this.isNaN(cells[i].v)) {
                cells[i].v = "#ERROR!"
            }

            // if (cells[i].v === '-') {
            //     cells[i].v = "#ERROR!"
            // }

            if (typeof cells[i].f === 'undefined') {
                cells[i].f = "";
            }
            if (isNaN(cells[i].f) && cells[i].f.search(/\((\*|\/)/) != -1) {
                cells[i].v = '#ERROR!';
            }

            if (cells[i].w) {
                cells[i].v = cells[i].w;
            }

            if (cells[i].v + "" === '0' && cells[i].f && cells[i].f[0] && cells[i].f[0] === '=') {
                data[ri]['cells'][ci].text = cells[i].v + "";
                data[ri]['cells'][ci].formulas = cells[i].f + "";
            } else if (typeof cells[i].v === 'boolean') {
                data[ri]['cells'][ci].text = cells[i].v + "";
                data[ri]['cells'][ci].formulas = cells[i].f + "";
            } else {
                data[ri]['cells'][ci].text = cells[i].v;
                data[ri]['cells'][ci].formulas = cells[i].f;
            }
        });

        return data;
    }

    isEqual(v1, v2) {
        v1 = v1.toUpperCase();
        v2 = v2.toUpperCase();
        if (v1 === v2) {
            return true;
        }
        return false;
    }

    isNull(tmp) {
        if (!tmp && typeof(tmp) != "undefined" && tmp != 0) {
            return true;
        }
        return false;

    }

    isNaN(value) {
        return typeof value === 'number' && isNaN(value);
    }

    setOldData(newData) {
        this.oldData = this.deepCopy(newData);
    }


    setCell(name, erpx) {
        this.oldData.Sheets[name][erpx] = {
            f: "",
            v: ""
        }
    }

    setCells(name, dstCellRange) {
        const sri = dstCellRange.sri;
        const sci = dstCellRange.sci;
        const eri = dstCellRange.eri;
        const eci = dstCellRange.eci;
        for (let i = sci; i <= eci; i++) {
            for (let j = sri; j <= eri; j++) {
                let erpx = xy2expr(i, j);
                this.oldData.Sheets[name][erpx] = {
                    f: "",
                    v: ""
                };
            }
        }

    }

    checkDiff() {
        let {diff} = this;
        if (diff === 101) {
            this.oldData = "";
        }
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

        this.checkDiff();

        let {oldData} = this;
        let deep = [];

        Object.keys(newData).forEach(i => {
            Object.keys(newData[i]).forEach(j => {
                if (j == name) {
                    Object.keys(newData[i][j]).forEach(k => {
                        let newCell = newData[i][j][k];

                        if (typeof this.oldData == "string" && newCell.z == true) {
                            let expr = k;
                            let d = newCell.f;
                            let p = newCell.v;

                            if (!newCell || (!d && d + "" != '0')) {
                                d = "";
                            }
                            d = d + "";
                            if (d && d[0] === "=" && isSheetVale(d)) {
                                deep.push(newCell.f);
                            }

                            if (d[0] === '=' && (this.isNull(p) || this.isEqual(d, p) || this.diff === 305)) {
                                workbook.Sheets[name][expr] = {
                                    v: '',
                                    f: d.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                                };
                            }
                        } else if (newCell.z == true) {
                            let oldCell = oldData[i][j][k];

                            if (
                                (newCell && oldCell && oldCell.f != undefined
                                    && newCell.f != undefined && newCell.f + "" && newCell.f + "" !== oldCell.f + "") ||
                                (!oldCell && newCell) || (!oldCell.f && newCell.f)
                            ) {
                                let expr = k;
                                let d = newCell.f;
                                let p = newCell.v;

                                if (!newCell || (!d && d + "" != '0')) {
                                    d = "";
                                }
                                d = d + "";
                                if (d && d[0] === "=" && isSheetVale(d)) {
                                    deep.push(newCell.f);
                                }

                                if (d[0] === '=' && (p === "" || this.isNull(p) || this.isEqual(d, p) || this.diff === 305)) {
                                    workbook.Sheets[name][expr] = {
                                        v: '',
                                        f: d.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                                    };
                                } else if (oldCell && newCell && oldCell.v + "" !== newCell.v + "") {
                                    let p = newCell.v;
                                    let expr = k;
                                    workbook.Sheets[name][expr] = {
                                        v: p,
                                        f: ''
                                    };
                                }
                            }
                        }
                    });
                }
            });
        });

        if (Object.getOwnPropertyNames(workbook.Sheets[name]).length <= 0) {
            return {
                "state": false,
                "data": "",
            };
        }

        let n = this.deepCalc(deep, newData, []);
        if (n.length <= 0 && deep.length > 0) {
            this.diff = 101;
            return {
                "state": false,
                "data": "",
            };
        }
        this.diff = 402;
        this.oldData = this.deepCopy(newData);

        return {
            "state": true,
            "data": workbook.Sheets[name]
        };
    }

    processBackEnd() {
        let data = this.oldData;
        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                Object.keys(data[i][j]).forEach(k => {
                    let formula = data[i][j][k].f + "";

                    if (formula.indexOf(filterFormula) == -1) {
                        data[i][j][k] = {
                            f: "",
                            v: ""
                        }
                    }
                })
            })
        });
    }
}
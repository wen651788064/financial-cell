import {Rows} from "./row";
import {expr2xy} from "./alphabet";

export class RefRow {
    constructor(sr, data) {
        this._ = [];
        this.sr = sr;
        this.data = data;
    }

    setData(d) {
        let {sr} = this;

        for (let i = 0; i < d.calc.length; i++) {
            if (d.data[i].len) {
                delete d.data[i].len;
            }

            let rows = new Rows(sr);
            rows.setData(d.data[i]);
            for (let name in d.calc[i]) {
                this._.push({
                    rows: rows,
                    workbook: d.calc[i],
                    name: name,
                    sheet_id: d.sheet_id[i]
                });
            }
        }
    }

    refCalc(data, arr, fd) {
        let name = "";
        Object.keys(fd).forEach(i => {
            Object.keys(fd[i]).forEach(j => {
                name = i;
                Object.keys(fd[i][j]).forEach(k => {
                    if (!fd[i]) {
                        fd[i] = {};
                    }
                    if (!fd[i][j]) {
                        fd[i][j] = {};
                    }

                    if (arr.indexOf(k) == -1) {
                        fd[i][j][k].f = "";
                    }
                })
            })
        });

        return fd;
    }

    calc(workbook) {
        let {data} = this;
        data.calc(workbook);

        return workbook;
    }

    concat(nameArr, workbook) {
        for (let i = 0; i < nameArr.length; i++) {
            let name = nameArr[i];
            let oldData = this._.find(x => x.name === name).workbook;
            Object.keys(workbook.Sheets[name]).forEach(i => {

                if (workbook.Sheets[name][i].f != "") {
                    oldData[name][i] = workbook.Sheets[name][i];
                }
            });
            workbook.Sheets[name] = oldData[name];
        }

        return workbook;
    }

    change(nameArr) {
        let changeData = [];
        for (let i = 0; i < nameArr.length; i++) {
            let name = nameArr[i];
            let args = this._.find(x => x.name === name);
            let data = args.rows._;

            changeData.push({
                "sheet_id": args.sheet_id,
                "sheet_detail": data,
            })
        }

        let {data} = this;
        data.change({
            ref: true,
            data: changeData
        });
    }

    unpack(nameArr) {
        for (let i = 0; i < nameArr.length; i++) {
            let name = nameArr[i];
            let args = this._.find(x => x.name === name);
            let cells = args.workbook[name];
            let data = args.rows._;
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

                if (isNaN(cells[i].f) && cells[i].f.search(/\((\+|\-|\*|\/)/) != -1) {
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
        }

        // return data;
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
}
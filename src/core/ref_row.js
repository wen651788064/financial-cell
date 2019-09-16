import {Rows} from "./row";

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
            for(let name in d.calc[i]) {
                this._.push({
                    rows: rows,
                    workbook: d.calc[i],
                    name: name
                });
            }
        }
    }

    refCalc(data, arr, fd) {
        let name = "";
        Object.keys(data).forEach(i => {
            Object.keys(data[i]).forEach(j => {
                name = i;
                Object.keys(data[i][j]).forEach(k => {
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
        // data.change({
        //     ref: true,
        //     data: this._
        // });
        // console.log(workbook);
    }

    concat(nameArr, workbook) {
        for(let i = 0; i < nameArr.length; i++) {
            let name = nameArr[i];
            let oldData = this._.find(x => x.name === name).workbook;
            Object.keys(workbook.Sheets[name]).forEach(i => {
                if(!oldData.Sheets) {
                    oldData.Sheets = oldData;
                    delete oldData;
                }

                if (workbook.Sheets[name][i].f != "") {
                    oldData.Sheets[name][i] = workbook.Sheets[name][i];
                }
            });
            workbook.Sheets[name] = oldData.Sheets[name];
        }

        return workbook;
    }
}
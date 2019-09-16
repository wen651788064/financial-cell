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
            this._.push({
                rows: rows,
                workbook: d.calc[i]
            });
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
        data.change({
            ref: true,
            data: data.getData()
        });
        // console.log(workbook);
    }
}
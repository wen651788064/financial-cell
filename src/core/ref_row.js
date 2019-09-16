import {Rows} from "./row";

export class RefRow {
    constructor(sr) {
        this._ = [];
        this.sr = sr;
    }

    setData(d) {
        let {sr} = this;

        for(let i = 0; i < d.calc.length; i++) {
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
}
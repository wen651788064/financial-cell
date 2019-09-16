import {Rows} from "./row";

export class RefRow {
    constructor(sr) {
        this._ = [];
        this.sr = sr;
    }

    setData(d) {
        let {sr} = this;

        for(let i = 0; i < d.length; i++) {
            if (d[i].len) {
                delete d[i].len;
            }

            let rows = new Rows(sr);
            rows.setData(d[i].data);
            this._.push({
                rows: rows,
                workbook: d[i].calc
            });
        }
    }
}
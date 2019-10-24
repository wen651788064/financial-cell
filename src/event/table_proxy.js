import {isHaveStyle} from "./paste";
import {Rows} from "../core/row";
import {splitStr} from "../core/operator";

export default class TableProxy {
    constructor(data) {
        this.data = data;
        this.rows = new Rows({len: 0, height: 0});
    }

    getComputedStyle(computedStyle) {
        let bold = false;
        if (computedStyle.fontWeight > 400) {
            bold = true;
        }
        let args = {
            color: computedStyle.color,
            bgcolor: computedStyle.background.substring(0,
                computedStyle.background.indexOf(")") + 1),
            font: {
                bold: bold,
            },
        };

        return args;
    }

    extend(tableDom, {ri, ci}) {
        let {data} = this;
        if (tableDom.rows.length >= data.rows.len - ri) {
            let diff = tableDom.rows.length - (data.rows.len - ri);
            if(diff > 0) {
                data.insert('row', diff);
            }
        }

        if (!tableDom.rows[0] || !tableDom.rows[0].cells) {
            return;
        }

        let colLen = tableDom.rows[0].cells.length;
        if (colLen >= data.cols.len) {
            let diff = colLen - (data.cols.len - ci);
            if(diff > 0) {
                data.insert('column', diff, data.cols.len);
            }
        }
    }

    each(obj, cb) {
        for (let i = 0; i < obj.rows.length; i++) {
            for (let j = 0; j < obj.rows[i].cells.length; j++) {
                cb(i, j, obj.rows[i].cells[j]);
            }
        }
    }

    dealColSpan(tableDom) {
        this.each(tableDom, (i, j, cell) => {
            let len = cell.getAttribute("colspan");
            if (len && len > 1) {
                for (let c = 0; c < len - 1; c++) {
                    tableDom.rows[i].insertBefore(document.createElement("td"), tableDom.rows[i].cells[j + 1]);
                }
            }
        });
    }

    dealStyle(tableDom, {ri, ci}) {
        let {data, rows} = this;
        let styles = data.styles;

        this.each(tableDom, (i, j, cell) => {
            let computedStyle = document.defaultView.getComputedStyle(cell, false);
            let args = this.getComputedStyle(computedStyle);
            let index = isHaveStyle(styles, args);
            if (index === -1) {
                styles.push(args);
            }
            rows.setCell(ri + i, ci + j, {"style": index === -1 ? styles.length - 1 : index}, 'all');
        });
    }

    dealReference(tableDom, {ri, ci}) {
        let {rows} = this;
        let reference = [];

        this.each(tableDom, (i, j, cell) => { // 处理reference函数提取一下，填充也用引用这个函数。 updateCEllReferenceByShift， 跟填充的逻辑共享
            let node = cell.querySelector("reference");
            let innerText = cell.innerText || "";
            if (node) {
                let eri = node.getAttribute('ri');
                let eci = node.getAttribute('ci');

                let strList = splitStr(innerText);
                let dci = i + ri - eri;
                let dei = j + ci - eci;

                let {bad, result} = rows.getCellTextByShift(strList, dei, dci);
                let _cell = {};
                if (bad) {
                    _cell.text = "#REF!";
                    _cell.formulas = "#REF!";
                } else {
                    _cell.text = result != "" ? result : innerText;
                    _cell.formulas = result != "" ? result : innerText;
                }
                rows.setCell(ri + i, ci + j, _cell, 'all');
            } else {
                let _cell = {};
                _cell.text = innerText;
                _cell.formulas = innerText;

                rows.setCell(ri + i, ci + j, _cell, 'all');
            }

            reference.push({
                ri: ri + i,
                ci: ci + j
            });
        });
        return {"reference": reference};
    }
}
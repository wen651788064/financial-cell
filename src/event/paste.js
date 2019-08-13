import {sheetReset} from "../component/sheet";

function mountPaste(e, cb) {
    let cbd = e.clipboardData;
    let p = false;
    for (let i = 0; i < cbd.items.length; i++) {
        let item = cbd.items[i];
        let cells = {};
        if (item.kind === "string") {
            item.getAsString((str) => {
                let textDom = document.createElement("head");
                textDom.innerHTML = str;
                let styleDom = textDom.getElementsByTagName("style")[0];
                let tableDom = textDom.getElementsByTagName("table")[0];

                if(styleDom) {
                    let {el} = this;
                    el.child(styleDom);
                }

                if (tableDom && p == false) {
                    let {el} = this;
                    el.child(tableDom);
                    GetInfoFromTable.call(this, tableDom);
                    tableDom.parentNode.removeChild(tableDom);
                    if(styleDom) {
                        styleDom.parentNode.removeChild(styleDom);
                    }
                    sheetReset.call(this);
                    p = true;
                }
            });
        }
    }
    if (!p)
        cb();
}

function equals(x, y) {
    let f1 = x instanceof Object;
    let f2 = y instanceof Object;
    if (!f1 || !f2) {
        return x === y
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false
    }
    let newX = Object.keys(x);
    for (let p in newX) {
        p = newX[p];
        let a = x[p] instanceof Object;
        let b = y[p] instanceof Object;
        if (a && b) {
            let equal = equals(x[p], y[p])
            if (!equal) {
                return equal
            }
        } else if (x[p] != y[p]) {
            return false;
        }
    }
    return true;
}

function isHaveStyle(styles, style) {
    for (let i = 0; i < styles.length; i++) {
        if (equals(styles[i], style)) {
            return i;
        }
    }
    return -1;
}

function GetInfoFromTable(tableObj) {
    let {data} = this;
    let {ri, ci} = data.selector;
    let rows = data.rows._;
    let styles = data.styles;
    for (let i = 0; i < tableObj.rows.length; i++) {
        let cells = {};
        if (rows && rows[i + ri] && rows[i + ri].cells) {
            cells = rows[i + ri].cells;
        }
        for (let j = 0; j < tableObj.rows[i].cells.length; j++) {
            let args = {
                color: document.defaultView.getComputedStyle(tableObj.rows[i].cells[j], false).color
            };
            let index = isHaveStyle(styles, args);
            if (index !== -1) {
                cells[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerHTML,
                    style: index,
                };
            } else {
                styles.push(args);
                cells[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerHTML,
                    style: styles.length - 1,
                };
            }
        }

        rows[i + ri] = {
            "cells": cells
        };
    }
    console.log(rows, styles, data.settings.style);

    return {
        rows: rows,
        styles: styles
    };
}

function copy2clipboard() {

}

export {
    mountPaste,
}


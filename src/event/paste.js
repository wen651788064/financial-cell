import {sheetReset} from "../component/sheet";
import {h} from "../component/element";
import Drag from "../external/drag";
import Resize from "../external/resize";
import {cssPrefix} from "../config";


let resizeOption = () => {
    function onClick(data) {
        console.log("10");
    };
};

function mountPaste(e, cb) {
    let cbd = e.clipboardData;
    let p = false;
    for (let i = 0; i < cbd.items.length; i++) {
        let item = cbd.items[i];
        if (item.kind === "string") {
            item.getAsString((str) => {
                let textDom = document.createElement("head");
                textDom.innerHTML = str;
                let styleDom = textDom.getElementsByTagName("style")[0];
                let tableDom = textDom.getElementsByTagName("table")[0];

                if (styleDom) {
                    let {el} = this;
                    el.child(styleDom);
                }

                if (tableDom && p == false) {
                    let {el} = this;
                    el.child(tableDom);
                    GetInfoFromTable.call(this, tableDom);
                    tableDom.parentNode.removeChild(tableDom);
                    if (styleDom) {
                        styleDom.parentNode.removeChild(styleDom);
                    }
                    sheetReset.call(this);
                    p = true;
                }
            });
        } else if (item.kind === "file" && !p) {
            let f = item.getAsFile();
            let reader = new FileReader();
            reader.onload = (evt) => {
                let {x, y, overlayerEl, pasteDirectionsArr} = this;
                let img = h('img', 'paste-img');
                img.el.src = evt.target.result;

                let {el} = this;
                setTimeout(() => {
                    if(p) {
                       return;
                    }
                    let div = h('div', `${cssPrefix}-object-container`)
                        .css("position", "absolute")
                        .css("top", `${y}px`)
                        .css("z-index", `100000`)
                        .css("left", `${x}px`)
                        .child(img);
                    overlayerEl.child(div);
                    new Drag("").register(div.el);
                    let directionsArr = new Resize(resizeOption).register(div.el);
                    let index = pasteDirectionsArr.length;
                    pasteDirectionsArr.push({
                        "state": true,
                        "arr": directionsArr,
                        "img": div,
                        "index": index
                    });
                    this.direction = true;
                    containerHandlerEvent.call(this, directionsArr, index, pasteDirectionsArr);
                    div.on('mousedown', evt => containerHandlerEvent.call(this, directionsArr, index, pasteDirectionsArr));
                    div.css("width", `${img.el.offsetWidth}px`);
                    div.css("height", `${img.el.offsetHeight}px`);
                    console.log(img.el.offsetWidth);
                }, 0);
            };

            reader.readAsDataURL(f)
        }
    }
    if (!p)
        cb();
}

function hideDirectionArr() {
    let {pasteDirectionsArr}  = this;
    this.direction = false;
    if(pasteDirectionsArr.length > 0) {
        for(let i = 0; i < pasteDirectionsArr.length; i++) {
            let arr = pasteDirectionsArr[i].arr;
            if(arr.length > 0) {
                for(let j = 0; j < arr.length; j++) {
                    arr[j].style.display = 'none';
                }
            }
            pasteDirectionsArr[i].state = false;
            pasteDirectionsArr[i].img.css("z-index", "10000");
        }
    }
}

function deleteImg(d = false) {
    let {pasteDirectionsArr}  = this;
    let direction_new = [];
    let direction_delete = [];
    this.direction = false;
    if(pasteDirectionsArr.length > 0) {
        for(let i = 0; i < pasteDirectionsArr.length; i++) {
            if(pasteDirectionsArr[i].state === true || d == true) {
                direction_delete.push(pasteDirectionsArr[i]);
            } else {
                direction_new.push(pasteDirectionsArr[i]);
            }
        }
    }

    Object.keys(direction_delete).forEach(i => {
        direction_delete[i].img.removeEl();
    });

    this.pasteDirectionsArr = direction_new;
}

function containerHandlerEvent(directionsArr, index, pasteDirectionsArr) {
    hideDirectionArr.call(this);
    this.direction = true;
    Object.keys(directionsArr).forEach(i => {
        directionsArr[i].style.display = 'block';
        // directionsArr[i].img.css("z-index", "99999999");
    });
    pasteDirectionsArr[index].img.css("z-index", "99999999");
    pasteDirectionsArr[index].state = true;
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

export {
    mountPaste,
    hideDirectionArr,
    deleteImg,
}


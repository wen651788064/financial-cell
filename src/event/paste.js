import {selectorSet, sheetReset} from "../component/sheet";
import {h} from "../component/element";
import Drag from "../external/drag";
import Resize from "../external/resize";
import {cssPrefix} from "../config";
import {getChooseImg} from "../event/copy";
import {expr2xy, xy2expr} from "../core/alphabet";
import CellRange from "../core/cell_range";
import {deepCopy} from "../core/operator";

export let resizeOption = {
    onBegin(data) {
        console.log("obegin", data)
    },

    onEnd(data) {

    },
    onResize(data, self) {
        let img = getChooseImg.call(self);
        if (!img)
            return;

        img.img2.style['width'] = img.img.el.style['width'];
        img.img2.style['height'] = img.img.el.style['height'];
    }
};

export let dragOption = {
    onBegin(data) {
        console.log("obegin", data)
    },
    onEnd(data, self) {
        let {left, top} = data;
        let img = getChooseImg.call(self);
        if (!img)
            return;
        // img.left = left + 70;
        // img.top = top + 31;

        if (top - 31 < 0) {
            top = 0;
        } else if (left - 60 < 0) {
            left = 0;
        }

        let range = self.data.getCellRectByXY(left + 60, top + 31);
        range.sri = range.ri;
        range.sci = range.ci;
        range.eri = range.ri;
        range.eci = range.ci;
        let offsetLeft = left - range.left + 50;
        let offsetTop = top - range.top + 21;

        img.offsetLeft = offsetLeft;
        img.offsetTop = offsetTop;
        img.range = range;
        if(typeof img.lastCi !== 'undefined' && typeof img.lastRi !== 'undefined') {
            img.ri = img.lastRi;
            img.ci = img.lastCi;
        }
        img.lastCi = range.ci;
        img.lastRi = range.ri;

        self.data.history.addPic(deepCopy(self.data.pasteDirectionsArr), "delete");
    },
    onDrag(data) {
    },
};

function spanDomPackage(spanDom, tableDom) {
    let table = h("table", "");
    let tbody = h('tbody', '');

    let textArr = spanDom.innerText.split("\n");
    for(let i = 0; i < textArr.length; i++) {
        let text = textArr[i];
        let tr = h('tr', '');
        let td = h('td', '');
        td.html(text);
        td.css('background', spanDom.style['background']);
        td.css('font-weight', spanDom.style['font-weight']);
        td.css('color', spanDom.style['color']);
        tr.child(td);
        tbody.child(tr);
    }

    table.child(tbody);
    tableDom = table.el;

    return tableDom;
}

export function process(tableDom, styleDom = "") {
    let {el, data} = this;
    data.history.add(data.getData());
    el.child(tableDom);
    GetInfoFromTable.call(this, tableDom);
    tableDom.parentNode.removeChild(tableDom);
    if (styleDom) {
        styleDom.parentNode.removeChild(styleDom);
    }
    sheetReset.call(this);
}

function mountPaste(e, cb) {
    let cbd = e.clipboardData;
    let p = false;

    for (let i = 0; i < cbd.items.length; i++) {
        let item = cbd.items[i];
        if (item.kind === "string") {
            item.getAsString((str) => {
                let textDom = h('head', '');
                let d = h('span', '');
                if ((str.indexOf('<span') == -1 && str.indexOf('span>') == -1) && (str.indexOf('<table') == -1 && str.indexOf('table>') == -1)) {
                    d.html(str);
                    textDom.child(d.el);
                    textDom = textDom.el;
                }
                else {
                    textDom.html(str);
                    textDom = textDom.el;
                }
                let imgDom = textDom.getElementsByTagName("img")[0];
                let styleDom = textDom.getElementsByTagName("style")[0];
                let tableDom = textDom.getElementsByTagName("table")[0];
                let spanDom = textDom.getElementsByTagName("span")[0];
                if (imgDom && !styleDom) {
                    mountImg.call(this, imgDom);
                    p = true;
                } else {
                    if (!tableDom) {
                        setTimeout(() => {
                            if (p) {
                                return;
                            }
                            if (spanDom) {
                                tableDom = spanDomPackage.call(this, spanDom, tableDom);
                            }
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
                        }, 100)
                    } else {
                        if (styleDom) {
                            let {el} = this;
                            el.child(styleDom);
                        }

                        if (tableDom && p == false) {
                            process.call(this, tableDom, styleDom);
                            p = true;
                        }
                    }
                }
            });
        } else if (item.kind === "file" && !p) {
            let f = item.getAsFile();
            let reader = new FileReader();
            reader.onload = (evt) => {
                let {x, y, overlayerEl} = this;
                let {pasteDirectionsArr} = this.data;
                let img = h('img', 'paste-img');
                img.el.src = evt.target.result;

                setTimeout(() => {
                    if (p) {
                        return;
                    }
                    p = true;
                    mountImg.call(this, img.el);
                }, 0);
            };

            if(!f)
                return;
            reader.readAsDataURL(f);
        }
    }
    setTimeout(() => {
        if (!p)
            cb();
        else {
            let {data} = this;
            data.change(data.getData());
        }
    })
}

function processImg(item) {
    let f = item.getAsFile();
    let reader = new FileReader();
    reader.onload = (evt) => {
        // let {x, y, overlayerEl, pasteDirectionsArr} = this;
        let img = h('img', 'paste-img');
        img.el.src = evt.target.result;

        setTimeout(() => {
            if (p) {
                return;
            }
            p = true;
            mountImg.call(this, img.el);
        }, 0);
    };

    reader.readAsDataURL(f);
}

function moveArr(top, left) {
    let {pasteDirectionsArr} = this.data;
    for (let i = 0; i < pasteDirectionsArr.length; i++) {
        let p = pasteDirectionsArr[i];
        console.log(p.img.el['style'].top, "108");
        p.img.css("top", `${top }px`)
            .css("left", `${left  }px`)
    }
}

function getMaxCoord(ri, ci) {
    let top = 0;
    let left = 0;
    let {pasteDirectionsArr} = this.data;
    let number = 0;
    for (let i = 0; i < pasteDirectionsArr.length; i++) {
        let p = pasteDirectionsArr[i];
        if (p.ri === ri && p.ci === ci) {
            if (left < p.nextLeft) {
                left = p.nextLeft;
            }
            if (top < p.nextTop) {
                top = p.nextTop;
            }
            number++;
        }
    }

    return {
        top: top,
        left: left,
        number: number,
    }
}


export function mountImg(imgDom, init = false, sri, sci, range, add = true) {
    let image = new Image();
    image.src = imgDom.src;
    image.onload = () => {
        let width = image.width;
        let height = image.height;
        let img = imgDom;
        let {container, data} = this;
        let {pasteDirectionsArr} = data;
        if(add) {
            data.history.addPic(Object.assign([], pasteDirectionsArr), "delete");
        }

        let {ri, ci} = data.selector;
        if(init) {
           ri = sri;
           ci = sci;
        }
        let {pictureOffsetLeft, pictureOffsetTop} = this;

        const rect = data.getMoveRect(new CellRange(ri, ci, ri, ci));
        let left = rect.left + pictureOffsetLeft;
        let top = rect.top + pictureOffsetTop;
        let number = 0;
        let choose = getChooseImg.call(this);
        if (choose) {
            let args = getMaxCoord.call(this, choose.ri, choose.ci);
            left = args.left;
            top = args.top;
            ri = choose.ri;
            ci = choose.ci;
            number = args.number;
        }

        let div = h('div', `${cssPrefix}-object-container`)
            .css("position", "absolute")
            .css("top", `${top}px`)
            .css("width", `${width}px`)
            .css("height", `${height}px`)
            .css("z-index", `100000`)
            .css("left", `${left}px`)
            .child(img);
        container.child(div);
        new Drag(dragOption, this).register(div.el);
        setTimeout(() => {
            let {data} = this;
            let directionsArr = new Resize(resizeOption, this).register(div.el);
            let index = pasteDirectionsArr.length;

            pasteDirectionsArr.push({
                "src": img.src,
                "state": true,
                "arr": directionsArr,
                "img": div,
                "index": index,
                "img2": img,
                "ri": ri,
                "ci": ci,
                "offsetLeft": 0,
                "offsetTop": 0,
                "number": number,
                "range": init ? range :data.selector.range,
                "top": top,
                "left": left,
                "nextLeft": left + 15,
                "nextTop": top + 15,
            });
            if(!init) {
                this.data.change(this.data.getData());
            }
            this.direction = true;
            div.css("width", `${img.offsetWidth}px`);
            div.css("height", `${img.offsetHeight}px`);
            containerHandlerEvent.call(this, directionsArr, index, pasteDirectionsArr, init);
            div.on('mousedown', evt => containerHandlerEvent.call(this, directionsArr, index, pasteDirectionsArr));
        }, 0);
    };
}

function hideDirectionArr() {
    let {pasteDirectionsArr} = this.data;
    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
        for (let i = 0; i < pasteDirectionsArr.length; i++) {
            let arr = pasteDirectionsArr[i].arr;
            if (arr.length > 0) {
                for (let j = 0; j < arr.length; j++) {
                    arr[j].style.display = 'none';
                }
            }
            pasteDirectionsArr[i].state = false;
            pasteDirectionsArr[i].img.css("z-index", "10000");
            pasteDirectionsArr[i].img2.style['border'] = "none";
        }
    }
}

function deleteImg(d = false) {
    let {pasteDirectionsArr} = this.data;
    let direction_new = [];
    let direction_delete = [];
    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
        for (let i = 0; i < pasteDirectionsArr.length; i++) {
            if (pasteDirectionsArr[i].state === true || d == true) {
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
    let {data} = this;
    data.change(data.getData());
}

function deleteAllImg() {
    let {pasteDirectionsArr} = this.data;
    let direction_new = [];
    let direction_delete = [];
    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
        for (let i = 0; i < pasteDirectionsArr.length; i++) {
            direction_delete.push(pasteDirectionsArr[i]);
        }
    }

    Object.keys(pasteDirectionsArr).forEach(i => {
        direction_delete[i].img.removeEl();
    });

    this.pasteDirectionsArr = direction_new;
}

function containerHandlerEvent(directionsArr, index, pasteDirectionsArr, init) {
    hideDirectionArr.call(this);
    this.direction = true;
    Object.keys(directionsArr).forEach(i => {
        directionsArr[i].style.display = 'block';
    });

    let {selector, editor} = this;
    if(!init) {
        selector.hide();
        editor.clear();

        pasteDirectionsArr[index].img.css("z-index", "99999999");
        pasteDirectionsArr[index].state = true;
    } else {
        hideDirectionArr.call(this);
    }
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
    let rows2 = JSON.parse(JSON.stringify(data.rows._));
    let lastRi = 0, lastCi = 0;

    if (tableObj.rows.length >= data.rows.len - ri + 1) {
        data.insert('row', tableObj.rows.length + 5);
    }

    for (let i = 0; i < tableObj.rows.length; i++) {
        let cells = {};
        let cells2 = {};
        if (rows && rows[i + ri] && rows[i + ri].cells) {
            cells = rows[i + ri].cells;
            cells2 = JSON.parse(JSON.stringify(rows[i + ri].cells));
        }
        for (let j = 0; j < tableObj.rows[i].cells.length; j++) {
            let len = tableObj.rows[i].cells[j].getAttribute("colspan");
            if(len && len > 1) {
                for(let c = 0; c < len - 1; c++) {
                    tableObj.rows[i].insertBefore(document.createElement("td"), tableObj.rows[i].cells[j + 1]);
                }
            }
            let bold = false;
            if (document.defaultView.getComputedStyle(tableObj.rows[i].cells[j], false).fontWeight > 400) {
                bold = true;
            }
            let args = {
                color: document.defaultView.getComputedStyle(tableObj.rows[i].cells[j], false).color,
                bgcolor: document.defaultView.getComputedStyle(tableObj.rows[i].cells[j], false).background.substring(0,
                    document.defaultView.getComputedStyle(tableObj.rows[i].cells[j], false).background.indexOf(")") + 1),
                font: {
                    bold: bold,
                },
            };
            let index = isHaveStyle(styles, args);

            if (tableObj.rows[i].cells[j] && tableObj.rows[i].cells[j].querySelector("tt")) {
                let eri = tableObj.rows[i].cells[j].childNodes[0].getAttribute('ri');
                let eci = tableObj.rows[i].cells[j].childNodes[0].getAttribute('ci');

                let arr = tableObj.rows[i].cells[j].innerText.split(/([(-\/,+，*\s=^&])/);
                let dci = i + ri - eri;
                let dei = j + ci - eci;
                console.log(tableObj.rows[i].cells[j].innerText, j, i, dei, dci);

                let newStr = "";
                let bad = false;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].search(/^[A-Z]+\d+$/) != -1) {
                        let ds = expr2xy(arr[i]);
                        if (ds[0] + dei < 0 || ds[1] + dci < 0) {
                            bad = true;
                        }
                        arr[i] = xy2expr(ds[0] + dei, ds[1] + dci);
                    } else if (arr[i].search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) != -1) {
                        let a1 = arr[i].split(":")[0];
                        let a2 = arr[i].split(":")[1];
                        let ds1 = expr2xy(a1);
                        let ds2 = expr2xy(a2);

                        if (ds1[0] + dei < 0 || ds1[1] + dci < 0) {
                            bad = true;
                        }
                        if (ds2[0] + dei < 0 || ds2[1] + dci < 0) {
                            bad = true;
                        }

                        let s = xy2expr(ds1[0] + dei, ds1[1] + dci) + ":";
                        s += xy2expr(ds2[0] + dei, ds2[1] + dci)
                        arr[i] = s;
                    }
                    newStr += arr[i];
                }

                if (bad) {
                    cells[j + ci] = {
                        text: "=#REF!",
                        style: index,
                    };
                    cells2[j + ci] = {
                        text: "=#REF!",
                    };
                } else {
                    cells[j + ci] = {
                        text: newStr != "" ? newStr : tableObj.rows[i].cells[j].innerText,
                        style: index,
                    };
                    cells2[j + ci] = {
                        text: newStr != "" ? newStr : tableObj.rows[i].cells[j].innerText,
                    };
                }
            } else if (index !== -1) {
                cells[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerText,
                    style: index,
                };
                cells2[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerText,
                };
            } else {
                styles.push(args);
                cells[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerText,
                    style: styles.length - 1,
                };
                cells2[j + ci] = {
                    text: tableObj.rows[i].cells[j].innerText,
                };
            }
            lastRi = i + ri;
            lastCi = j + ci;
            selectorSet.call(this, true, i + ri, j + ci, true, true);
        }
        rows[i + ri] = {
            "cells": cells
        };
        rows2[i + ri] = {
            "cells": cells2
        };
    }

    const rect = data.getSelectedRect();
    let left = rect.left + rect.width + 60;
    let top = rect.top + rect.height + 31;
    let {advice, editor} = this;
    editor.clear();
    advice.show(left, top, 1, rows2, rows, rect);
    data.rows._ = rows;

    return {
        rows: rows,
        styles: styles
    };
}

export {
    mountPaste,
    hideDirectionArr,
    deleteImg,
    moveArr,
    deleteAllImg,
}


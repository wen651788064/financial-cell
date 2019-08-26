import {h} from './element';
import {cssPrefix} from '../config';
import {CellRange} from '../core/cell_range';
import {mouseMoveUp} from "../component/event";
import {xy2expr} from "../core/alphabet";

const selectorHeightBorderWidth = 2 * 2 - 1;
let startZIndex = 10;

class SelectorElement {
    constructor(data, selector, sheet) {
        this.cornerEl = h('div', `${cssPrefix}-selector-corner`);
        // this.box = h('div', `${cssPrefix}-selector-box`);
        this.data = data;
        this.sheet = sheet;
        this._selector = selector;
        this.l = h('div', `${cssPrefix}-selector-box-l`)
            .on('mousedown.stop', evt => {
                this.moveEvent();
            });
        this.r = h('div', `${cssPrefix}-selector-box-r`)
            .on('mousedown.stop', evt => {
                this.moveEvent();
            });
        this.t = h('div', `${cssPrefix}-selector-box-t`)
            .on('mousedown.stop', evt => {
                this.moveEvent();
            });
        this.b = h('div', `${cssPrefix}-selector-box-b`)
            .on('mousedown.stop', evt => {
                this.moveEvent();
            });


        this.boxinner = h('div', `${cssPrefix}-selector-boxinner`)
            .children(this.b, this.t, this.r, this.l);
        this.areaEl = h('div', `${cssPrefix}-selector-area`)
            .children(this.cornerEl, this.boxinner).hide();            // this.boxinner
        this.clipboardEl = h('div', `${cssPrefix}-selector-clipboard`).hide();
        this.autofillEl = h('div', `${cssPrefix}-selector-autofill`).hide();
        this.el = h('div', `${cssPrefix}-selector`)
            .css('z-index', `${startZIndex}`)
            .children(this.areaEl, this.clipboardEl, this.autofillEl)
            .hide();
        startZIndex += 1;
    }

    moveEvent() {
        let {data, _selector, sheet} = this;
        let {selector} = data;
        let {sri, sci, eri, eci, w, h} = _selector.range;
        let _cellRange = new CellRange(sri, sci, eri, eci, w, h);
        let cellRange = new CellRange(sri, sci, eri, eci, w, h);
        let {selectorMoveEl} = sheet;
        selectorMoveEl.set(-1, -1, true);
        selectorMoveEl.hide();

        mouseMoveUp(window, (e) => {
            _selector.setBoxinner("none");

            let {ri, ci} = data.getCellRectByXY(e.layerX, e.layerY);
            if (ri !== -1 && ci !== -1) {
                cellRange = new CellRange(sri, sci, eri, eci, w, h);
                cellRange.move(ri, ci);
                const rect = data.getMoveRect(cellRange);
                selectorMoveEl.range = cellRange;
                selectorMoveEl.setMove(rect);
                selectorMoveEl.el.show();
            }
        }, (e) => {
            data.cutPaste(_cellRange, cellRange);
            _selector.setBoxinner("auto");
            selectorMoveEl.hide();

            const rect = data.getMoveRect(cellRange);
            selector.range = cellRange;
            selector.ci = cellRange.sci;
            selector.ri = cellRange.sri;
            _selector.indexes = [selector.ri, selector.ci];
            _selector.moveIndexes = [cellRange.sri, cellRange.sci];
            _selector.range = cellRange;
            _selector.setMove(rect);

            // 如果移动的内容被单元格包含，则需要变化
            let {rows} = data;
            let arr = [], arr2 = [], arr3 = [];
            // 多个单元格
            if (_cellRange.eri != _cellRange.sri || _cellRange.eci != _cellRange.sci) {
                let a1 = xy2expr(_cellRange.eci, _cellRange.eri);
                let a2 = xy2expr(_cellRange.sci, _cellRange.sri);
                arr.push(`${a2}:${a1}`);
                arr3.push(`${a2}:${a1}`);
                a1 = xy2expr(cellRange.eci, cellRange.eri);
                a2 = xy2expr(cellRange.sci, cellRange.sri);
                arr2.push(`${a2}:${a1}`);
            } else {
                _cellRange.each((i, j) => {
                    arr.push(`${xy2expr(j, i)}:${xy2expr(j, i)}`);
                    arr3.push(`${xy2expr(j, i)}`)
                });
                cellRange.each((i, j) => {
                    arr2.push(xy2expr(j, i));
                });
            }
            rows.moveChange(arr, arr2, arr3);

            sheet.selectorMoveReset();
        });
    }

    setCss(b) {
        this.areaEl.css('border', `2px dashed ${b}`);
        this.el.css("z-index", "-1");
    }

    setOffset(v) {
        this.el.offset(v).show();
        return this;
    }

    setBoxinner(pointer) {
        this.l.css("pointer-events", pointer);
        this.r.css("pointer-events", pointer);
        this.t.css("pointer-events", pointer);
        this.b.css("pointer-events", pointer);
    }

    hide() {
        this.el.hide();
        return this;
    }

    setAreaOffset(v) {
        const {
            left, top, width, height,
        } = v;
        this.areaEl.offset({
            width: width - selectorHeightBorderWidth + 0.8,
            height: height - selectorHeightBorderWidth + 0.8,
            left: left - 0.8,
            top: top - 0.8,
        }).show();
    }

    setClipboardOffset(v) {
        const {
            left, top, width, height,
        } = v;
        this.clipboardEl.offset({
            left,
            top,
            width: width - 5,
            height: height - 5,
        });
    }

    showAutofill(v) {
        const {
            left, top, width, height,
        } = v;
        this.autofillEl.offset({
            width: width - selectorHeightBorderWidth,
            height: height - selectorHeightBorderWidth,
            left,
            top,
        }).show();
    }

    hideAutofill() {
        this.autofillEl.hide();
    }

    showClipboard() {
        this.clipboardEl.show();
    }

    hideClipboard() {
        this.clipboardEl.hide();
    }
}

function calBRAreaOffset(offset) {
    const {data} = this;
    const {
        left, top, width, height, scroll, l, t,
    } = offset;
    const ftwidth = data.freezeTotalWidth();
    const ftheight = data.freezeTotalHeight();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    let top0 = top - ftheight;
    if (ftheight > t) top0 -= scroll.y;
    return {
        left: left0,
        top: top0,
        width,
        height,
    };
}

function calTAreaOffset(offset) {
    const {data} = this;
    const {
        left, width, height, l, t, scroll,
    } = offset;
    const ftwidth = data.freezeTotalWidth();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    return {
        left: left0, top: t, width, height,
    };
}

function calLAreaOffset(offset) {
    const {data} = this;
    const {
        top, width, height, l, t, scroll,
    } = offset;
    const ftheight = data.freezeTotalHeight();
    let top0 = top - ftheight;
    // console.log('ftheight:', ftheight, ', t:', t);
    if (ftheight > t) top0 -= scroll.y;
    return {
        left: l, top: top0, width, height,
    };
}

function setBRAreaOffset(offset) {
    const {br} = this;
    br.setAreaOffset(calBRAreaOffset.call(this, offset));
}

function setTLAreaOffset(offset) {
    const {tl} = this;
    tl.setAreaOffset(offset);
}

function setTAreaOffset(offset) {
    const {t} = this;
    t.setAreaOffset(calTAreaOffset.call(this, offset));
}

function setLAreaOffset(offset) {
    const {l} = this;
    l.setAreaOffset(calLAreaOffset.call(this, offset));
}

function setLClipboardOffset(offset) {
    const {l} = this;
    l.setClipboardOffset(calLAreaOffset.call(this, offset));
}

function setBRClipboardOffset(offset) {
    const {br} = this;
    br.setClipboardOffset(calBRAreaOffset.call(this, offset));
}

function setTLClipboardOffset(offset) {
    const {tl} = this;
    tl.setClipboardOffset(offset);
}

function setTClipboardOffset(offset) {
    const {t} = this;
    t.setClipboardOffset(calTAreaOffset.call(this, offset));
}

function setAllAreaOffset(offset) {
    setBRAreaOffset.call(this, offset);
    setTLAreaOffset.call(this, offset);
    setTAreaOffset.call(this, offset);
    setLAreaOffset.call(this, offset);
}

function setAllClipboardOffset(offset) {
    setBRClipboardOffset.call(this, offset);
    setTLClipboardOffset.call(this, offset);
    setTClipboardOffset.call(this, offset);
    setLClipboardOffset.call(this, offset);
}

export default class Selector {
    constructor(data, sheet) {
        this.data = data;
        this.br = new SelectorElement(data, this, sheet);
        this.t = new SelectorElement(data, this, sheet);
        this.l = new SelectorElement(data, this, sheet);
        this.tl = new SelectorElement(data, this, sheet);
        this.br.el.show();
        this.offset = null;
        this.areaOffset = null;
        this.indexes = null;
        this.range = null;
        this.arange = null;
        this.el = h('div', `${cssPrefix}-selectors`)
            .children(
                this.tl.el,
                this.t.el,
                this.l.el,
                this.br.el,
            ).hide();

        // for performance
        this.lastri = -1;
        this.lastci = -1;

        startZIndex += 1;
    }

    setCss(b) {
        this.br.setCss(b);
        this.t.setCss(b);
        this.l.setCss(b);
        this.tl.setCss(b);
    }

    hide() {
        this.el.hide();
    }

    resetOffset() {
        const {
            data, tl, t, l, br,
        } = this;
        const freezeHeight = data.freezeTotalHeight();
        const freezeWidth = data.freezeTotalWidth();
        if (freezeHeight > 0 || freezeWidth > 0) {
            tl.setOffset({width: freezeWidth, height: freezeHeight});
            t.setOffset({left: freezeWidth, height: freezeHeight});
            l.setOffset({top: freezeHeight, width: freezeWidth});
            br.setOffset({left: freezeWidth, top: freezeHeight});
        } else {
            tl.hide();
            t.hide();
            l.hide();
            br.setOffset({left: 0, top: 0});
        }
    }

    resetAreaOffset() {
        // console.log('offset:', offset);
        const offset = this.data.getSelectedRect();
        const coffset = this.data.getClipboardRect();
        setAllAreaOffset.call(this, offset);
        setAllClipboardOffset.call(this, coffset);
        this.resetOffset();
    }

    resetBRTAreaOffset() {
        const offset = this.data.getSelectedRect();
        const coffset = this.data.getClipboardRect();
        setBRAreaOffset.call(this, offset);
        setTAreaOffset.call(this, offset);
        setBRClipboardOffset.call(this, coffset);
        setTClipboardOffset.call(this, coffset);
        this.resetOffset();
    }

    resetBRLAreaOffset() {
        const offset = this.data.getSelectedRect();
        const coffset = this.data.getClipboardRect();
        setBRAreaOffset.call(this, offset);
        setLAreaOffset.call(this, offset);
        setBRClipboardOffset.call(this, coffset);
        setLClipboardOffset.call(this, coffset);
        this.resetOffset();
    }

    set(ri, ci, indexesUpdated = true) {
        const {data} = this;
        const cellRange = data.calSelectedRangeByStart(ri, ci);
        const {sri, sci} = cellRange;
        if (indexesUpdated) {
            let [cri, cci] = [ri, ci];
            if (ri < 0) cri = 0;
            if (ci < 0) cci = 0;
            data.selector.setIndexes(cri, cci);
            this.indexes = [cri, cci];
        }

        this.moveIndexes = [sri, sci];
        // this.sIndexes = sIndexes;
        // this.eIndexes = eIndexes;
        this.range = cellRange;
        this.resetAreaOffset();
        this.el.show();
    }

    setEnd(ri, ci, moving = true) {
        const {data, lastri, lastci} = this;
        if (moving) {
            if (ri === lastri && ci === lastci) return;
            this.lastri = ri;
            this.lastci = ci;
        }
        this.range = data.calSelectedRangeByEnd(ri, ci);

        setAllAreaOffset.call(this, this.data.getSelectedRect());

    }

    setBoxinner(pointer) {
        this.br.setBoxinner(pointer);
        this.t.setBoxinner(pointer);
        this.l.setBoxinner(pointer);
        this.tl.setBoxinner(pointer);
    }

    reset() {
        // console.log('::::', this.data);
        const {eri, eci, sci, sri} = this.data.selector.range;
        // 原因是 从右下角往左上角选中，然后ctrl + c 会有bug  加下面一行的原因
        // this.set(sri, sci);
        this.setEnd(eri, eci);
    }

    setMove(rect) {
        setAllAreaOffset.call(this, rect);
    }

    showAutofill(ri, ci) {
        if (ri === -1 && ci === -1) return;
        // console.log('ri:', ri, ', ci:', ci);
        // const [sri, sci] = this.sIndexes;
        // const [eri, eci] = this.eIndexes;
        const {
            sri, sci, eri, eci,
        } = this.range;
        const [nri, nci] = [ri, ci];
        // const rn = eri - sri;
        // const cn = eci - sci;
        const srn = sri - ri;
        const scn = sci - ci;
        const ern = eri - ri;
        const ecn = eci - ci;
        if (scn > 0) {
            // left
            // console.log('left');
            this.arange = new CellRange(sri, nci, eri, sci - 1);
            // this.saIndexes = [sri, nci];
            // this.eaIndexes = [eri, sci - 1];
            // data.calRangeIndexes2(
        } else if (srn > 0) {
            // top
            // console.log('top');
            // nri = sri;
            this.arange = new CellRange(nri, sci, sri - 1, eci);
            // this.saIndexes = [nri, sci];
            // this.eaIndexes = [sri - 1, eci];
        } else if (ecn < 0) {
            // right
            // console.log('right');
            // nci = eci;
            this.arange = new CellRange(sri, eci + 1, eri, nci);
            // this.saIndexes = [sri, eci + 1];
            // this.eaIndexes = [eri, nci];
        } else if (ern < 0) {
            // bottom
            // console.log('bottom');
            // nri = eri;
            this.arange = new CellRange(eri + 1, sci, nri, eci);
            // this.saIndexes = [eri + 1, sci];
            // this.eaIndexes = [nri, eci];
        } else {
            // console.log('else:');
            this.arange = null;
            // this.saIndexes = null;
            // this.eaIndexes = null;
            return;
        }
        if (this.arange !== null) {
            // console.log(this.saIndexes, ':', this.eaIndexes);
            const offset = this.data.getRect(this.arange);
            offset.width += 2;
            offset.height += 2;
            const {
                br, l, t, tl,
            } = this;
            br.showAutofill(calBRAreaOffset.call(this, offset));
            l.showAutofill(calLAreaOffset.call(this, offset));
            t.showAutofill(calTAreaOffset.call(this, offset));
            tl.showAutofill(offset);
        }
    }

    hideAutofill() {
        ['br', 'l', 't', 'tl'].forEach((property) => {
            this[property].hideAutofill();
        });
    }

    showClipboard() {
        const coffset = this.data.getClipboardRect();
        setAllClipboardOffset.call(this, coffset);
        ['br', 'l', 't', 'tl'].forEach((property) => {
            this[property].showClipboard();
        });
    }

    showClipboard2(coffset) {
        setAllClipboardOffset.call(this, coffset);
        ['br', 'l', 't', 'tl'].forEach((property) => {
            this[property].showClipboard();
        });
    }

    hideClipboard() {
        ['br', 'l', 't', 'tl'].forEach((property) => {
            this[property].hideClipboard();
        });
    }
}

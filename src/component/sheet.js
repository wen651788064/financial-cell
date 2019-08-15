/* global window */
import {h} from './element';
import {bind, bindTouch, mouseMoveUp} from './event';
import Resizer from './resizer';
import Scrollbar from './scrollbar';
import Selector from './selector';
import Editor from './editor';
import ContextMenu from './contextmenu';
import Table from './table';
import Toolbar from './toolbar';
import ModalValidation from './modal_validation';
import SortFilter from './sort_filter';
import {xtoast} from './message';
import {cssPrefix} from '../config';
import {formulas} from '../core/formula';
import {getFontSizePxByPt} from "../core/font";
// import {baseFormats, multiply} from "../core/format";
import Advice from "../component/advice";
import {formatm} from "../core/format";
import {clearSelectors, editingSelectors, lockCells} from "../component/formula_editor";
import {deleteImg, hideDirectionArr, mountPaste} from "../event/paste";
import {mountCopy} from "../event/copy";
import Website from "../component/website";

function scrollbarMove() {
    const {
        data, verticalScrollbar, horizontalScrollbar,
    } = this;
    const {
        l, t, left, top, width, height,
    } = data.getSelectedRect();
    const tableOffset = this.getTableOffset();
    // console.log(',l:', l, ', left:', left, ', tOffset.left:', tableOffset.width);

    if (Math.abs(left) + width > tableOffset.width) {
        horizontalScrollbar.move({left: l + width - tableOffset.width});
    } else {
        const fsw = data.freezeTotalWidth();
        if (left < fsw) {
            horizontalScrollbar.move({left: l - 1 - fsw});
        }
    }
    // console.log('top:', top, ', height:', height, ', tof.height:', tableOffset.height);
    if (Math.abs(top) + height > tableOffset.height) {
        verticalScrollbar.move({top: t + height - tableOffset.height - 1});
    } else {
        const fsh = data.freezeTotalHeight();
        if (top < fsh) {
            verticalScrollbar.move({top: t - 1 - fsh});
        }
    }
}

function selectorSet(multiple, ri, ci, indexesUpdated = true, moving = false) {
    if (ri === -1 && ci === -1) return;
    // console.log(multiple, ', ri:', ri, ', ci:', ci);
    const {
        table, selector, toolbar,
    } = this;
    if (multiple) {
        selector.setEnd(ri, ci, moving);
    } else {
        selector.set(ri, ci, indexesUpdated);
    }
    toolbar.reset();

    // add
    if (this.render_timer) {
        clearTimeout(this.render_timer)
    }

    this.render_timer = setTimeout(() => {
        table.render();
    }, 50);
}

// multiple: boolean
// direction: left | right | up | down | row-first | row-last | col-first | col-last
function selectorMove(multiple, direction) {
    const {
        selector, data,
    } = this;
    const {rows, cols} = data;
    let [ri, ci] = selector.indexes;
    const {eri, eci} = selector.range;
    if (multiple) {
        [ri, ci] = selector.moveIndexes;
    }
    // console.log('selector.move:', ri, ci);
    if (direction === 'left') {
        if (ci > 0) ci -= 1;
    } else if (direction === 'right') {
        if (eci !== ci) ci = eci;
        if (ci < cols.len - 1) ci += 1;
    } else if (direction === 'up') {
        if (ri > 0) ri -= 1;
    } else if (direction === 'down') {
        if (eri !== ri) ri = eri;
        if (ri < rows.len - 1) ri += 1;
    } else if (direction === 'row-first') {
        ci = 0;
    } else if (direction === 'row-last') {
        ci = cols.len - 1;
    } else if (direction === 'col-first') {
        ri = 0;
    } else if (direction === 'col-last') {
        ri = rows.len - 1;
    }
    if (multiple) {
        selector.moveIndexes = [ri, ci];
    }
    selectorSet.call(this, multiple, ri, ci);
    scrollbarMove.call(this);
}

// private methods
function overlayerMousemove(evt) {

    // console.log('x:', evt.offsetX, ', y:', evt.offsetY);
    if (evt.buttons !== 0) return;
    if (evt.target.className === `${cssPrefix}-resizer-hover`) return;
    const {offsetX, offsetY} = evt;


    // url 展开
    const {website} = this;
    let {ri, ci} = data.getCellRectByXY(evt.pageX, evt.pageY - 41);
    website.show(ri, ci);


    // console.log("124", evt, this.x, this.y);
    const {
        rowResizer, colResizer, tableEl, data,
    } = this;
    const {rows, cols} = data;
    if (offsetX > cols.indexWidth && offsetY > rows.height) {
        rowResizer.hide();
        colResizer.hide();
        return;
    }
    const tRect = tableEl.box();
    const cRect = data.getCellRectByXY(evt.offsetX, evt.offsetY);
    if (cRect.ri >= 0 && cRect.ci === -1) {
        cRect.width = cols.indexWidth;
        rowResizer.show(cRect, {
            width: tRect.width,
        });
    } else {
        rowResizer.hide();
    }
    if (cRect.ri === -1 && cRect.ci >= 0) {
        cRect.height = rows.height;
        colResizer.show(cRect, {
            height: tRect.height,
        });
    } else {
        colResizer.hide();
    }
}

function overlayerMousescroll(evt) {
    const {verticalScrollbar, data} = this;
    const {autoLoad} = data.settings;
    const {top} = verticalScrollbar.scroll();
    // console.log('evt:::', evt.wheelDelta, evt.detail * 40);
    let delta = evt.deltaY;
    const {rows} = data;
    if (evt.detail) delta = evt.detail * 40;
    if (delta > 0 && autoLoad == true) {
        // up
        const ri = data.scroll.ri + 1;
        if (ri < rows.len) {
            verticalScrollbar.move({top: top + rows.getHeight(ri) - 1});
        }
    } else if (autoLoad == true) {
        // down
        const ri = data.scroll.ri - 1;
        if (ri >= 0) {
            verticalScrollbar.move({top: ri === 0 ? 0 : top - rows.getHeight(ri)});
        }
    }
}

function overlayerTouch(direction, distance) {
    const {verticalScrollbar, horizontalScrollbar} = this;
    const {top} = verticalScrollbar.scroll();
    const {left} = horizontalScrollbar.scroll();
    // console.log('direction:', direction, ', distance:', distance, left);
    if (direction === 'left' || direction === 'right') {
        horizontalScrollbar.move({left: left - distance});
    } else if (direction === 'up' || direction === 'down') {
        verticalScrollbar.move({top: top - distance});
    }
}

function verticalScrollbarSet() {
    const {data, verticalScrollbar} = this;
    const {height} = this.getTableOffset();
    verticalScrollbar.set(height, data.rows.totalHeight());
}

function horizontalScrollbarSet() {
    const {data, horizontalScrollbar} = this;
    const {width} = this.getTableOffset();
    if (data) {
        horizontalScrollbar.set(width, data.cols.totalWidth());
    }
}

function sheetFreeze() {
    const {
        selector, data, editor,
    } = this;
    const [ri, ci] = data.freeze;
    if (ri > 0 || ci > 0) {
        const fwidth = data.freezeTotalWidth();
        const fheight = data.freezeTotalHeight();
        editor.setFreezeLengths(fwidth, fheight);
    }
    selector.resetAreaOffset();
}

function sheetReset() {
    // debugger
    const {
        tableEl,
        overlayerEl,
        overlayerCEl,
        table,
        toolbar,
        selector,
        el,
    } = this;
    const tOffset = this.getTableOffset();
    const vRect = this.getRect();
    tableEl.attr(vRect);
    overlayerEl.offset(vRect);
    overlayerCEl.offset(tOffset);
    el.css('width', `${vRect.width}px`);
    renderAutoAdapt.call(this);
    autoRowResizer.call(this);

    verticalScrollbarSet.call(this);
    horizontalScrollbarSet.call(this);
    sheetFreeze.call(this);
    table.render();
    toolbar.reset();
    selector.reset();
}

function clearClipboard() {
    const {data, selector} = this;
    data.clearClipboard();
    selector.hideClipboard();
}

function copy() {
    const {data, selector} = this;
    data.copy();
    /*
        复制到系统剪贴板
     */

    selector.showClipboard();
}

function cut() {
    const {data, selector} = this;
    data.cut();
    selector.showClipboard();
}

const a = () => {
}

function paste(what, cb = (p) => {
    if (p) {
        sheetReset.call(this);
    }
}) {
    const {data} = this;
    let p = data.paste(what, msg => xtoast('Tip', msg));
    cb(p);

    return p;
}

function autofilter() {
    const {data} = this;
    data.autofilter();
    sheetReset.call(this);
}

function toolbarChangePaintformatPaste() {
    const {toolbar} = this;
    if (toolbar.paintformatActive()) {
        paste.call(this, 'format');
        clearClipboard.call(this);
        toolbar.paintformatToggle();
    }
}

function overlayerMousedown(evt) {
    // console.log(':::::overlayer.mousedown:', evt.detail, evt.button, evt.buttons, evt.shiftKey);
    // console.log('evt.target.className:', evt.target.className);
    const {
        selector, data, table, sortFilter, editor, advice
    } = this;
    const {offsetX, offsetY} = evt;
    const isAutofillEl = evt.target.className === `${cssPrefix}-selector-corner`;
    const cellRect = data.getCellRectByXY(offsetX, offsetY);
    const {
        left, top, width, height,
    } = cellRect;
    let {ri, ci} = cellRect;
    editor.setRiCi(ri, ci);

    // sort or filter
    const {autoFilter} = data;

    // trait add
    hideDirectionArr.call(this);
    advice.el.hide();

    if (autoFilter.includes2(ri, ci)) {
        autoFilter.getSet(data.exceptRowSet, ri);
    }

    if (autoFilter.includes(ri, ci)) {
        if (left + width - 20 < offsetX && top + height - 20 < offsetY) {
            const items = autoFilter.items(ci, (r, c) => data.rows.getCell(r, c));
            sortFilter.set(ci, items, autoFilter.getFilter(ci), autoFilter.getSort(ci));
            sortFilter.setOffset({left, top: top + height + 2});
            return;
        }
    }
    // console.log('ri:', ri, ', ci:', ci);
    if (!evt.shiftKey) {
        // console.log('selectorSetStart:::');
        if (isAutofillEl) {
            selector.showAutofill(ri, ci);
        } else {
            console.log("1")
            selectorSet.call(this, false, ri, ci);
        }

        // mouse move up
        mouseMoveUp(window, (e) => {
            // console.log('mouseMoveUp::::');
            ({ri, ci} = data.getCellRectByXY(e.pageX, e.pageY - 41));
            if (isAutofillEl) {
                selector.showAutofill(ri, ci);
            } else if (e.buttons === 1 && !e.shiftKey) {
                // console.log("2", e.offsetX, e.offsetY, ri, ci, e);
                selectorSet.call(this, true, ri, ci, true, true);
            }
        }, () => {
            if (isAutofillEl) {
                if (data.autofill(selector.arange, 'all', msg => xtoast('Tip', msg))) {
                    table.render();
                }
            }
            selector.hideAutofill();
            toolbarChangePaintformatPaste.call(this);
        });
    }

    if (!isAutofillEl && evt.buttons === 1) {
        if (evt.shiftKey) {
            console.log("3")
            // console.log('shiftKey::::');
            selectorSet.call(this, true, ri, ci);
        }
    }
}

function firstRowToWidth(width) {
    let cRect = {ri: -1, ci: 0, left: 60, top: 0, width: 100}
    colResizerFinished.call(this, cRect, width);
}

function editorSetOffset() {
    const {editor, data} = this;
    const sOffset = data.getSelectedRect();
    const tOffset = this.getTableOffset();
    let sPosition = 'top';
    // console.log('sOffset:', sOffset, ':', tOffset);
    if (sOffset.top > tOffset.height / 2) {
        sPosition = 'bottom';
    }
    editor.setOffset(sOffset, sPosition);
}

function hasEditor(showEditor = true) {
    console.log(showEditor, "344")
    let {selector} = this
    if (showEditor === true) {
        return this.overlayerCEl = h('div', `${cssPrefix}-overlayer-content`)
            .children(
                this.editor.el,
                this.selector.el,
            );
    } else {
        return this.overlayerCEl = h('div', `${cssPrefix}-overlayer-content`)
            .children(
                // this.editor.el,
                this.selector.el,
            );
    }
}

function editorSet(type = 1) {
    const {editor, data, selector} = this;
    editorSetOffset.call(this);
    editor.setCell(data.getSelectedCell(), data.getSelectedValidator(), type);
    selector.el.hide();
    clearClipboard.call(this);
}

function verticalScrollbarMove(distance) {
    const {data, table, selector} = this;
    data.scrolly(distance, () => {
        selector.resetBRLAreaOffset();
        editorSetOffset.call(this);
        table.render();
    });
}

function horizontalScrollbarMove(distance) {
    const {data, table, selector} = this;
    data.scrollx(distance, () => {
        selector.resetBRTAreaOffset();
        editorSetOffset.call(this);
        table.render();
    });
}

function renderAutoAdapt() {
    let {data, table} = this;
    const viewRange = data.viewRange2();
    let {autoAdapt} = data.settings.style;
    let {ignoreRi} = data.settings;
    let viewWidth = 0;

    if (autoAdapt) {
        viewRange.each((ri, ci) => {
            let txt = table.getCellTextContent(ri, ci);
            const dbox = table.getDrawBox(ri, ci);

            if (txt != undefined) {
                const style = table.getCellTextStyle(ri, ci);
                const font = Object.assign({}, style.font);
                font.size = getFontSizePxByPt(font.size);
                // 得到当前文字最宽的width
                let txtWidth = null;
                if (style.format != undefined) {
                    txtWidth = table.draw.selfAdaptionTxtWidth(formatm[style.format].render(txt), font, dbox);

                } else {
                    txtWidth = table.draw.selfAdaptionTxtWidth(txt, font, dbox);
                }
                if ((table.autoAdaptList[ci] == undefined || table.autoAdaptList[ci] < txtWidth) && ri > ignoreRi - 1) {
                    table.autoAdaptList[ci] = txtWidth;
                }
            }
        });
        if (table.autoAdaptList.length < 0) {
            return;
        }
        let {ignore} = data.settings;
        for (let i = 0; i < table.autoAdaptList.length; i++) {
            let _ignore = false;
            for (let j = 0; j < ignore.length; j++) {
                if (i == ignore[j]) _ignore = true;
            }
            if (_ignore == false) {
                if (table.autoAdaptList[i] == undefined) {
                    viewWidth += 50;
                    data.cols.setWidth(i, 50);
                } else {
                    if (table.autoAdaptList[i] < 30) {
                        table.autoAdaptList[i] = 30;
                    }
                    data.cols.setWidth(i, table.autoAdaptList[i]);
                }
            }
            viewWidth += table.autoAdaptList[i];

        }
        if (viewWidth > 0)
            data.settings.cellWidth = () => viewWidth;
    }
}

function autoRowResizer() {
    let {data, table} = this;
    let viewRange = data.viewRange2();
    let record_rc = 0, max = 0;
    let r_h = data.settings.row.height;
    let {autoAdapt} = data.settings.style;
    let viewHeight = 0;

    if (autoAdapt) {
        viewRange.each((ri, ci) => {
            const txt = table.getCellTextContent(record_rc, ci);
            const style = table.getCellTextStyle(ri, ci);
            const font = Object.assign({}, style.font);
            font.size = getFontSizePxByPt(font.size);
            const dbox = table.getDrawBox(record_rc, ci);
            // 1. 自适应调整一行的高度
            // 2. 进入下一行 得到 本行的max
            if (record_rc != ri && txt != undefined) {
                let record_h = data.rows.getHeight(record_rc);
                if (r_h * max != record_h) {
                    let c_h = font.size * max + dbox.padding * 2 + 2 * max;
                    // console.log("451", view.height(r_h * max));
                    data.rows.setHeight(record_rc, c_h);
                    viewHeight += c_h;
                } else {
                    viewHeight += record_h;
                }
                max = 0;
            } else if (txt != undefined && record_rc == ri) {
                if (txt != undefined) {
                    const n = table.draw.selfAdaptionHeight(dbox, txt, font);
                    if (n > max || max == 0) {
                        max = n;
                    }
                }
            }
            record_rc = ri;
        });
        let record_h = data.rows.getHeight(record_rc);
        const style = table.getCellTextStyle(record_h, 0);
        const font = Object.assign({}, style.font);
        font.size = getFontSizePxByPt(font.size);
        const dbox = table.getDrawBox(record_rc, 0);
        if (r_h * max != record_h && viewHeight > 0) {
            let c_h = font.size * max + dbox.padding * 2;
            viewHeight += c_h;
            data.rows.setHeight(record_rc, c_h);
        } else if (viewHeight > 0) {
            viewHeight += record_h;
        }
    }
    console.log(503, viewHeight)
    if (viewHeight > 0)
        data.settings.view.height = () => viewHeight + 40;
}

function rowResizerFinished(cRect, distance) {
    const {ri} = cRect;
    const {table, selector, data} = this;
    data.rows.setHeight(ri, distance);
    table.render();
    selector.resetAreaOffset();
    verticalScrollbarSet.call(this);
    editorSetOffset.call(this);
}

function colResizerFinished(cRect, distance) {
    const {ci} = cRect;
    const {table, selector, data} = this;
    data.cols.setWidth(ci, distance);
    // console.log('data:', data);
    table.render();
    selector.resetAreaOffset();
    horizontalScrollbarSet.call(this);
    editorSetOffset.call(this);
}

function selectorCellText(ri, ci, text, state) {
    if (ri == -1 || ci == -1) {
        return;
    }
    const {data, table, editor} = this;
    data.setCellText(ri, ci, text, state);
    editor.setRiCi(-1, -1);
}

function dataSetCellText(text, state = 'finished') {
    const {data, table} = this;
    // const [ri, ci] = selector.indexes;
    data.setSelectedCellText(text, state);
    if (state === 'finished') table.render();
}

function insertDeleteRowColumn(type) {
    const {data} = this;
    if (type === 'insert-row') {
        data.insert('row');
    } else if (type === 'delete-row') {
        data.delete('row');
    } else if (type === 'insert-column') {
        data.insert('column');
    } else if (type === 'delete-column') {
        data.delete('column');
    } else if (type === 'delete-cell') {
        data.deleteCell();
    } else if (type === 'delete-cell-format') {
        data.deleteCell('format');
    } else if (type === 'delete-cell-text') {
        data.deleteCell();
    }
    clearClipboard.call(this);
    sheetReset.call(this);
}

function toolbarChange(type, value) {
    const {data} = this;
    if (type === 'undo') {
        this.undo();
    } else if (type === 'redo') {
        this.redo();
    } else if (type === 'print') {
        // print
    } else if (type === 'paintformat') {
        if (value === true) copy.call(this);
        else clearClipboard.call(this);
    } else if (type === 'clearformat') {
        insertDeleteRowColumn.call(this, 'delete-cell-format');
    } else if (type === 'link') {
        // link
    } else if (type === 'chart') {
        // chart
    } else if (type === 'autofilter') {
        // filter
        autofilter.call(this);
    } else if (type === 'freeze') {
        let {showFreeze} = data.settings;
        console.log(showFreeze, 449)
        if (value && showFreeze === true) {
            const {ri, ci} = data.selector;
            this.freeze(ri, ci);
        } else {
            this.freeze(0, 0);
        }
    } else if (type === 'add') {
        data.showEquation = !data.showEquation;
        sheetReset.call(this);
    } else {
        //format percent 473
        data.setSelectedCellAttr(type, value);
        if (type === 'formula') {
            editorSet.call(this);
        }
        sheetReset.call(this);
    }
}

function sortFilterChange(ci, order, operator, value) {
    this.data.setAutoFilter(ci, order, operator, value);
    sheetReset.call(this);
}

function afterSelector(editor) {
    if (editor.getLock() || editor.state === 2) {
        let {inputText, ri, ci} = editor;
        selectorCellText.call(this, ri, ci, inputText, 'input');
    }
}

function sheetInitEvents() {
    const {
        overlayerEl,
        rowResizer,
        colResizer,
        verticalScrollbar,
        horizontalScrollbar,
        editor,
        table,
        contextMenu,
        data,
        toolbar,
        modalValidation,
        pasteOverlay,
        sortFilter,
    } = this;

    // pasteOverlay.on('mousedown', evt => {
    //   console.log("669");
    //   pasteOverlay.hide();
    // });

    // overlayer
    overlayerEl
        .on('mousemove', (evt) => {

            overlayerMousemove.call(this, evt);
        })
        .on('mousedown', (evt) => {
            // renderAutoAdapt.call(this);
            // autoRowResizer.call(this);
            // the left mouse button: mousedown → mouseup → click
            // the right mouse button: mousedown → contenxtmenu → mouseup
            if (evt.buttons === 2) {
                if (data.xyInSelectedRect(evt.offsetX, evt.offsetY)) {
                    contextMenu.setPosition(evt.offsetX, evt.offsetY);
                    evt.stopPropagation();
                } else {
                    contextMenu.hide();
                }
            } else if (evt.detail === 2) {
                editor.setMouseDownIndex([]);

                if (editor.getLock()) {
                    return;
                }
                editorSet.call(this, 2);
            } else {
                if (editor.getLock()) {
                    lockCells.call(this, evt)
                }
                if (!editor.getLock()) {
                    let {inputText, ri, ci} = editor;
                    if (ri !== -1 && ci !== -1 && inputText[0] === "=") {
                        selectorCellText.call(this, ri, ci, inputText, 'input');
                    }
                    let {formula} = data.settings;
                    if (formula && typeof formula.wland == "function") {
                        formula.wland(formula, data, table);
                    }
                    editor.clear();
                    overlayerMousedown.call(this, evt);
                    clearSelectors.call(this);
                }
            }
        }).on('mousewheel.stop', (evt) => {
        overlayerMousescroll.call(this, evt);
    });

    // slide on mobile
    bindTouch(overlayerEl.el, {
        move: (direction, d) => {
            overlayerTouch.call(this, direction, d);
        }
    });

    // toolbar change
    toolbar.change = (type, value) => toolbarChange.call(this, type, value);

    // sort filter ok
    sortFilter.ok = (ci, order, o, v) => sortFilterChange.call(this, ci, order, o, v);

    // resizer finished callback
    rowResizer.finishedFn = (cRect, distance) => {
        rowResizerFinished.call(this, cRect, distance);
    };
    colResizer.finishedFn = (cRect, distance) => {
        colResizerFinished.call(this, cRect, distance);
    };
    // scrollbar move callback
    verticalScrollbar.moveFn = (distance, evt) => {
        verticalScrollbarMove.call(this, distance, evt);
    };
    horizontalScrollbar.moveFn = (distance, evt) => {
        horizontalScrollbarMove.call(this, distance, evt);
    };
    // editor
    editor.change = (state, itext) => {
        // 如果是 esc
        if (itext == "@~esc") {
            editor.setText("");
            clearSelectors.call(this);
            editor.clear();
            return;
        }

        //实时更新this.selectors
        let {lock} = editor;
        editor.setMouseDownIndex([]);
        editingSelectors.call(this, itext);
        if (lock && itext != '=') {
            return;
        }
        if (this.selectors.length > 0) {
            return;
        }

        dataSetCellText.call(this, itext, state);
    };
    // modal validation
    modalValidation.change = (action, ...args) => {
        if (action === 'save') {
            data.addValidation(...args);
        } else {
            data.removeValidation();
        }
    };
    // contextmenu
    contextMenu.itemClick = (type) => {
        // console.log('type:', type);
        if (type === 'validation') {
            modalValidation.setValue(data.getSelectedValidation());
        } else if (type === 'copy') {
            copy.call(this);
        } else if (type === 'cut') {
            cut.call(this);
        } else if (type === 'paste') {
            paste.call(this, 'all');
        } else if (type === 'paste-value') {
            paste.call(this, 'text');
        } else if (type === 'paste-format') {
            paste.call(this, 'format');
        } else {
            insertDeleteRowColumn.call(this, type);
        }
    };

    bind(window, 'resize', () => {
        this.reload();
    });

    bind(window, 'click', (evt) => {
        this.focusing = overlayerEl.contains(evt.target);
    });

    bind(window, 'copy', (evt) => {
        mountCopy.call(this, evt);
    });

    bind(document, 'paste', (evt) => {
        mountPaste.call(this, evt, () => {
            sheetReset.call(this);
        });
    });

    // for selector
    bind(window, 'keydown', (evt) => {
        if (!this.focusing) return;
        const keyCode = evt.keyCode || evt.which;
        const {
            key, ctrlKey, shiftKey, altKey, metaKey,
        } = evt;
        // console.log('keydown.evt: ', keyCode);
        if (this.direction) {
            console.log(keyCode);
            switch (keyCode) {
                case 8:         // delete
                    deleteImg.call(this);
                    break;
            }
            console.log("831");
        } else if (ctrlKey || metaKey) {
            // const { sIndexes, eIndexes } = selector;
            let what = 'all';
            if (shiftKey) what = 'text';
            if (altKey) what = 'format';
            switch (keyCode) {
                case 90:
                    // undo: ctrl + z
                    this.undo();
                    evt.preventDefault();
                    break;
                case 89:
                    // redo: ctrl + y
                    this.redo();
                    evt.preventDefault();
                    break;
                case 67:
                    // ctrl + c
                    copy.call(this);
                    // evt.preventDefault();
                    break;
                case 88:
                    // ctrl + x
                    cut.call(this);
                    evt.preventDefault();
                    break;
                case 85:
                    // ctrl + u
                    toolbar.trigger('underline');
                    evt.preventDefault();
                    break;
                case 86:
                    // ctrl + v

                    paste.call(this, what, () => {
                        console.log("837")
                    });

                    break;
                case 37:
                    // ctrl + left

                    selectorMove.call(this, shiftKey, 'row-first');
                    evt.preventDefault();
                    break;
                case 38:
                    // ctrl + up
                    selectorMove.call(this, shiftKey, 'col-first');
                    evt.preventDefault();
                    break;
                case 39:
                    // ctrl + right
                    selectorMove.call(this, shiftKey, 'row-last');
                    evt.preventDefault();
                    break;
                case 40:
                    // ctrl + down
                    selectorMove.call(this, shiftKey, 'col-last');
                    evt.preventDefault();
                    break;
                case 32:
                    // ctrl + space, all cells in col
                    selectorSet.call(this, false, -1, data.selector.ci, false);
                    evt.preventDefault();
                    break;
                case 66:
                    // ctrl + B
                    toolbar.trigger('font-bold');
                    break;
                case 73:
                    // ctrl + I
                    toolbar.trigger('font-italic');
                    break;
                default:
                    break;
            }
        } else {
            // console.log('evt.keyCode:', evt.keyCode);
            switch (keyCode) {
                case 32:
                    if (shiftKey) {
                        // shift + space, all cells in row
                        selectorSet.call(this, false, data.selector.ri, -1, false);
                    }
                    break;
                case 27: // esc
                    contextMenu.hide();
                    clearClipboard.call(this);
                    break;
                case 37: // left
                    selectorMove.call(this, shiftKey, 'left');
                    evt.preventDefault();
                    break;
                case 38: // up
                    selectorMove.call(this, shiftKey, 'up');
                    evt.preventDefault();
                    break;
                case 39: // right
                    selectorMove.call(this, shiftKey, 'right');
                    evt.preventDefault();
                    break;
                case 40: // down
                    selectorMove.call(this, shiftKey, 'down');
                    evt.preventDefault();
                    break;
                case 9: // tab
                    // lockCells
                    afterSelector.call(this, editor);

                    editor.clear();
                    // shift + tab => move left
                    // tab => move right
                    selectorMove.call(this, false, shiftKey ? 'left' : 'right');
                    evt.preventDefault();
                    // 清除各种属性
                    clearSelectors.call(this);
                    break;
                case 13: // enter
                    // lockCells
                    afterSelector.call(this, editor);

                    editor.clear();
                    renderAutoAdapt.call(this);
                    autoRowResizer.call(this);
                    selectorMove.call(this, false, shiftKey ? 'up' : 'down');
                    let {formula} = data.settings;
                    if (formula && typeof formula.wland == "function") {
                        formula.wland(formula, data, table);
                    }

                    evt.preventDefault();
                    // 清除各种属性
                    clearSelectors.call(this);
                    break;
                case 8: // backspace
                    insertDeleteRowColumn.call(this, 'delete-cell-text');
                    evt.preventDefault();
                    break;
                default:
                    break;
            }

            if (key === 'Delete') {
                insertDeleteRowColumn.call(this, 'delete-cell-text');
                evt.preventDefault();
            } else if ((keyCode >= 65 && keyCode <= 90)
                || (keyCode >= 48 && keyCode <= 57)
                || (keyCode >= 96 && keyCode <= 105)
                || evt.key === '='
            ) {
                dataSetCellText.call(this, evt.key, 'input');
                editorSet.call(this);
            } else if (keyCode === 113) {
                // F2
                editorSet.call(this);
            }
        }
    });
}

export {
    sheetReset,
    selectorSet,
}

export default class Sheet {
    constructor(targetEl, data) {
        const {view, showToolbar, showContextmenu, showEditor, rowWidth} = data.settings;
        this.el = h('div', `${cssPrefix}-sheet`);
        this.toolbar = new Toolbar(data, view.width, !showToolbar);

        targetEl.children(this.toolbar.el, this.el);
        this.data = data;
        // table
        this.tableEl = h('canvas', `${cssPrefix}-table`);
        // resizer
        this.rowResizer = new Resizer(false, data.rows.height);
        this.colResizer = new Resizer(true, data.cols.minWidth);
        // scrollbar
        this.verticalScrollbar = new Scrollbar(true);
        this.horizontalScrollbar = new Scrollbar(false);
        // editor
        this.editor = new Editor(
            formulas,
            () => this.getTableOffset(),
            data.rows.height,
        );
        // data validation
        this.modalValidation = new ModalValidation();
        // contextMenu
        this.contextMenu = new ContextMenu(() => this.getTableOffset(), !showContextmenu);
        // selector
        this.selector = new Selector(data);

        this.advice = new Advice(data, this);

        this.website = new Website(data);

        this.pasteDirectionsArr = [];
        // this.pasteOverlay = h('div', `${cssPrefix}-paste-overlay-container`).hide();

        this.selectors = [];

        this.overlayerCEl = hasEditor.call(this, showEditor);

        this.overlayerEl = h('div', `${cssPrefix}-overlayer`)
            .child(this.overlayerCEl);
        // sortFilter
        this.sortFilter = new SortFilter();
        this.direction = false;   // 图片移动

        // root element

        this.el.children(
            this.tableEl,
            this.rowResizer.el,
            this.overlayerEl.el,
            this.colResizer.el,
            this.verticalScrollbar.el,
            this.horizontalScrollbar.el,
            this.contextMenu.el,
            this.modalValidation.el,
            this.sortFilter.el,
            this.advice.el,
            this.website.el
            // this.pasteOverlay.el,
        );

        // table
        this.table = new Table(this.tableEl.el, data);
        sheetInitEvents.call(this);
        sheetReset.call(this);
        // init selector [0, 0]
        selectorSet.call(this, false, 0, 0);

        if (rowWidth && rowWidth.state) {
            firstRowToWidth.call(this, rowWidth.width)
        }
    }

    loadData(data) {
        this.data.setData(data);
        sheetReset.call(this);
        return this;
    }

    // freeze rows or cols
    freeze(ri, ci) {
        const {data} = this;
        data.setFreeze(ri, ci);
        sheetReset.call(this);
        return this;
    }

    undo() {
        this.data.undo();
        sheetReset.call(this);
    }

    redo() {
        this.data.redo();
        sheetReset.call(this);
    }

    reload() {
        sheetReset.call(this);
        return this;
    }

    getRect() {
        const {data} = this;
        return {width: data.viewWidth(), height: data.viewHeight()};
    }

    getTableOffset() {
        const {rows, cols} = this.data;
        const {width, height} = this.getRect();
        return {
            width: width - cols.indexWidth,
            height: height - rows.height,
            left: cols.indexWidth,
            top: rows.height,
        };
    }
}

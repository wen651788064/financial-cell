import {stringAt, xy2expr} from '../core/alphabet';
import {getFontSizePxByPt} from '../core/font';
import _cell from '../core/cell';
import {formulam} from '../core/formula';
import {formatm} from '../core/format';
import {isMinus} from "../utils/number_util";
import {Draw, DrawBox, npx, thinLineWidth,} from '../canvas/draw';
import ApplicationFactory from "./application";
import CellProxy from "./cell_proxy";
import {look} from "../config";
import {textReplaceAndToUpperCase, textReplaceQM} from "./context_process";
import {dateDiff} from "./date";
// import Worker from 'worker-loader!../external/Worker.js';

var formulajs = require('formulajs');
// gobal var
const cellPaddingWidth = 5;
const tableFixedHeaderCleanStyle = {fillStyle: '#f4f5f8'};
const tableGridStyle = {
    fillStyle: '#fff',
    lineWidth: thinLineWidth,
    strokeStyle: '#e6e6e6',
};

function tableFixedHeaderStyle() {
    return {
        textAlign: 'center',
        textBaseline: 'middle',
        font: `500 ${npx(12)}px Source Sans Pro`,
        fillStyle: '#585757',
        lineWidth: thinLineWidth(),
        strokeStyle: '#e6e6e6',
    };
}

function getDrawBox(rindex, cindex) {
    const {data} = this;
    const {
        left, top, width, height,
    } = data.cellRect(rindex, cindex);
    return new DrawBox(left, top, width, height, cellPaddingWidth);
}

function getAutoDrawBox(rindex, cindex, width) {
    const {data} = this;
    const {
        left, top, height
    } = data.cellRect(rindex, cindex);
    return new DrawBox(left, top, width, height, cellPaddingWidth);
}

function getCellTextStyle(rindex, cindex) {
    const {data} = this;
    const {sortedRowMap} = data;
    let nrindex = rindex;
    if (sortedRowMap.has(rindex)) {
        nrindex = sortedRowMap.get(rindex);
    }

    const style = data.getCellStyleOrDefault(nrindex, cindex);

    return style;
}

function getStr(str) {
    let result = str.match(/\"(.*?)\"/ig);
    if (!result)
        return "";
    return result.map(function (element) {
        return element.replace(/\"/g, '');
    });
}


export function toUpperCase(text) {
    let enter = 1;
    // let k = 1;
    let newText = "";
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\"' && enter === 1)
            enter = 3;
        else if (text[i] === '\"' && enter === 3) {
            enter = 1;
        }

        if (text[i] === ')' && enter !== 1) {
            newText = newText + "\"";
            enter = 1;
        }

        if (enter !== 3) {
            newText = newText + (text[i] + "").toUpperCase();
        } else {
            newText = newText + text[i] + "";
        }
    }
    if (enter === 3) {
        newText = newText + "\"";
    }

    return newText;
}

function specialHandle(type, cell, ri, ci) {
    const {data} = this;
    // 当用户离开一个单元格的时候 执行这个操作
    const {isValid, diff} = dateDiff(cell.text);
    if(isValid) {
        data.dateInput(cell.text, cell.text, diff,  ri,  ci);
    }

    if(typeof cell.style === 'undefined') {
        return {
            "state": false,
            "text": cell.text
        };
    }

    let cellStyle = data.getCellStyle(ri, ci);
    if(type === 'date' && cellStyle.format && cellStyle.format === type) {
        let d = data.getCellStyleHandle(cell.style, type, cell, ri, ci);
        return {
            "state": true,
            "text": d ? cell.diff : cell.text
        };
    }
    return {
        "state": false,
        "text": cell.text
    };
}

function each() {

}

// 第五个参数cb 在row setdata的时候 才会执行
export function loadData(viewRange, load = false, read = false, cb = (ri, ci) => {}) {
    let {data} = this;
    let workbook = [];
    workbook.Sheets = {};
    workbook.Sheets[data.name] = {};
    let workbook_no_formula = [];
    workbook_no_formula.Sheets = {};
    workbook_no_formula.Sheets[data.name] = {};
    let enter = 0;

    console.time("loadData need time");
    let {mri, mci} = this.data.rows.getMax();
    viewRange.eachGivenRange((ri, ci, eri, eci,) => {
        let cell2 = this.proxy.deepCopy(data.getCell(ri, ci));
        // cb(ri, ci, cell2.text, data);
        let cell = data.getCell(ri, ci);
        let expr = xy2expr(ci, ri);
        if (data.isEmpty(cell) === false) {
            let {state, text} = specialHandle.call(this, 'date', cell, ri, ci);
            cell.text = text;
            cell.text = data.getRegularText(cell.text);

            if (data.backEndCalc(cell.text)) {
                workbook.Sheets[data.name][expr] = {v: "", f: ""};
            } else {
                if (data.isNeedCalc(cell)) {
                    let {factory} = this;
                    factory.push(cell.formulas);
                    enter = factory.lock;
                    enter = enter ? 1 : 0;
                }

                workbook_no_formula.Sheets[data.name][expr] = {
                    v: cell.text,
                    f: !cell.formulas ? cell.text : cell.formulas,
                    z: true
                };

                if (data.textIsFormula(cell.text)) {
                    if (isNaN(cell.text)) {
                        cell.text = toUpperCase(cell.text); // 为什么要.toUpperCase() 呢？ => =a1 需要变成=A1
                    }

                    if (load) {
                        workbook.Sheets[data.name][expr] = {
                            v: '-',
                            f: '',
                            z: true
                        };
                    } else {
                        workbook.Sheets[data.name][expr] = {
                            v: '',
                            f: cell.text,
                            z: true,
                        };
                    }
                } else {
                    if (!isNaN(textReplaceAndToUpperCase(cell.text))) {
                        workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text, true),
                            z: true
                        };
                    } else {
                        workbook.Sheets[data.name][expr] = {
                            v: textReplaceQM(cell.text),
                            z: true
                        };
                    }
                }
            }
            if(state) {
                data.setCellWithFormulas(ri, ci, cell2.text, cell.formulas);
            }

        }
        else {
            workbook.Sheets[data.name][expr] = {v: 0, f: 0, z: false};
        }
    }, mri, mci);
    console.timeEnd("loadData need time");

    return {
        workbook,
        enter,
        workbook2: workbook_no_formula
    };
}

async function parseCell(viewRange, state = false, src = '', state2 = true) {
    let {data, proxy} = this;
    let {workbook, workbook2, enter} = loadData.call(this, viewRange, false, true);


    let {factory} = this;
    let s = await factory.getSamples(workbook.Sheets);


    let sall = workbook2;
    Object.keys(s).forEach(i => {
        if (i !== data.name) {
            workbook.Sheets[i] = s[i];
            sall.Sheets[i] = s[i];
        }
    });

    let ca = proxy.calc(sall, data.name);
    if (ca.state) {
        workbook.Sheets[data.name] = ca.data;
    }
    if (state) {
        workbook.Sheets[data.name]['A1'] = {v: '', f: `=${src}`};
    }
    console.time("x3");

    if (ca.state) {
        let assoc = proxy.associated(data.name, workbook);
        ca.state = ca.state === false ? assoc.enter : ca.state;
        workbook = assoc.enter === true ? assoc.nd : workbook;
    }
    console.timeEnd("x3");

    let redo = false;
    // this.editor.display &&
    if (ca.state) {
        try {
            console.time("x4");
            redo = true;
            // if(proxy.countProperties(workbook)) {
            //     let {worker} = this;
            //     worker.terminate();
            //     worker = new Worker();
            //
            //     workbook = proxy.pack(data.name, workbook);
            //     worker.postMessage({workbook});
            //
            //     worker.addEventListener("message", (event) => {
            //         workbook = event.data.data;
            //         let {factory} = this;
            //         factory.data = workbook;
            //         workbook = proxy.concat(data.name, workbook);
            //         let cells = proxy.unpack(workbook.Sheets[data.name],  data.rows._);
            //         data.rows.setData(cells);
            //         data.change(data.getData());
            //         this.render(true, workbook);
            //     });
            // // } else {
            workbook = proxy.pack(data.name, workbook);

            data.calc(workbook);
            // proxy.isDone();   // 如果有问题再取消注释，看看是否有问题
            let {factory} = this;
            factory.data = workbook;
            workbook = proxy.concat(data.name, workbook);
            let cells = proxy.unpack(workbook.Sheets[data.name], data.rows._);
            data.rows.setData(cells);
            data.change(data.getData());
            // }
            console.timeEnd("x4");
        } catch (e) {
            console.error(e);
        }
    } else {
        if(state2 != false) {
            factory.data = sall;
            proxy.setOldData(sall);
            workbook = factory.data;
            redo = false;
        }
    }


    return {
        "state": enter,
        "redo": redo,
        "data": workbook
    };
}

export function parseCell2(viewRange, state = false, src = '') {
    let {data} = this;
    let {calc, rows} = data;
    let workbook = [];
    workbook.Sheets = {};
    workbook.Sheets[data.name] = {};

    viewRange.each2((ri, ci) => {
        let cell = data.getCell(ri, ci);
        let expr = xy2expr(ci, ri);
        if (cell && cell.text) {
            cell.text = cell.text + "";
            if (cell.text.indexOf("MD.RTD") != -1) {
                workbook.Sheets[data.name][expr] = {v: "", f: ""};
            } else {
                if (cell.text && cell.text.lastIndexOf("=") === 0) {
                    workbook.Sheets[data.name][expr] = {
                        v: '',
                        f: cell.text.replace(/ /g, '').replace(/\"/g, "\"").replace(/\"\"\"\"&/g, "\"'\"&")
                    };
                } else {
                    workbook.Sheets[data.name][expr] = {
                        v: cell.text.replace(/ /g, '').toUpperCase().replace(/\"/g, "\""),
                        f: ''
                    };
                }
            }
        }
        else {
            workbook.Sheets[data.name][expr] = {v: 0, f: 0};
        }
    });


    if (state) {
        workbook.Sheets[data.name]['A1'] = {v: '', f: `${src}`};
    }

    try {
        calc(workbook);
    } catch (e) {
        console.error(e);
    }
    return workbook;
}

function specialStyle(text) {
    text = text + "";
    if (!text) {
        return false;
    }
    if (look.indexOf(text.split("!")[0]) === 1) {
        return true;
    }
    return false;
}

function renderCell(rindex, cindex, sheetbook) {
    const {draw, data} = this;
    const {sortedRowMap} = data;
    let nrindex = rindex;
    if (sortedRowMap.has(rindex)) {
        nrindex = sortedRowMap.get(rindex);
    }

    const cell = data.getCell(nrindex, cindex);
    if (cell === null) return;
    // data.rows.setHeight(1, 50);

    // console.log(rindex, nrindex, "63")
    const style = data.getCellStyleOrDefault(nrindex, cindex);
    const dbox = getDrawBox.call(this, rindex, cindex);
    dbox.bgcolor = style.bgcolor;
    if (style.border !== undefined) {
        dbox.setBorders(style.border);
        // bboxes.push({ ri: rindex, ci: cindex, box: dbox });
        draw.strokeBorders(dbox);
    }

    let cellText = "";
    if (!cell.formulas) {
        cell.formulas = !cell.text ? "" : cell.text;
    }
    if (data.showEquation) {
        cellText = cell.formulas;
    } else {
        cellText = _cell.render(data, sheetbook, rindex, cindex, cell.text || '', formulam, (y, x) => (data.getCellTextOrDefault(x, y)));
    }
    draw.rect2(dbox, () => {
        // render text
        if (style.format) {
            // console.log(data.formatm, '>>', cell.format);
            cellText = formatm[style.format].render(cellText);
        }
        const font = Object.assign({}, style.font);

        font.size = getFontSizePxByPt(font.size);
        let {ignore, minus} = data.settings;
        let color = style.color;
        // console.log('style:', cellText);
        if (minus == true && isMinus(cellText)) {
            color = 'red'
        }
        let underline = style.underline;
        let regex = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
        cellText = cellText + "";
        let text = cellText.substr(0, 3).toLowerCase() == "www" ? "http://" + cellText : cellText;
        if (regex.test(text) || specialStyle(cell.text)) {
            color = "#4b89ff";
            underline = true;
        }

        draw.text(cellText, dbox, {
            align: style.align,
            valign: style.valign,
            font,
            color: color,
            strike: style.strike,
            underline: underline,
            ignore: ignore,
            cindex: cindex,
        }, style.textwrap);
        // error
        const error = data.validations.getError(rindex, cindex);
        if (error) {
            draw.error(dbox);
        }
    }, style.textwrap, cellText);
}

function renderFlexible() {
    const {draw, data} = this;
    const {autoFilter} = data;
    const {flex} = autoFilter;

    for (let i = 0; i < flex.length; i++) {
        let {ri, ci, state} = flex[i];
        let s_t = 0;
        for (let j = 0; j < i; j++) {
            let {set_total, state} = flex[j];
            if (state == true) {
                s_t += set_total;
            }
        }

        const dbox = getDrawBox.call(this, ri, ci);
        draw.dropup(dbox, state, s_t * 25);
    }

    // const dbox = getDrawBox.call(this, ri, ci);
    // draw.dropup(dbox);
}

function renderAutofilter(viewRange) {
    // debugger
    const {data, draw} = this;
    if (viewRange) {
        const {autoFilter} = data;

        if (!autoFilter.active()) {
            return;
        }
        const afRange = autoFilter.hrange();
        if (viewRange.intersects(afRange)) {
            afRange.each((ri, ci) => {
                console.log(ri, ci, 108)
                const dbox = getDrawBox.call(this, ri, ci);
                draw.dropdown(dbox);
            });
        }
    }
    // renderFlexible.call(this, 1, 1)
}

async function renderContent(viewRange, fw, fh, tx, ty, sheetbook) {
    // let sheetbook = args.data;
    const {draw, data} = this;
    draw.save();
    draw.translate(fw, fh)
        .translate(tx, ty);

    const {exceptRowSet} = data;

    const filteredTranslateFunc = (ri) => {
        const ret = exceptRowSet.has(ri);
        if (ret) {
            const height = data.rows.getHeight(ri);
            draw.translate(0, -height);
        }
        return !ret;
    };
    // 1 render cell
    draw.save();

    viewRange.each((ri, ci) => {
        renderCell.call(this, ri, ci, sheetbook);
    }, ri => filteredTranslateFunc(ri));
    draw.restore();
    // 2 render cell border
    // draw.save();
    // renderCellBorders.call(this, bboxes, (ri) => filteredTranslateFunc(ri));
    // draw.restore();

    // / bboxes = [];
    // 3 render mergeCell
    const rset = new Set();
    draw.save();
    data.eachMergesInView(viewRange, ({sri, sci, eri}) => {
        if (!exceptRowSet.has(sri)) {
            renderCell.call(this, sri, sci, sheetbook);
        } else if (!rset.has(sri)) {
            rset.add(sri);
            const height = data.rows.sumHeight(sri, eri + 1);
            draw.translate(0, -height);
        }
    });
    draw.restore();


    // 4 render autofilter
    renderAutofilter.call(this, viewRange);

    // 5 render flex
    renderFlexible.call(this);

    draw.restore();
}

function renderSelectedHeaderCell(x, y, w, h) {
    const {draw} = this;
    draw.save();
    draw.attr({fillStyle: 'rgba(75, 137, 255, 0.08)'})
        .fillRect(x, y, w, h);
    draw.restore();
}

// viewRange
// type: all | left | top
// w: the fixed width of header
// h: the fixed height of header
// tx: moving distance on x-axis
// ty: moving distance on y-axis
function renderFixedHeaders(type, viewRange, w, h, tx, ty) {
    const {draw, data} = this;
    const sumHeight = viewRange.h; // rows.sumHeight(viewRange.sri, viewRange.eri + 1);
    const sumWidth = viewRange.w; // cols.sumWidth(viewRange.sci, viewRange.eci + 1);
    const nty = ty + h;
    const ntx = tx + w;

    draw.save();
    // draw rect background
    draw.attr(tableFixedHeaderCleanStyle);
    if (type === 'all' || type === 'left') draw.fillRect(0, nty, w, sumHeight);
    if (type === 'all' || type === 'top') draw.fillRect(ntx, 0, sumWidth, h);

    const {
        sri, sci, eri, eci,
    } = data.selector.range;
    // console.log(data.selectIndexes);
    // draw text
    // text font, align...
    draw.attr(tableFixedHeaderStyle());
    // y-header-text
    if (type === 'all' || type === 'left') {
        data.rowEach(viewRange.sri, viewRange.eri, (i, y1, rowHeight) => {
            const y = nty + y1;
            const ii = i;
            draw.line([0, y], [w, y]);
            if (sri <= ii && ii < eri + 1) {
                renderSelectedHeaderCell.call(this, 0, y, w, rowHeight);
            }
            draw.fillText(ii + 1, w / 2, y + (rowHeight / 2));
        });
        draw.line([0, sumHeight + nty], [w, sumHeight + nty]);
        draw.line([w, nty], [w, sumHeight + nty]);
    }
    // x-header-text
    if (type === 'all' || type === 'top') {
        data.colEach(viewRange.sci, viewRange.eci, (i, x1, colWidth) => {
            const x = ntx + x1;
            const ii = i;
            draw.line([x, 0], [x, h]);
            if (sci <= ii && ii < eci + 1) {
                renderSelectedHeaderCell.call(this, x, 0, colWidth, h);
            }
            draw.fillText(stringAt(ii), x + (colWidth / 2), h / 2);
        });
        draw.line([sumWidth + ntx, 0], [sumWidth + ntx, h]);
        draw.line([0, h], [sumWidth + ntx, h]);
    }
    draw.restore();
}

function renderFixedLeftTopCell(fw, fh) {
    const {draw} = this;
    draw.save();
    // left-top-cell
    draw.attr({fillStyle: '#f4f5f8'})
        .fillRect(0, 0, fw, fh);
    draw.restore();
}

function renderContentGrid({
                               sri, sci, eri, eci, w, h,
                           }, fw, fh, tx, ty) {
    const {draw, data} = this;
    const {settings} = data;

    draw.save();
    draw.attr(tableGridStyle)
        .translate(fw + tx, fh + ty);
    // const sumWidth = cols.sumWidth(sci, eci + 1);
    // const sumHeight = rows.sumHeight(sri, eri + 1);
    // console.log('sumWidth:', sumWidth);
    draw.clearRect(0, 0, w, h);
    if (!settings.showGrid) {
        draw.restore();
        return;
    }
    // console.log('rowStart:', rowStart, ', rowLen:', rowLen);
    data.rowEach(sri, eri, (i, y, ch) => {
        // console.log('y:', y);
        if (i !== sri) draw.line([0, y], [w, y]);
        if (i === eri) draw.line([0, y + ch], [w, y + ch]);
    });
    data.colEach(sci, eci, (i, x, cw) => {
        if (i !== sci) draw.line([x, 0], [x, h]);
        if (i === eci) draw.line([x + cw, 0], [x + cw, h]);
    });
    draw.restore();
}

function renderFreezeHighlightLine(fw, fh, ftw, fth) {
    const {draw, data} = this;
    const twidth = data.viewWidth() - fw;
    const theight = data.viewHeight() - fh;
    draw.save()
        .translate(fw, fh)
        .attr({strokeStyle: 'rgba(75, 137, 255, .6)'});
    draw.line([0, fth], [twidth, fth]);
    draw.line([ftw, 0], [ftw, theight]);
    draw.restore();
}

/** end */
class Table {
    constructor(el, data, editor) {
        this.el = el;
        this.draw = new Draw(el, data.viewWidth(), data.viewHeight());
        this.factory = new ApplicationFactory(data.methods, data.name, this);
        this.editor = editor;
        this.data = data;
        this.timer = null;
        // this.worker = new Worker();
        this.proxy = new CellProxy(data.refRow, this);
        this.autoAdaptList = [];
    }


    getCellTextContent(rindex, cindex) {
        const {data} = this;
        const {sortedRowMap} = data;
        let nrindex = rindex;
        if (sortedRowMap.has(rindex)) {
            nrindex = sortedRowMap.get(rindex);
        }

        const cell = data.getCell(nrindex, cindex);
        if (cell === null) return;
        // console.log("62", cell.adapt);

        let cellText = _cell.render(cell.text || '', formulam, (y, x) => (data.getCellTextOrDefault(x, y)));
        return cellText;
    }

    getDrawBox(rindex, cindex) {
        const {data} = this;
        const {
            left, top, width, height,
        } = data.cellRect(rindex, cindex);
        return new DrawBox(left, top, width, height, cellPaddingWidth);
    }

    getCellTextStyle(rindex, cindex) {
        const {data} = this;
        const {sortedRowMap} = data;
        let nrindex = rindex;
        if (sortedRowMap.has(rindex)) {
            nrindex = sortedRowMap.get(rindex);
        }

        const style = data.getCellStyleOrDefault(nrindex, cindex);

        return style;
    }

    specialHandle(type, cell, ri, ci) {
        return specialHandle.call(this, type, cell, ri, ci);
    }

    async render(temp = false, tempData, redo = false, state = true) {
        // resize canvas
        const {data} = this;
        const {rows, cols} = data;
        let viewRange = data.viewRange();

        let workbook = "";
        if (!temp) {
            let args = await parseCell.call(this, viewRange, false, '', state);

            // if(args.redo === false && redo == false) {
            //     return;
            // }

            if (args.state == 1) {
                this.render();
                return;
            } else if (args.state == 2) {
                return;
            } else {
                this.clear();
            }
            workbook = args.data;
        } else {
            workbook = tempData;
        }

        this.draw.resize(data.viewWidth(), data.viewHeight());


        const tx = data.freezeTotalWidth();
        const ty = data.freezeTotalHeight();
        const {x, y} = data.scroll;

        // fixed width of header
        const fw = cols.indexWidth;
        // fixed height of header
        let fh = rows.height;

        renderContentGrid.call(this, viewRange, fw, fh, tx, ty);

        renderContent.call(this, viewRange, fw, fh, -x, -y, workbook);

        renderFixedHeaders.call(this, 'all', viewRange, fw, fh, tx, ty);

        renderFixedLeftTopCell.call(this, fw, fh);

        const [fri, fci] = data.freeze;
        if (fri > 0 || fci > 0) {
            // 2
            if (fri > 0) {
                const vr = viewRange.clone();
                vr.sri = 0;
                vr.eri = fri - 1;
                vr.h = ty;
                renderContentGrid.call(this, vr, fw, fh, tx, 0);
                renderContent.call(this, vr, fw, fh, -x, 0, workbook);
                renderFixedHeaders.call(this, 'top', vr, fw, fh, tx, 0);
            }
            // 3x
            if (fci > 0) {
                const vr = viewRange.clone();
                vr.sci = 0;
                vr.eci = fci - 1;
                vr.w = tx;
                renderContentGrid.call(this, vr, fw, fh, 0, ty);
                renderFixedHeaders.call(this, 'left', vr, fw, fh, 0, ty);
                renderContent.call(this, vr, fw, fh, 0, -y, workbook);
            }
            // 4
            const freezeViewRange = data.freezeViewRange();
            renderContentGrid.call(this, freezeViewRange, fw, fh, 0, 0);
            renderFixedHeaders.call(this, 'all', freezeViewRange, fw, fh, 0, 0);
            renderContent.call(this, freezeViewRange, fw, fh, 0, 0, workbook);
            // 5
            renderFreezeHighlightLine.call(this, fw, fh, tx, ty);
        }
    }

    clear() {
        this.draw.clear();
    }
}

export default Table;

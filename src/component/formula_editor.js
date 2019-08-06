import {cutStr, cutting, cutting2, isAbsoluteValue, operation} from "../core/operator";
import {expr2xy, xy2expr} from "../core/alphabet";
import {selectorColor} from "../component/color_palette";
import Selector from "../component/selector";
import {h} from "../component/element";

function lockCells(evt) {
    const {data, editor} = this;
    const {offsetX, offsetY} = evt;

    const cellRect = data.getCellRectByXY(offsetX, offsetY);
    let {ri, ci} = cellRect;

    /*
        实时更新this.selectors  => editor.change
        step 1. 如果该单元格已经被锁定，，
            判定1. 如果没有text最后一个不是 + - * / 则直接返回
            判定2. 选定
     */
    for (let i = 0; i < this.selectors.length; i++) {
        let selector = this.selectors[i];
        let {inputText} = editor;
        let last = inputText[inputText.length - 1];
        if (selector.ri == ri && selector.ci == ci && !operation(last))
            return;
    }

    /*
        step 2. 把单元格信息添加到txt中取
                2.1  如果用户没有输入 + - * / 则替换
                2.2  如果用户输入+ - * / 则 构造selector el， 选择颜色
     */
    let {inputText} = editor;
    let last = inputText[inputText.length - 1];
    let input = "";

    // 需要考虑移动光标的情况 ->> 对应 editor 里的 mousedownIndex 字段
    // 不为-1 就表示true，不用做额外判断
    let {mousedownIndex} = editor;
    if (mousedownIndex.length > 0) {
        let args = makeSelector.call(this, ri, ci);
        this.selectors.push(args);
        input = `${mousedownIndex[0]}${xy2expr(ci, ri)}${mousedownIndex[1]}`;
        let judgeText = input.substring(mousedownIndex[0].length + xy2expr(ci, ri).length, input.length);
        if (operation(judgeText[0])) {
            editor.setText(input);
            editor.setMouseDownIndex([]);
            return;
        }
        // 不是的话，需要删除这个
        let str = cutStr(judgeText[0] === "=" ? judgeText : "=" + judgeText)[0];
        let number = cutStr(mousedownIndex[1] === "=" ? mousedownIndex[1] : "=" + mousedownIndex[1])[0];

        console.log(cutStr(mousedownIndex[1]), "54");
        if (str) {
            let cut = cutStr(`${mousedownIndex[0]}${xy2expr(ci, ri)}+4${mousedownIndex[1]}`);
            let {selectors_delete, selectors_new} = filterSelectors.call(this, cut);
            Object.keys(selectors_delete).forEach(i => {
                let selector = selectors_delete[i];
                selector.removeEl();
            });

            this.selectors = selectors_new;
        }
        input = input.replace(number, "");
        editor.setText(input);
        editor.setCursorPos(mousedownIndex[0].length);
    } else if (this.selectors.length && !operation(last)) {
        // 此情况是例如: =A1  -> 这时再点A2  则变成: =A2
        let {selector, erpx} = this.selectors[this.selectors.length - 1];
        selector.set(ri, ci);
        this.selectors[this.selectors.length - 1].ri = ri;
        this.selectors[this.selectors.length - 1].ci = ci;
        this.selectors[this.selectors.length - 1].erpx = xy2expr(ci, ri);
        input = `${inputText.substring(0, inputText.lastIndexOf(erpx))}${xy2expr(ci, ri)}`;
        editor.setText(input);
    } else {
        let args = makeSelector.call(this, ri, ci);
        this.selectors.push(args);
        input = `${inputText}${xy2expr(ci, ri)}`;
        editor.setText(input);
    }

    if (this.selectors.length > 0) {
        let {inputText} = editor;
        div2span.call(this, cutting(inputText), cutting2(inputText));
    } else {
        const {editor} = this;
        editor.recover();
    }
    // step 3.  在enter或者点击的时候写入到cell中
    // dataSetCellText.call(this, input, 'input');
}

function filterSelectors(cut) {
    let selectors_new = [];
    let selectors_delete = [];
    Object.keys(this.selectors).forEach(i => {
        let selector = this.selectors[i];
        let {erpx} = selector;
        let enter = 0;
        Object.keys(cut).forEach(i => {
            if (cut[i] === erpx) {
                enter = 1;
                selectors_new.push(selector);
            }
        });

        if (enter == 0) {
            selectors_delete.push(selector.selector.el);
        }
    });
    return {
        "selectors_delete": selectors_delete,
        "selectors_new": selectors_new
    };
}

function makeSelector(ri, ci, selectors = this.selectors) {
    const {data} = this;
    let selector = new Selector(data);
    let color = selectorColor(selectors.length);
    selector.setCss(color);
    selector.set(ri, ci);

    this.overlayerCEl.child(selector.el);
    let args = {
        ri: ri,
        ci: ci,
        erpx: xy2expr(ci, ri),
        selector: selector,
    };
    return args;
}

function clearSelectors() {
    Object.keys(this.selectors).forEach(i => {
        let {selector} = this.selectors[i];
        selector.el.removeEl();
    });
    this.selectors = [];
    let {editor} = this;
    editor.setLock(false);
    editor.state = 1;
}

// 输入 input
function editingSelectors(text = "") {
    let selectors_new = [];
    let cut = cutStr(text);
    // case 1  过滤 selectors
    let {selectors_delete} = filterSelectors.call(this, cut);

    Object.keys(selectors_delete).forEach(i => {
        let selector = selectors_delete[i];
        selector.removeEl();
    });


    let selectors_valid = selectors_new;
    // case 2  验证 selectors
    Object.keys(cut).forEach(i => {
        let enter = 0;
        Object.keys(this.selectors).forEach(i2 => {
            let selector = this.selectors[i2];
            let {erpx} = selector;
            if (cut[i].replace(/\$/g, "") === erpx) {
                selectors_new.push(selector);
                enter = 1;
            }
        });

        // 绝对值
        let arr = "";
        if (isAbsoluteValue(cut[i])) {
            let notTrueValue = cut[i].replace(/\$/g, "");
            arr = expr2xy(notTrueValue);
        } else {
            arr = expr2xy(cut[i]);
        }

        if (enter == 0) {
            let ri = arr[1], ci = arr[0];
            let args = makeSelector.call(this, ri, ci, selectors_valid);
            selectors_valid.push(args);
        }
    });

    this.selectors = selectors_valid;
    if (this.selectors.length > 0 || text.lastIndexOf('=') == 0 || text === "") {
        div2span.call(this, cutting(text), cutting2(text));
    } else {
        const {editor} = this;
        editor.recover();
    }
}

function findBracket(cut, i) {
    let begin = -1;
    let has = 0;
    let stop = false;

    for (let j = i - 1; j > 0 && stop == false; j--) {
        if (cut[j] == "(") {
            stop = true;
        }
        if (cut[j] == ")") {
            has++;
        }
    }

    for (let j = i; j > 0 && begin == -1; j--) {
        if (cut[j] == "(") {
            if (has === 0) {
                begin = j;
            }
            has--;
        }
    }

    return begin;
}

function div2span(cut, cutcolor) {
    const {editor} = this;

    let spanArr = [];
    let left = 2;
    let begin = -1;
    let end = -1;
    Object.keys(cut).forEach(i => {
        let spanEl = h('span', `formula_span${i}`).on('mousedown', evt => {
            let offset = 0;
            for (let j = 0; j <= i; j++) {
                offset += cut[j].length;
            }
            if (cut[i] === ')') {
                let {spanArr} = editor;
                let begin = -1;
                let has = 0;
                let stop = false;

                for (let j = i - 1; j > 0 && stop == false; j--) {
                    if (cut[j] == "(") {
                        stop = true;
                    }
                    if (cut[j] == ")") {
                        has++;
                    }
                }

                for (let j = i; j > 0 && begin == -1; j--) {
                    if (cut[j] == "(") {
                        if (has === 0) {
                            begin = j;
                        }
                        has--;
                    }
                }
                editor.mount2span(spanArr, i, begin);
            } else {
                editor.mount2span(spanArr, -1, -1);
            }
            editor.setCursorPos2(offset, evt);
        });
        Object.keys(cutcolor).forEach(i2 => {
            if (cutcolor[i].code !== -1 && cutcolor[i].data == cut[i]) {
                let color = selectorColor(cutcolor[i].code);
                spanEl.css('color', color);
            }
        });
        // 括号高亮
        // const {editor} = this;
        // spanEl.css('top', '10px');
        // spanEl.css('position', 'absolute');
        spanEl.css('position', 'relative');
        spanEl.css('top', '-20px');
        spanEl.css('cursor', 'text');
        spanEl.html(cut[i]);
        spanArr.push(spanEl);
    });
    let {change_input, inputText} = editor;
    if (change_input == ')') {
        begin = spanArr.length - 1;
        end = findBracket.call(this, cut, begin);
    }


    // 挂载
    editor.mount2span(spanArr, begin, end);
}


export {
    lockCells,
    clearSelectors,
    editingSelectors
}
import {cutFirst, cutStr, cutting, cutting2, cuttingByPos, isAbsoluteValue, operation} from "../core/operator";
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
    let {inputText, pos} = editor;
    let last = inputText[inputText.length - 1];
    let input = "";

    // 需要考虑移动光标的情况 ->> 对应 editor 里的 mousedownIndex 字段
    // 不为-1 就表示true，不用做额外判断
    editor.handler(editor.move, editor.inputText);
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
        let number = cutFirst(mousedownIndex[1]);

        console.log(xy2expr(ci, ri))
        let cut = cutStr(`${mousedownIndex[0]}${xy2expr(ci, ri)}+4${mousedownIndex[1]}`);
        let {selectors_delete, selectors_new} = filterSelectors.call(this, cut);
        Object.keys(selectors_delete).forEach(i => {
            let selector = selectors_delete[i];
            selector.removeEl();
        });

        this.selectors = selectors_new;

        input = input.replace(number, "");
        editor.setText(input);
        let content = suggestContent.call(this, pos - 1, cutting(inputText), inputText);
        editor.setCursorPos(mousedownIndex[0].length );
    } else if (this.selectors.length && !operation(last)) {
        // 此情况是例如: =A1  -> 这时再点A2  则变成: =A2
        let {selector, erpx} = this.selectors[this.selectors.length - 1];
        selector.set(ri, ci);
        this.selectors[this.selectors.length - 1].ri = ri;
        this.selectors[this.selectors.length - 1].ci = ci;
        this.selectors[this.selectors.length - 1].erpx = xy2expr(ci, ri);
        input = `${inputText.substring(0, inputText.lastIndexOf(erpx))}${xy2expr(ci, ri)}`;
        editor.setText(input);
        editor.state2 = 2;
        // editor.move = input.length;
        // editor.move -= inputText.substring(0, inputText.lastIndexOf(erpx)).length;
    } else {
        let {pos} = editor;

        let args = makeSelector.call(this, ri, ci);
        this.selectors.push(args);
        if (pos != -1) {
            let str = "";
            let enter = false;
            let step = pos;
            let first = "";
            for(let i = pos; i < inputText.length; i++)
                first += inputText[i];
            let len = cutFirst(first).length;
            for (let i = 0; i < inputText.length; i++) {
                if (pos == i) {
                    enter = true;
                    str += xy2expr(ci, ri);
                }

                if(step == i && len > 0) {
                    step += 1;
                    len -= 1;
                } else {
                    str += inputText[i];
                }
            }
            str = !enter ? str += xy2expr(ci, ri) : str;
            editor.setText(str);
            editor.setCursorPos(pos);
            editor.pos = -1;
            editor.parse();
        } else {
            input = `${inputText}${xy2expr(ci, ri)}`;
            editor.setText(input);
        }
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
        let stop = false;
        for (let i2 = 0; i2 < cut.length && stop == false; i2++) {
            if (cut[i2].replace(/\$/g, "") === erpx) {
                console.log(i2, cut[i2], "104");
                enter = 1;
                selectors_new.push(selector);
                stop = true;
            }
        }

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
    selector.el.css("z-index", "100");

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
    if(typeof text === "number") {
        return;
    }
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

        for (let i2 = 0; i2 < this.selectors.length && enter == 0; i2++) {
            let selector = this.selectors[i2];
            let {erpx} = selector;
            if (cut[i].replace(/\$/g, "") === erpx) {
                selectors_new.push(selector);
                enter = 1;
            }
        }

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

    if (this.selectors.length > 0 || text.lastIndexOf('=') == 0) {
        div2span.call(this, cutting(text), cutting2(text));
    } else {
        const {editor} = this;
        editor.recover();
    }
}

// 找 ( 的index
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

// 找 ( 的 index
function findBracketRight(cut, i) {
    let begin = -1;
    let has = 0;
    let stop = false;

    for (let j = i + 1; j < cut.length && stop == false; j++) {
        if (cut[j] == ")") {
            stop = true;
        }
        if (cut[j] == "(") {
            has++;
        }
    }

    for (let j = i; j < cut.length && begin == -1; j++) {
        if (cut[j] == ")") {
            if (has === 0) {
                begin = j;
            }
            has--;
        }
    }

    return begin;
}

function suggestContent(pos, cut, inputText) {
    // 如果在括号内
    // step 1. 找到距离pos最近的左、右括号的index
    // step 2. 若1成立，找到该函数名
    // step 3. 找光标前有几个逗号
    let content = {suggestContent: false, cut: "", pos: 1};
    let begin = pos - 1;
    let left = findBracket.call(this, cut, begin);

    if (left <= begin && left != -1) {
        content.suggestContent = true;
        content.cut = cuttingByPos(inputText, left);
    }

    for (let i = left; i < begin + 1; i++) {
        if (inputText[i] == ",") {
            content.pos = content.pos + 2;
        }
    }

    return content;
}

function div2span(cut, cutcolor) {
    const {editor} = this;

    let spanArr = [];
    let left = 2;
    let begin = -1;
    let end = -1;
    Object.keys(cut).forEach(i => {
        let spanEl = h('span', `formula_span${i}`).on('mousedown.stop', evt => {
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
                let {inputText} = editor;
                let content = suggestContent.call(this, offset, cut, inputText);
                editor.mount2span(spanArr, -1, -1, content);
            }

            editor.setCursorPos2(offset, evt);
        });
        Object.keys(cutcolor).forEach(i2 => {
            if (cutcolor[i].code !== -1 && cutcolor[i].data == cut[i]) {
                let color = selectorColor(cutcolor[i].code);
                spanEl.css('color', color);
            }
        });
        spanEl.css('display', 'inline-block');
        spanEl.css('height', '22px');
        spanEl.css('cursor', 'text');

        if(cut[i] == " ") {
            spanEl.html("&emsp;");
        } else {
            spanEl.html(cut[i]);
        }

        spanArr.push(spanEl);
    });
    // 高亮
    let {pos, inputText} = editor;
    let content = {suggestContent: false, cut: ""};
    if (inputText[pos - 1] == ')') {
        begin = pos - 1;
        end = findBracket.call(this, cut, begin);
    } else {
        editor.getCursor();
        content = suggestContent.call(this, pos + 1, cut, inputText);
    }

    // 挂载
    editor.mount2span(spanArr, begin, end, content);
}


export {
    lockCells,
    clearSelectors,
    editingSelectors
}
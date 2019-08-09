//* global window */
import {h} from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import {cssPrefix} from '../config';
import {cuttingByPos, operation} from "../core/operator";
import SuggestContent from "../component/suggest_content";

// import { mouseMoveUp } from '../event';

function resetTextareaSize() {
    if (!/^\s*$/.test(this.inputText)) {
        const {
            textlineEl, textEl, areaOffset,
        } = this;
        const tlineWidth = textlineEl.offset().width + 9;
        const maxWidth = this.viewFn().width - areaOffset.left - 9;
        // console.log('tlineWidth:', tlineWidth, ':', maxWidth);
        if (tlineWidth > areaOffset.width) {
            let twidth = tlineWidth;
            if (tlineWidth > maxWidth) {
                twidth = maxWidth;
                let h1 = parseInt(tlineWidth / maxWidth, 10);
                h1 += (tlineWidth % maxWidth) > 0 ? 1 : 0;
                h1 *= this.rowHeight;
                if (h1 > areaOffset.height) {
                    textEl.css('height', `${h1}px`);
                }
            }
            textEl.css('width', `${twidth}px`);
        }
    }
}

const getCursortPosition = function (containerEl) {
    let range = window.getSelection().getRangeAt(0);
    let preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(this.textEl.el);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    let start = preSelectionRange.toString().length;

    return start;
};

function set_focus(el, poss) {
    console.log(this);
    let pos = -1;
    //
    // if (this && this.pos) {
    //     pos = this.pos;
    // }

    if (poss) {
        pos = poss;
    }
    if (this && this.move && this.move > -1) {
        if (this.state2 == 1) {
            this.move = this.move + 1;
        }
        pos = this.move;
    }

    try {
        let range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        if (pos != -1) {
            range.collapse(true);
            let content = el.firstChild;
            range.setStart(content, pos);
            range.setEnd(content, pos);
        }
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } catch {
        console.log("77")
    }
}

const setCursorPosition = (elem, index) => {
    var val = elem.value || elem.textContent;
    var len = val.length;

    // 超过文本长度直接返回
    if (len < index) return;
    set_focus.call(this, elem, index);
};

function mouseDownEventHandler(evt) {
    if (this.inputText[0] !== "=" || evt.target.nodeName !== "DIV") {
        return;
    }
    // this.pos = getCursortPosition.call(this, evt);
    this.move = -1;
    this.state2 = 2;

}

function mouseDownEventHandler2(evt, cursorPos, text) {
    setTimeout(() => {
        let textBegin = text.substring(0, cursorPos);
        let textEnd = text.substring(cursorPos, text.length);
        parse.call(this, textBegin);
        let {lock} = this;
        if (lock && textEnd !== "") {
            this.setMouseDownIndex([textBegin, textEnd]);
        } else {
            this.setMouseDownIndex([]);
        }
    }, 0);
}

function getDiff(sr1 = "", sr2 = "") {
    if (!sr1 || !sr2)
        return;
    let result = "";
    for (let i = 0; i < sr1.length; i++) {
        let flag = true;
        if (sr1[i] == sr2[i]) {
            flag = false;
        }
        if (flag) result += sr1[i];
    }


    return result;
}

function inputEventHandler(evt) {
    let v = "";
    let t1 = "";
    for (let i = 0, len = evt.target.childNodes.length; i < len; i++) {
        if (evt.target.childNodes[i].nodeType === 1) {  // 通过nodeType是不是文本节点来判断
            v += evt.target.childNodes[i].innerText
        } else if (evt.target.childNodes[i].nodeType === 3) {
            t1 += evt.target.childNodes[i].nodeValue;
        }
    }
    if (t1 != "") {
        v = t1;
        this.textEl.html('');
    }

    const {suggest, textlineEl, validator, textEl} = this;
    this.change_input = getDiff(v, this.inputText);
    this.inputText = v + "";
    this.state2 =  this.state2 != 3 ? 1 : 3;
    /*
        point 1. 得到光标之前的那个元素, eg:  A2+A1 , 光标在1, 解析出 => A1
     */
    this.pos = getCursortPosition.call(this, evt);
    let cutValue = cuttingByPos(v, this.pos);

    if (validator) {
        if (validator.type === 'list') {
            suggest.search(v);
        } else {
            suggest.hide();
        }
    } else {
        const start = v.lastIndexOf('=');
        if (this.pos != -1) {
            parse2.call(this, v, this.pos);
        } else
            parse.call(this, v);

        if (start === 0 && v.length > 1 && cutValue != "") {
            suggest.search(cutValue);
        } else {
            suggest.hide();
        }
    }

    textlineEl.html(v);
    resetTextareaSize.call(this);
    if (v && v[0] !== "=") {
        textEl.html(v);
        set_focus.call(this, textEl.el, -1);
    }
    if (v === "") {
        // this.tmp.removeEl();
        this.lock = false;
        this.pos = -1;
        this.inputText = "";
        this.ri = -1, this.ci = -1;
        this.setText("");
    }
    this.change('input', v + "");
    this.pos = -1;
}

function keyDownEventHandler(evt) {
    this.pos = getCursortPosition.call(this, evt);

    if (evt.code === "ArrowRight") {
        this.pos = this.pos + 1;
    } else {
        this.pos = this.pos - 1;
    }

    parse2.call(this, this.inputText, this.pos);

    const keyCode = evt.keyCode || evt.which;
    if (keyCode == 27) {
        this.change('input', "@~esc");
    } else if (keyCode == 37 || keyCode == 38 || keyCode == 39 || keyCode == 40) {
        if (keyCode == 38 || keyCode == 40) {
            setTimeout(() => {
                set_focus.call(this, this.textEl.el, -1);
            }, 100);
        } else {
            this.move = this.pos;
        }
    } else if (keyCode == 8) {
        this.move = this.move - 1;
        this.state2 = 3;
    } else {
        this.state2 = 1;
    }
}

function parse(v) {
    if (!isNaN(v)) {
        return;
    }
    const start = v.lastIndexOf('=');


    if (start === 0 && v.length >= 1 && operation(v[v.length - 1])) {
        this.setLock(true);
    } else {
        this.setLock(false);
        this.state = 2;
    }

    if (start !== 0) {
        this.setLock(false);
    } else if (start === 0 && v.length == 1) {
        this.setLock(true);
    }
}

function parse2(v, pos) {
    if (!isNaN(v)) {
        return;
    }
    const start = v.lastIndexOf('=');
    if (start === 0 && v.length >= 1 && operation(v[pos - 1])) {
        this.setLock(true);
    } else {
        this.setLock(false);
        this.state = 2;
    }

    if (start !== 0) {
        this.setLock(false);
    } else if (start === 0 && v.length == 1) {
        this.setLock(true);
    }
}

function setTextareaRange(position) {
    const {el} = this.textEl;
    setTimeout(() => {
        // el.focus();
        set_focus.call(this, el);
        // el.setSelectionRange(position, position);
    }, 0);
}

function setText(text, position) {
    const {textEl, textlineEl, tmp} = this;
    // firefox bug
    textEl.el.blur();
    tmp.html(text);
    // textEl.html(text);
    textlineEl.html(text);
    setTextareaRange.call(this, position);
}


function suggestItemClick(it) {
    const {inputText, validator} = this;
    let position = 0;
    if (validator && validator.type === 'list') {
        this.inputText = it;
        position = this.inputText.length;
    } else {
        const start = inputText.lastIndexOf('=');
        this.pos = getCursortPosition.call(this);
        let begin = this.pos - cuttingByPos(inputText, this.pos).length;

        let arr = ["", ""];
        for (let i = 0; i < inputText.length; i++) {
            if (i < begin) {
                arr[0] += inputText[i];
            }

            if (i > this.pos - 1 && inputText[i] === ")") {
                arr[1] += inputText[i];
            }
        }
        this.inputText = `${arr[0] + it.key}(`;
        position = this.inputText.length;
        this.inputText += `)${arr[1]}`;
        // }
    }
    this.textEl.html(this.inputText);
    this.textlineEl.html(this.inputText);
    this.change('input', this.inputText);
    // setTimeout(() => {
    //     set_focus.call(this, this.textEl.el, -1);
    // }, 0);
    // setText.call(this, this.inputText, position);
    resetTextareaSize.call(this);
}

function resetSuggestContentItems() {
    this.suggestContent.hide();
}

function resetSuggestItems() {
    this.suggest.setItems(this.formulas);
}

function dateFormat(d) {
    let month = d.getMonth() + 1;
    let date = d.getDate();
    if (month < 10) month = `0${month}`;
    if (date < 10) date = `0${date}`;
    return `${d.getFullYear()}-${month}-${date}`;
}

export default class Editor {
    constructor(formulas, viewFn, rowHeight) {
        this.viewFn = viewFn;
        this.rowHeight = rowHeight;
        this.formulas = formulas;
        this.suggest = new Suggest(formulas, (it) => {
            suggestItemClick.call(this, it);
        });
        this.suggestContent = new SuggestContent();
        this.lock = false;
        this.state = 1;
        this.change_input = "";
        this.datepicker = new Datepicker();
        this.datepicker.change((d) => {
            // console.log('d:', d);
            this.setText(dateFormat(d));
            this.clear();
        });
        this.ri = -1;
        this.ci = -1;
        this.spanArr = [];
        this.mousedownIndex = [];
        this.areaEl = h('div', `${cssPrefix}-editor-area`)
            .children(
                this.textEl = h('div', '')
                    .on('input', evt => inputEventHandler.call(this, evt))
                    .on('mousedown', evt => mouseDownEventHandler.call(this, evt))
                    .on('keydown', evt => keyDownEventHandler.call(this, evt))
                ,
                this.textlineEl = h('div', 'textline'),
                this.suggest.el,
                this.suggestContent.el,
                this.datepicker.el,
            )
            .on('mousemove.stop', () => {
            })
            .on('mousedown.stop', () => {
            });
        this.el = h('div', `${cssPrefix}-editor`)
            .child(this.areaEl).hide();
        this.suggest.bindInputEvents(this.textEl);

        this.tmp = h('span', 'span_tmp');
        this.textEl.attr('contenteditable', 'true');
        this.textEl.css('line-height', '22px');
        this.textEl.css('background', 'white');
        this.textEl.css('font-size', '12px');
        this.textEl.css('caret-color', 'black');
        this.textEl.css('font-family', 'Inconsolata,monospace,arial,sans,sans-serif');
        this.textEl.css('top', '5px');
        this.textEl.css('caret-color', 'black');
        this.textEl.css('color', 'white');
        this.textEl.css('left', '2px');
        this.textEl.css('outline', 'none');
        this.textEl.child(this.tmp);
        // this.areaEl.child(this.ace);
        this.pos = 0;
        this.areaOffset = null;
        this.freeze = {w: 0, h: 0};
        this.cell = null;
        this.inputText = '';
        this.change = () => {
        };
    }

    setFreezeLengths(width, height) {
        this.freeze.w = width;
        this.freeze.h = height;
    }

    setMouseDownIndex(index) {
        this.mousedownIndex = index;
    }

    setRiCi(ri, ci) {
        this.ri = ri;
        this.ci = ci;
    }

    setLock(lock) {
        this.lock = lock;
    }

    getLock() {
        return this.lock;
    }

    recover() {
        this.textEl.css('color', 'black');
        this.textEl.css('caret-color', 'black');
        this.textEl.css('font-family', 'none');
        this.textlineEl.css('font-family', 'none');
        this.textEl.css('word-wrap', 'break-word');
        // this.textEl.css('position', 'static');

    }

    parse() {
        parse.call(this, this.inputText);
    }

    clear() {
        if (this.inputText !== '') {
            this.change('finished', this.inputText);
        }
        this.cell = null;
        this.areaOffset = null;
        this.inputText = '';
        this.el.hide();
        this.pos = -1;
        this.move = -1;
        // this.textEl.val('');
        this.textEl.html('');
        this.textlineEl.html('');
        resetSuggestContentItems.call(this);
        resetSuggestItems.call(this);
        this.datepicker.hide();
    }

    mount2span(spanArr, pos = -1, begin = -1, content = {suggestContent: false, cut: "", pos: -1}) {
        if (this.spanArr === spanArr) {
            return;
        }

        // this.textEl.html(this.inputText);
        this.tmp.removeEl();

        // this.pos = -1;
        // set_focus.call(this, this.textEl.el);

        let {show} = this.suggest;
        if (content.suggestContent && !show) {
            this.suggestContent.content(content.cut, content.pos);
        } else {
            this.suggestContent.hide();
        }
        Object.keys(spanArr).forEach(i => {
            spanArr[i].css('background-color', 'rgba(255,255,255,0.1)');
        });
        if (pos !== '-1' && begin != -1 && spanArr[pos]) {
            spanArr[pos].css('background-color', '#e5e5e5');
            spanArr[begin].css('background-color', '#e5e5e5');
        }
        this.textEl.css('caret-color', 'black');

        resetTextareaSize.call(this);
        if (spanArr.length > 0) {
            this.tmp.el.innerHTML = "";
            this.textEl.el.innerHTML = "";
            this.tmp = this.tmp.children(...spanArr)
                .css("top", "0px").css("color", "black");
            this.textEl.child(this.tmp);
            // this.move = -1;
            set_focus.call(this, this.textEl.el, -1);
        }

        this.spanArr = spanArr;
    }

    handler(cursorPos, text) {
        let textBegin = text.substring(0, cursorPos);
        let textEnd = text.substring(cursorPos, text.length);
        parse.call(this, textBegin);
        if (textEnd !== "") {
            this.setMouseDownIndex([textBegin, textEnd]);
        } else {
            this.setMouseDownIndex([]);
        }
    }

    setOffset(offset, suggestPosition = 'top') {
        const {
            textEl, areaEl, suggest, freeze, el,
        } = this;
        if (offset) {
            this.areaOffset = offset;
            const {
                left, top, width, height, l, t,
            } = offset;
            // console.log('left:', left, ',top:', top, ', freeze:', freeze);
            const elOffset = {left: 0, top: 0};
            // top left
            if (freeze.w > l && freeze.h > t) {
                //
            } else if (freeze.w < l && freeze.h < t) {
                elOffset.left = freeze.w;
                elOffset.top = freeze.h;
            } else if (freeze.w > l) {
                elOffset.top = freeze.h;
            } else if (freeze.h > t) {
                elOffset.left = freeze.w;
            }
            el.offset(elOffset);
            areaEl.offset({left: left - elOffset.left - 0.8, top: top - elOffset.top - 0.8});
            textEl.offset({width: width - 2 + 0.8, height: height - 3 + 0.8});
            const sOffset = {left: 0};
            sOffset[suggestPosition] = height;
            suggest.setOffset(sOffset);
            suggest.hide();
        }
    }

    setCell(cell, validator) {
        // console.log('::', validator);
        const {el, datepicker, suggest} = this;
        el.show();
        this.cell = cell;
        let text = (cell && cell.formulas) || '';
        text = text == "" ? (cell && cell.text) || '' : text;
        this.setText(text);
        parse.call(this, text);

        this.validator = validator;
        if (validator) {
            const {type} = validator;
            if (type === 'date') {
                datepicker.show();
                if (!/^\s*$/.test(text)) {
                    datepicker.setValue(text);
                }
            }
            if (type === 'list') {
                suggest.setItems(validator.values());
                suggest.search('');
            }
        }
        this.change('input', text);
    }

    setCursorPos(pos) {
        setCursorPosition.call(this, this.textEl.el, pos);
    }

    getCursor() {
        this.pos = this.move;
        if (this.pos == -1)
            this.pos = this.inputText.length;
    }

    setCursorPos2(pos, evt) {
        this.move = pos;
        this.state2 = 2;
        // setCursorPosition.call(this, this.textEl.el, pos);
        mouseDownEventHandler2.call(this, evt, pos, this.inputText)
    }

    setText(text) {
        this.inputText = text;
        // console.log('text>>:', text);
        setText.call(this, text, text.length);
        resetTextareaSize.call(this);
        this.textEl.child(this.tmp);
    }
}

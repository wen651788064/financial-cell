//* global window */
import {h} from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import {cssPrefix} from '../config';
import {cutting, cuttingByPos, operation} from "../core/operator";
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

const getCursortPosition = function (element) {
    let cursorPos = 0;
    if (element.selectionStart || element.selectionStart == '0') {
        cursorPos = element.selectionStart;
    } else if (element.target.selectionStart || element.target.selectionStart == '0') {
        cursorPos = element.target.selectionStart;
    }

    return cursorPos;
};

const setCursorPosition = (elem, index) => {
    var val = elem.value;
    var len = val.length;

    // 超过文本长度直接返回
    if (len < index) return;
    setTimeout(function () {
        elem.focus();
        if (elem.setSelectionRange) { // 标准浏览器
            elem.setSelectionRange(index, index)
        } else { // IE9-
            var range = elem.createTextRange();
            range.moveStart("character", -len);
            range.moveEnd("character", -len);
            range.moveStart("character", index);
            range.moveEnd("character", 0);
            range.select();
        }
    }, 10)
};

function mouseDownEventHandler(evt) {
    if (evt.target.value[0] !== "=") {
        return;
    }
    setTimeout(() => {
        let cursorPos = getCursortPosition.call(this, evt.target);
        let text = evt.target.value;
        let textBegin = text.substring(0, cursorPos);
        let textEnd = text.substring(cursorPos, text.length);

        if (textBegin[textBegin.length - 1] === ")") {
            let cut = cutting(textBegin);
            let begin = -1;
            let i = cut.length - 1;
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
            this.mount2span(this.spanArr, cut.length - 1, begin);
        } else {
            this.mount2span(this.spanArr, -1);
        }

        parse.call(this, textBegin);
        let {lock} = this;
        if (lock && textEnd !== "") {
            this.setMouseDownIndex([textBegin, textEnd]);
        } else {
            this.setMouseDownIndex([]);
        }
    }, 0);
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

function getDiff(sr1, sr2) {
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
    const v = evt.target.value;
    // console.log(evt, 'v:', v);
    const {suggest, textlineEl, validator} = this;
    // 得到2个字符串不同的地方
    this.change_input = getDiff(v, this.inputText);

    this.inputText = v;

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
        parse.call(this, v);

        if (start === 0 && v.length > 1 && cutValue != "") {
            suggest.search(cutValue);
        } else {
            suggest.hide();
        }
    }
    textlineEl.html(v);
    resetTextareaSize.call(this);
    this.change('input', v);
}

function keyDownEventHandler(evt) {
    console.log("80", evt);
    this.pos = getCursortPosition.call(this, evt);
    if (evt.code === "ArrowRight") {
        this.pos = this.pos + 1;
    } else {
        this.pos = this.pos - 1;
    }
    const keyCode = evt.keyCode || evt.which;
    if (keyCode == 27) {
        this.change('input', "@~esc");
    } else {
        this.change('input', this.inputText);
    }
}

function parse(v) {
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

function setTextareaRange(position) {
    const {el} = this.textEl;
    setTimeout(() => {
        el.focus();
        el.setSelectionRange(position, position);
    }, 0);
}

function setText(text, position) {
    const {textEl, textlineEl} = this;
    // firefox bug
    textEl.el.blur();
    textEl.val(text);
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
        // const sit = inputText.substring(0, start + 1);
        // let eit = inputText.substring(start + 1);
        // if (eitt.indexOf(')') !== -1) {
        //     eit = eit.substring(eit.indexOf(')'));
        //     this.inputText = `${sit + it.key}(`;
        //     // console.log('inputText:', this.inputText);
        //     position = this.inputText.length;
        //     this.inputText += `)${eit}`;
        // } else {
        let begin = this.pos - cuttingByPos(inputText, this.pos).length;

        let arr = ["", ""];
        for (let i = 0; i < inputText.length; i++) {
            if (i < begin) {
                arr[0] += inputText[i];
            }

            if (i > this.pos) {
                arr[1] += inputText[i];
            }
        }
        this.inputText = `${arr[0] + it.key}(`;
        position = this.inputText.length;
        this.inputText += `)${arr[1]}`;
        // }
    }
    this.change('input', this.inputText);
    setText.call(this, this.inputText, position);
    resetTextareaSize.call(this);
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
                this.textEl = h('textarea', '')
                    .on('input', evt => inputEventHandler.call(this, evt))
                    .on('mousedown', evt => mouseDownEventHandler.call(this, evt))
                    .on('keydown', evt => keyDownEventHandler.call(this, evt)),
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

        this.ace = "";
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
    }

    clear() {
        if (this.inputText !== '') {
            this.change('finished', this.inputText);
        }
        this.cell = null;
        this.areaOffset = null;
        this.inputText = '';
        this.el.hide();
        this.textEl.val('');
        this.textlineEl.html('');
        resetSuggestItems.call(this);
        this.datepicker.hide();
    }

    // mount2span2(text) {
    //     if (this.aces)
    //         this.aces.removeEl();
    //     setTimeout(() => {
    //         this.aces = h('div', `editor`).attr("id", "editor");
    //         this.aces.html(this.inputText);
    //         this.areaEl.child(this.aces);
    //
    //         let ace = window.ace;
    //         var editor = ace.edit("editor");
    //         //设置风格和语言（更多风格和语言，请到github上相应目录查看）
    //         var language = "javascript";
    //         editor.session.setMode("ace/mode/" + language);
    //         editor.setOptions({});
    //     }, 100);
    //
    //     return;
    // }

    mount2span(spanArr, pos = -1, begin = -1, content = {suggestContent: false, cut: "", pos: -1}) {
        if (this.ace)
            this.ace.removeEl();

        let {show} = this.suggest;
        if (content.suggestContent && !show) {
            this.pos = -1;
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

        this.textEl.css('color', 'white');
        this.textEl.css('caret-color', 'black');
        this.textEl.css('font-family', 'Inconsolata,monospace,arial,sans,sans-serif');
        this.textlineEl.css('font-family', 'Inconsolata,monospace,arial,sans,sans-serif');
        let random = Math.floor(Math.random() * 1000);
        let ace = h('div', `ace-${random}`);
        ace.attr('contenteditable', 'true');

        ace.css('height', this.textEl.el['style'].height);
        ace.css('font-family', 'Inconsolata,monospace,arial,sans,sans-serif');
        ace.css('top', '10px');
        ace.css('left', '2px');
        ace.css('outline', 'none');
        ace.css('position', 'absolute');
        if (spanArr.length > 0) {
            ace.children(...spanArr);
        }
        this.areaEl.child(ace);

        this.spanArr = spanArr;
        this.ace = ace;
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
            textEl.offset({width: width - 9 + 0.8, height: height - 3 + 0.8});
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
        const text = (cell && cell.text) || '';
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

    setCursorPos2(pos, evt) {
        setCursorPosition.call(this, this.textEl.el, pos);
        mouseDownEventHandler2.call(this, evt, pos, this.inputText)
    }

    setText(text) {
        this.inputText = text;
        // console.log('text>>:', text);
        setText.call(this, text, text.length);
        resetTextareaSize.call(this);
    }
}

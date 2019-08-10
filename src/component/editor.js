//* global window */
import {h} from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import {cssPrefix} from '../config';
import {cuttingByPos, operation} from "../core/operator";
import SuggestContent from "../component/suggest_content";
import {isAbsoluteValue} from "../core/operator";

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

function set_focus(el, poss = -1) {
    if (!this) {
        return;
    }
    let savedSel = {
        start: this.pos,
        end: this.pos
    };
    var charIndex = 0, range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    var nodeStack = [el], node, foundStart = false, stop = false;

    while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                stop = true;
            }
            charIndex = nextCharIndex;
        } else {
            var i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

}

const setCursorPosition = (elem, index) => {
    var val = elem.value || elem.textContent;
    var len = val.length;

    // 超过文本长度直接返回
    if (len < index) return;
    set_focus.call(this, elem, index);
};

function mouseDownEventHandler(evt) {
    this.pos = getCursortPosition.call(this, evt);
    console.log("pos", this.pos)
    parse2.call(this, this.inputText, this.pos);
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
    v = t1 != "" ? t1 : v;
    this.pos = getCursortPosition.call(this, evt);
    this.textEl.html('');

    const {suggest, textlineEl, validator, textEl} = this;
    this.change_input = getDiff(v, this.inputText);
    this.inputText = v + "";

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
        let cutValue = cuttingByPos(v, this.pos);
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
        this.pos = 0;
        this.inputText = "";
        this.ri = -1, this.ci = -1;
        this.setText("");
    }

    this.change('input', v + "");
}

function keyDownEventHandler(evt) {
    this.pos = getCursortPosition.call(this, evt);
    console.log(this.pos, "pos")
    if (evt.code === "ArrowRight") {
        this.pos = this.pos + 1;
    } else if(evt.code === "ArrowLeft"){
        this.pos = this.pos - 1;
    }

    parse2.call(this, this.inputText, this.pos);

    const keyCode = evt.keyCode || evt.which;
    if (keyCode == 27) {
        this.change('input', "@~esc");
    } else if (keyCode == 37 || keyCode == 38 || keyCode == 39 || keyCode == 40) {
        // if (keyCode == 38 || keyCode == 40) {
        //     set_focus.call(this, this.textEl.el, -1);
        // } else {
        //     this.move = this.pos;
        // }
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

    if(isAbsoluteValue(cuttingByPos(v, this.pos), 2)) {
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

    console.log("248", isAbsoluteValue(cuttingByPos(v, pos), 2))
    if(isAbsoluteValue(cuttingByPos(v, pos), 2)) {
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
        this.pos = getCursortPosition.call(this);
        let begin = this.pos - cuttingByPos(inputText, this.pos).length;

        let arr = ["", ""];
        for (let i = 0; i < inputText.length; i++) {
            if (i < begin) {
                arr[0] += inputText[i];
            }

            if (i > this.pos - 1) {
                arr[1] += inputText[i];
            }
        }
        this.inputText = `${arr[0] + it.key}(`;
        this.pos = this.inputText.length;
        this.inputText += `)${arr[1]}`;
    }
    this.textEl.html(this.inputText);
    this.textlineEl.html(this.inputText);
    this.suggest.hide();
    this.change('input', this.inputText);
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
                    .on('click', evt => mouseDownEventHandler.call(this, evt))
                    .on('keyup', evt => keyDownEventHandler.call(this, evt))
                    .on('keydown', evt => {
                        let key_num = evt.keyCode;
                        if (38 === key_num || 40 === key_num) {
                            evt.preventDefault();
                        }
                    })
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
    }

    parse(pos = -1) {
        if (pos != -1) {
            this.pos = getCursortPosition.call(this);
            parse2.call(this, this.inputText, this.pos);
        } else {
            parse.call(this, this.inputText);
        }
    }

    clear() {
        if (this.inputText !== '') {
            this.change('finished', this.inputText);
        }
        this.cell = null;
        this.areaOffset = null;
        this.inputText = '';
        this.el.hide();
        this.pos = 0;
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

        this.tmp.removeEl();

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
            this.tmp = h('span', 'span_tmp').children(...spanArr)
                .css("top", "0px").css("color", "black");
            this.textEl.child(this.tmp);
            set_focus.call(this, this.textEl.el, -1);
        }

        this.spanArr = spanArr;
    }

    handler(text) {
        let cursorPos = this.pos;
        if(cursorPos >= this.inputText) {
            this.setMouseDownIndex([]);
            return;
        }
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
        this.pos = text.length;
        parse.call(this, text);
        this.change('input', text);
    }

    setCursorPos(pos) {
        this.pos = pos;
        set_focus.call(this, this.textEl.el, pos);
    }

    setCursorPos2(pos, evt) {
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

//* global window */
import {h} from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import {cssPrefix} from '../config';
import {cutting, cuttingByPos, cuttingByPosEnd, isAbsoluteValue, operation,} from '../core/operator';
import SuggestContent from './suggest_content';
import {findBracket, suggestContent} from './formula_editor';
import {createEvent} from './event';

function resetTextareaSize() {
    const {
        textlineEl, textEl, areaOffset,
    } = this;
    if (!areaOffset) {
        return;
    }
    const tlineWidth = textlineEl.offset().width + 9 + 15;
    const maxWidth = this.viewFn().width - areaOffset.left - 9;
    // console.log('tlineWidth:', tlineWidth, ':', maxWidth);
    if (tlineWidth > areaOffset.width && areaOffset.width != 0) {
        let twidth = tlineWidth;
        if (tlineWidth > maxWidth) {
            twidth = maxWidth - 15;
            let h1 = parseInt(tlineWidth / (maxWidth - 15), 10);
            h1 += (tlineWidth % maxWidth) > 0 ? 1 : 0;
            h1 *= this.rowHeight;
            if (h1 > areaOffset.height) {
                textEl.css('height', `${h1}px`);
            }
        }
        textEl.css('width', `${twidth}px`);
    }
}

const getCursortPosition = function (containerEl) {
    const range = window.getSelection().getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(this.textEl.el);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    // text == ")"
    const {exist, left, right} = findBracket(start - 1, cutting(this.inputText), this.inputText);
    Object.keys(this.spanArr).forEach((i) => {
        this.spanArr[i].css('background-color', 'rgba(255,255,255,0.1)');
    });
    const spanLeft = this.spanArr[left];
    const spanRight = this.spanArr[right];
    this.suggestContent.hide();
    if (exist && spanLeft && spanRight) {
        spanLeft.css('background-color', 'rgb(229, 229, 229)');
        spanRight.css('background-color', 'rgb(229, 229, 229)');
    } else {
        const {show} = this.suggest;
        const content = suggestContent.call(this, start, cutting(this.inputText), this.inputText);
        if (content.suggestContent && !show) {
            this.suggestContent.content(content.cut, content.pos);
        }
    }

    return start;
};

function set_focus(el) {
    if (!this) {
        return;
    }
    const savedSel = {
        start: this.pos,
        end: this.pos,
    };
    let charIndex = 0;
    const
        range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const nodeStack = [el];
    let node;
    let foundStart = false;
    let
        stop = false;

    while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType == 3) {
            const nextCharIndex = charIndex + node.length;
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
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

const setCursorPosition = (elem, index) => {
    const val = elem.value || elem.textContent;
    const len = val.length;

    // 超过文本长度直接返回
    if (len < index) return;
    set_focus.call(this, elem);
};

function mouseDownEventHandler(evt) {
    this.pos = getCursortPosition.call(this, evt);
    parse2.call(this, this.inputText, this.pos);
}

function inputEventHandler(evt, txt = '', formulas = '', state = "input") {
    if (evt) {
        const {
            inputType,
        } = evt;

        if (inputType === 'insertFromPaste' && this.textEl.el.style['caret-color'] != 'black') {
            this.copy = true;
            return;
        }

        if (inputType === 'historyUndo') {
            return;
        }
    }

    if (this.inputText === '') {
        const {data} = this;
        const {history} = data;
        history.add(data.getData());
    }

    setTimeout(() => {
        this.show();
        if (this.chinese == false) return;
        let v = '';
        this.sheet.selector.hide();
        if (txt == '' && evt) {
            let t1 = '';
            for (let i = 0, len = evt.target.childNodes.length; i < len; i++) {
                if (evt.target.childNodes[i].nodeType === 1) {
                    v += evt.target.childNodes[i].innerText;
                } else if (evt.target.childNodes[i].nodeType === 3) {
                    t1 += evt.target.childNodes[i].nodeValue;
                }
            }
            v = t1 !== '' ? t1 : v;
        } else {
            v = txt;
        }
        if (this.copy) {
            this.copy = false;
            v = (evt && evt.data) ? evt.data : '';
            this.textEl.html(v);
            this.pos = v.length;
            set_focus.call(this, this.textEl.el, -1);
        }

        const {
            suggest, textlineEl, validator, textEl, save,
        } = this;
        this.inputText = `${v}`;
        this.inputText = this.inputText.replace(/，/g, ',');
        this.pos = getCursortPosition.call(this, evt);
        console.log(this.chinese, v);
        if (validator) {
            if (validator.type === 'list') {
                suggest.search(v);
            } else {
                suggest.hide();
            }
        }else {
            v = v + "";
            const start = v.lastIndexOf('=');
            if (this.pos != -1) {
                parse2.call(this, v, this.pos);
            } else parse.call(this, v);
            let show = false;
            let cutValue = cuttingByPos(v, this.pos, true);
            if (v.length >= this.pos) {
                const isNumber = `${v[this.pos]}`;
                if (isNumber.search(/^[0-9]+.?[0-9]*$/) != -1) {
                    show = true;
                } else if (isNumber) {
                    const c = cuttingByPosEnd(v, this.pos + 1);
                    cutValue += c;
                }
            }

            if (start === 0 && v.length > 1 && cutValue != '' && !show && cutValue.trim().length > 0) {
                suggest.search(cutValue);
            } else {
                suggest.hide();
            }
        }
        textlineEl.html(formulas || v);
        this.inputText = formulas || v;
        resetTextareaSize.call(this);

        if (v && v[0] !== '=') {
            // textEl.html(v);
            set_focus.call(this, textEl.el, -1);
        }

        // 注释的原因是  copy之后把v 设置为""， 然后会把ri, ci重置
        // if (v === "") {
        //     this.tmp.hide();
        //     this.lock = false;
        //     this.pos = 0;
        //     this.inputText = "";
        //     this.ri = -1;
        //     this.ci = -1;
        //     this.setText("");
        // }

        if(formulas && formulas[0] === '=') {
            v = formulas;
        }
        this.change(state, v);
    });
}

function keyDownEventHandler(evt) {
    this.pos = getCursortPosition.call(this, evt);
    if (evt.code === 'ArrowRight') {
        this.pos = this.pos + 1;
    } else if (evt.code === 'ArrowLeft') {
        this.pos = this.pos - 1;
    }

    const keyCode = evt.keyCode || evt.which;
    // this.textEl.el.style['caret-color'] != 'black' 加这个主要防止用户在没有输入的情况下按下esc
    if (keyCode == 27 && this.textEl.el.style['caret-color'] == 'black' && this.textEl.el.style.opacity == '1') {
        this.change('input', '@~esc');
    } else if (keyCode == 37 || keyCode == 38 || keyCode == 39 || keyCode == 40) {
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

    if (isAbsoluteValue(cuttingByPos(v, this.pos), 2)) {
        this.setLock(true);
    }

    if (start !== 0) {
        this.setLock(false);
    }
}

function parse2(v, pos) {
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

    if (isAbsoluteValue(cuttingByPos(v, pos), 2)) {
        this.setLock(true);
    }

    if (start !== 0) {
        this.setLock(false);
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
        const begin = this.pos - cuttingByPos(inputText, this.pos).length;
        const c = cuttingByPosEnd(inputText, this.pos + 1);
        const arr = ['', ''];
        const end = this.pos + c.length;
        for (let i = 0; i < inputText.length; i++) {
            if (i < begin) {
                arr[0] += inputText[i];
            }

            if (i > end - 1) {
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
    parse2.call(this, this.inputText, this.pos);
    this.change('input', this.inputText);
    set_focus.call(this, this.textEl.el, -1);
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

function isDisplay() {
    if (this.textEl.el.style['caret-color'] == 'black'
        && this.textEl.el.style.opacity == '1') return true;
    return false;
}

export default class Editor {
    constructor(formulas, viewFn, rowHeight, rowWidth, data, sheet) {
        this.viewFn = viewFn;
        this.rowHeight = rowHeight;
        this.formulas = formulas;
        this.sheet = sheet;
        this.suggest = new Suggest(formulas, (it) => {
            suggestItemClick.call(this, it);
        });
        this.suggestContent = new SuggestContent();
        this.lock = false;
        this.state = 1;
        this.data = data;
        this.datepicker = new Datepicker();
        this.isCors = false;
        this.datepicker.change((d) => {
            this.setText(dateFormat(d));
            this.clear();
        });
        this.ri = -1;
        this.ci = -1;
        this.spanArr = [];
        this.mousedownIndex = [];
        this.chinese = true;
        this.areaEl = h('div', `${cssPrefix}-editor-area`)
            .children(
                this.textEl = h('div', `${cssPrefix}-editor-textEl`)
                    .on('input', evt => inputEventHandler.call(this, evt))
                    .on('click', evt => mouseDownEventHandler.call(this, evt))
                    .on('keyup', evt => keyDownEventHandler.call(this, evt))
                    .on('mousedown', (evt) => {
                        if (evt.detail == 2) {
                            if (isDisplay.call(this)) {
                                return;
                            }
                            this.show();
                            setTimeout(() => {
                                const {ri, ci} = this;
                                console.log(ri, ci);
                                this.setCellEnd(data.getSelectedCellRiCi(ri, ci));
                            });
                        }
                    })
                    .on('compositionstart', (evt) => {
                        this.chinese = false;
                    })
                    .on('compositionend', (evt) => {
                        this.chinese = true;
                    })
                    .on('paste', (evt) => {
                        if (this.textEl.el.style['caret-color'] == 'black') {
                            // createEvent.call(this, 67, true, "paste");
                            evt.stopPropagation();
                        }
                    })
                    .on('copy', (evt) => {
                        if (this.textEl.el.style['caret-color'] == 'black') {
                            // createEvent.call(this, 86, true, "copy");
                            evt.stopPropagation();
                        }
                    })
                    .on('keydown', (evt) => {
                        resetTextareaSize.call(this);
                        this.textlineEl.html(evt.currentTarget.innerText);
                        const key_num = evt.keyCode;
                        // ctrl + v 67     ctrl + v  86
                        if (key_num === 38 || key_num === 40) {
                            evt.preventDefault();
                        }

                        if (this.textEl.el.style['caret-color'] == 'black') return;
                        const {
                            ctrlKey, metaKey,
                        } = evt;

                        if (key_num === 8 || key_num === 46) {
                            createEvent.call(this, 8, false);
                        } else if (key_num === 40) {
                            this.clear();
                            createEvent.call(this, 40, false);
                        } else if (key_num === 39) {
                            createEvent.call(this, 39, false);
                        } else if (key_num === 37) {
                            createEvent.call(this, 37, false);
                        } else if (key_num === 38) {
                            createEvent.call(this, 38, false);
                        } else if (ctrlKey || metaKey) {
                            if (key_num === 67) {
                                createEvent.call(this, 67, true);
                            } else if (key_num === 86) {
                                createEvent.call(this, 86, true);
                            } else if (key_num === 88) {
                                createEvent.call(this, 88, true);
                            } else if (key_num === 90) {
                                createEvent.call(this, 90, true);
                            }else if (key_num === 66) {
                                createEvent.call(this, 66, true);
                            }
                        }
                    }),
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
            .child(this.areaEl);
        this.suggest.bindInputEvents(this.textEl);

        this.tmp = h('span', 'span_tmp').hide();
        this.textEl.attr('contenteditable', 'true');
        this.textEl.css('width', `${rowWidth - 3}px`);
        this.textEl.css('height', `${rowHeight - 2}px`);
        this.textEl.child(this.tmp);
        this.pos = 0;
        this.areaOffset = null;
        this.freeze = {w: 0, h: 0};
        this.cell = null;
        this.inputText = '';
        setTimeout(() => {
            this.show(false);
        });
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


    show(off = true) {
        if (off) {
            this.textEl.css('caret-color', 'black');
            this.textEl.css('cursor', 'text');
            this.textEl.css('opacity', '1');
            this.textEl.el.focus();
            this.areaEl.css('pointer-events', 'auto');
            this.areaEl.css('border', '2px solid #4b89ff');
            this.areaEl.css('background', 'white');
        } else {
            this.textEl.css('caret-color', 'white');
            this.textEl.css('cursor', 'default');
            this.textEl.css('opacity', '0');
            this.textEl.el.blur();
            this.areaEl.css('pointer-events', 'none');
            this.areaEl.css('background', 'rgba(75, 137, 255, 0.1)');
            this.areaEl.css('border', 'none');
        }
    }

    parse(pos = -1) {
        if (pos != -1) {
            this.pos = getCursortPosition.call(this);
            parse2.call(this, this.inputText, this.pos);
        } else {
            parse.call(this, this.inputText);
        }
    }

    clear(c = false) {
        if(this.inputText != '' && this.inputText.replace(/\s/g, "").lastIndexOf('¥') === 0) {
            this.change('format', this.inputText);
        }
        this.cell = null;
        this.areaOffset = null;
        this.inputText = '';
        this.show(false);
        this.copy = false;
        set_focus.call(this, this.textEl.el, -1);
        this.pos = 0;
        this.tmp.hide();
        this.textEl.html('');
        this.textlineEl.html('');
        resetSuggestContentItems.call(this);
        resetSuggestItems.call(this);
        this.datepicker.hide();

        if (c) {
            return;
        }

        setTimeout(() => {
            const {ri, ci} = this.data.selector;
            this.setRiCi(ri, ci);
        });
    }

    mount2span(spanArr, pos = -1, begin = -1, content = {suggestContent: false, cut: '', pos: -1}) {
        if (this.spanArr === spanArr) {
            return;
        }

        const {show} = this.suggest;
        if (content.suggestContent && !show) {
            this.suggestContent.content(content.cut, content.pos);
        } else {
            this.suggestContent.hide();
        }
        Object.keys(spanArr).forEach((i) => {
            spanArr[i].css('background-color', 'rgba(255,255,255,0.1)');
        });
        if (pos !== '-1' && begin != -1 && spanArr[pos]) {
            spanArr[pos].css('background-color', '#e5e5e5');
            spanArr[begin].css('background-color', '#e5e5e5');
        }

        if (spanArr.length > 0) {
            this.textEl.html('');
            this.tmp = h('span', 'span_tmp').children(...spanArr)
                .css('top', '0px').css('color', 'black');
            this.textEl.el.insertBefore(this.tmp.el, this.textEl.el.childNodes[0]);
            // this.textEl.el.removeChild(this.textEl.el.childNodes[this.textEl.el.childNodes.length - 1]);
            set_focus.call(this, this.textEl.el, -1);
        }

        this.spanArr = spanArr;
    }

    handler(text) {
        const cursorPos = this.pos;
        if (cursorPos >= this.inputText) {
            this.setMouseDownIndex([]);
            return;
        }
        const textBegin = text.substring(0, cursorPos);
        const textEnd = text.substring(cursorPos, text.length);
        parse.call(this, textBegin);
        if (textEnd !== '') {
            this.setMouseDownIndex([textBegin, textEnd]);
        } else {
            this.setMouseDownIndex([]);
        }
    }

    setOffset(offset, suggestPosition = 'top', show = true) {
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

            if (show) {
                this.show(false);
            }
        }
    }

    setCellEnd(cell) {
        let text = (cell && cell.formulas) || '';
        text = text == '' ? (cell && cell.text) || '' : text;

        this.textEl.child(text + "");
        this.pos = text.length;
        set_focus.call(this, this.textEl.el, -1);
        this.oldCell = {
            text: (cell && cell.text) || '',
            formulas: (cell && cell.formulas) || '',
        };

        inputEventHandler.call(this, null,  (cell && cell.text) || text,  (cell && cell.formulas) || '',  "end");
        setTimeout(() => {
            set_focus.call(this, this.textEl.el, -1);
        })
    }

    setCell(cell, validator, type = 1) {
        this.cell = cell;
        this.show();

        let text = (cell && cell.formulas) || '';
        text = text == '' ? (cell && cell.text) || '' : text;

        this.oldCell = {
            text: (cell && cell.text) || '',
            formulas: (cell && cell.formulas) || '',
        };
        const {el, datepicker, suggest} = this;
        el.show();
        this.textEl.show();
        set_focus.call(this, this.textEl.el, -1);
        setTimeout(() => {
            this.pos = text.length;
            set_focus.call(this, this.textEl.el);
        }, 10);
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

        if (type == 2 && text != '' && text[0] == '=') {
            inputEventHandler.call(this, null, text);
            this.pos = text.length;
            set_focus.call(this, this.textEl.el, text.length);
        } else if (type == 2 && text[0] != '=') {
            this.textEl.child(text);
        }
        setTimeout(() => {
            this.textlineEl.html(text);
            resetTextareaSize.call(this);
        });
    }

    inputEventHandler(text = '', hide = false) {
        if(hide) {
            this.areaEl.hide();
            this.sheet.selector.hide();
            this.isCors = true;
        }
        inputEventHandler.call(this, null, text);
    }

    isDisplay() {
        if(isDisplay.call(this) && this.inputText.lastIndexOf("=") == 0)
            return true;
        else
            return false
    }

    setCursorPos(pos) {
        this.pos = pos;
        set_focus.call(this, this.textEl.el, pos);
    }

    setText(text) {
        this.inputText = text;
        setText.call(this, text, text.length);
        resetTextareaSize.call(this);
        this.textEl.child(this.tmp);
    }
}

/* global window, document */
import {h} from './component/element';
import DataProxy from './core/data_proxy';
import Sheet from './component/sheet';
import {cssPrefix} from './config';
import {locale} from './locale/locale';
import './index.less';
import zhCN from './locale/zh-cn';

class Spreadsheet {
    constructor(selectors, options = {}, methods = {}, alias = 'sheet1') {
        let targetEl = selectors;
        if (typeof selectors === 'string') {
            targetEl = document.querySelector(selectors);
        }
        this.locale('zh-cn', zhCN);
        this.data = new DataProxy(alias, options, methods);
        const rootEl = h('div', `${cssPrefix}`)
            .on('contextmenu', evt => evt.preventDefault());
        // create canvas element
        targetEl.appendChild(rootEl.el);
        this.sheet = new Sheet(rootEl, this.data);
    }

    loadData(data) {
        this.sheet.loadData(data);
        return this;
    }

    getData() {
        return this.data.getData();
    }

    validate() {
        const {validations} = this.data;
        return validations.errors.size <= 0;
    }

    change(cb) {
        this.data.change = cb;
        return this;
    }

    static locale(lang, message) {
        locale(lang, message);
    }

    locale(lang, message) {
        locale(lang, message);
    }

    getEditorStatus() {
        let {editor} = this.sheet;
        let {inputText, ri, ci} = editor;
        let args = {
            "status": editor.isDisplay(),
            "inputText": inputText,
            "ri": ri,
            "ci": ci,
        }
        return args;
    }

    setEditorText(text = '') {
        let {editor} = this.sheet;
        text = text != '' ? text : '=';
        editor.inputEventHandler(text, true);
    }

    setTextEnd(cell, ri, ci) {
        let {editor, data} = this.sheet;
        editor.setCellEnd({
            text: cell.text,
            formulas: cell.formulas
        });
        data.setCellAll(ri, ci, cell.formulas + "", cell.formulas + "", '');

        this.sheet.selectorEditorReset(ri, ci);

        setTimeout(() => {
            editor.setCursorPos(cell.formulas.length);
        })
    }

    getText(alias) {
        let {selectors, data, table} = this.sheet;
        let text = "";
        for(let i = 0; i < selectors.length; i++) {
            let {erpx} = selectors[i];
            text += erpx;
        }
        let t = data.getCellByExpr(text, table, alias);

        return t;
    }

    removeEvent() {
        this.sheet.removeEvent();
    }
}

const spreadsheet = (el, options = {}) => new Spreadsheet(el, options);

if (window) {
    window.x = window.x || {};
    window.x.spreadsheet = spreadsheet;
    window.x.spreadsheet.locale = (lang, message) => locale(lang, message);
}

export default Spreadsheet;
export {
    spreadsheet,
};

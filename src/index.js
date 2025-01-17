/* global window, document */
import {h} from './component/element';
import DataProxy from './core/data_proxy';
import Sheet from './component/sheet';
import {cssPrefix} from './config';
import {locale} from './locale/locale';
import './index.less';
import zhCN from './locale/zh-cn';
import PlugIn from "./plug-in/plug_in";
import {bugout} from "./log/log_proxy";

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
        // const worker = new Worker();
        // worker.postMessage({ a: 1 });
        // worker.onmessage = function (event) {};
        //
        // worker.addEventListener("message", function (event) {});
        this.sheet = new Sheet(rootEl, this.data);
        this.data.sheet = this.sheet;
        this.plugIn = new PlugIn(rootEl, this.sheet, this.data);
    }

    setDataSettings(value) {
        this.data.settings.showEditor = value;
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
        let { ri, ci, pos} = editor;
        let inputText = editor.editorText.getText();
        let args = {
            "status": editor.isDisplay(),
            "inputText": inputText,
            "ri": ri,
            "ci": ci,
            "pos": pos,
        }
        return args;
    }

    setEditorText(text = '', pos = 1) {
        let {editor} = this.sheet;
        text = text != '' ? text : '=';
        editor.inputEventHandler(text, pos, true);
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
        }, 100)
    }

    getText(alias, inputText, pos) {
        let {selectors, data, table} = this.sheet;
        let text = "";
        for(let i = 0; i < selectors.length; i++) {
            let {erpx} = selectors[i];
            text += erpx;
        }
        let t = data.getCellByExpr(text, table, alias, inputText, pos);

        return t;
    }

    removeEvent() {
        this.sheet.removeEvent();
    }
}

const spreadsheet = (el, options = {}) => new Spreadsheet(el, options);

if (window) {
    window.jsSpreadsheet = require('js-spreadsheet');
    window.x = window.x || {};
    window.bugout = bugout;
    window.x.spreadsheet = spreadsheet;
    window.x.spreadsheet.locale = (lang, message) => locale(lang, message);
}

export default Spreadsheet;
export {
    spreadsheet,
};

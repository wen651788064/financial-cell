/* global window, document */
import {h} from './component/element';
import DataProxy from './core/data_proxy';
import Sheet from './component/sheet';
import {cssPrefix} from './config';
import {locale} from './locale/locale';
import './index.less';
import zhCN from './locale/zh-cn';

class Spreadsheet {
    constructor(selectors, options = {}) {
        let targetEl = selectors;
        if (typeof selectors === 'string') {
            targetEl = document.querySelector(selectors);
        }
        this.locale('zh-cn', zhCN);
        this.data = new DataProxy('sheet1', options);
        const rootEl = h('div', `${cssPrefix}`)
            .on('contextmenu', evt => evt.preventDefault());
        // create canvas element
        targetEl.appendChild(rootEl.el);
        this.sheet = new Sheet(rootEl, this.data);
        this.sheet.removeEvent();

        // let btn = document.getElementById('btn2');
        // let clipboard = new Clipboard(btn);
        //
        // clipboard.on('success', function(e) {
        //     console.log(e);
        // });
        //
        // clipboard.on('error', function(e) {
        //     console.log(e);
        // });
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

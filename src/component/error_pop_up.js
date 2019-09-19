import Modal from "./modal";
import {h} from "./element";
import Button from "./button";
import {t} from "../locale/locale";
import {cssPrefix} from "../config";

export default class ErrorPopUp extends Modal {
    constructor() {
        super(t('contextmenu.errorPop'), [
            h('div', `${cssPrefix}-form-fields`).children(
                h('span', '').html("您输入的公式好像至少缺少一个左括号")
            ),
            h('div', `${cssPrefix}-form-fields`),
            h('div', `${cssPrefix}-buttons`).children(
                new Button('ok', 'primary')
                    .on('click', () => this.btnClick('ok')),
            ),
        ]);
    }

    btnClick(action) {
        if (action === 'ok') {
            this.hide();
        }
    }

}
import {h} from './element';
import {cssPrefix} from '../config';
import {sheetReset} from './sheet';

export default class Advice {
    constructor(data, sheet) {
        this.el = h('div', `${cssPrefix}-advice`)
            .children(
                this.save = h('div', `${cssPrefix}-advice-style`)
                    .css('border-bottom', '1px solid'),
                this.text = h('div', `${cssPrefix}-advice-style`),
            )
            .hide();
        this.save.children(
            this.saveCheck = h('span', 'check').hide('visibility', 'hidden'),
            h('span', '').html('保留样式'),
        );
        this.text.children(
            this.textCheck = h('span', 'check').hide('visibility', 'hidden'),
            h('span', '').html('仅文本'),
        );
        this.data = data;
        this.sheet = sheet;
        this.old_rows = '';
        this.new_rows = '';
        this.left = 0;
        this.top = 0;

        this.save.on('mousedown.stop', (evt) => {
            this.saveCheck.show('visibility', 'initial');
            this.textCheck.hide('visibility', 'hidden');
            this.data.rows._ = this.new_rows;
            sheetReset.call(this.sheet);
        });

        this.text.on('mousedown.stop', (evt) => {
            this.data.rows._ = this.old_rows;
            this.saveCheck.show('visibility', 'hidden');
            this.textCheck.hide('visibility', 'initial');
            sheetReset.call(this.sheet);
        });
    }

    show(left, top, type = 1, old_rows, new_rows) {
        this.el.css('left', `${left}px`);
        this.el.css('top', `${top}px`);
        if (type == 1) {
            this.saveCheck.show('visibility', 'initial');
            this.textCheck.hide('visibility', 'hidden');
        }
        this.left = parseInt(left);
        this.top = parseInt(top);
        this.el.show();
        this.old_rows = old_rows;
        this.new_rows = new_rows;
    }
}

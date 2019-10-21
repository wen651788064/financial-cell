import {describe, it} from 'mocha';
import DataProxy from "../../src/core/data_proxy";
import Recast from "../../src/core/recast";
import {CellRange} from "../../src/core/cell_range";

let assert = require('assert');

describe('qq', () => {
    let data = new DataProxy("sheet1", {}, {});

    describe('  recast test ', () => {
        it(' ="""  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '="""', "input");
            assert.equal(state, true);
        });

        it(' =""  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=""', "input");
            assert.equal(state, false);
        });

        it(' =()  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=()', "input");
            assert.equal(state, true);
        });

        it(' =(s)  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=(s)', "input");
            assert.equal(state, false);
        });

        it(' =(s)  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=()', "input");
            assert.equal(state, true);
        });

        it(' =(sasd  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=(sasd', "input");
            assert.equal(state, true);
        });

        it(' ==  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '==', "input");
            assert.equal(state, true);
        });

        it(' =AMORLINC(2400,39679,39813,300,1,0.15,1) ', () => {
            let {state, msg} = data.selectorCellText(1, 1, '=AMORLINC(2400,39679,39813,300,1,0.15,1)', "input");
            assert.equal(state, false);
        })
    });

    describe(' autofilter  ', () => {
        it(' number autofilter ', () => {
            let cell = {"text": "1", "formulas": "1"};
            data.rows.setCell(3, 4, cell, 'all_with_no_workbook');
            const srcCellRange = new CellRange(3, 4, 3, 4, 0, 0);
            const dstCellRange = new CellRange(4, 4, 12, 4, 0, 0);
            data.rows.copyPaste(srcCellRange, dstCellRange, 'all', true);

            let cell1 = data.rows.getCell(4, 4);
            let cell2 = data.rows.getCell(9, 4);
            let cell3 = data.rows.getCell(12, 4);

            assert.equal(cell1.text, '2');
            assert.equal(cell1.formulas, '2');

            assert.equal(cell2.text, '7');
            assert.equal(cell2.formulas, '7');

            assert.equal(cell3.text, '10');
            assert.equal(cell3.formulas, '10');
        });

        it(' letter autofilter ', () => {
            let cell = {"text": "a", "formulas": "a"};
            data.rows.setCell(3, 4, cell, 'all_with_no_workbook');
            const srcCellRange = new CellRange(3, 4, 3, 4, 0, 0);
            const dstCellRange = new CellRange(4, 4, 12, 4, 0, 0);
            data.rows.copyPaste(srcCellRange, dstCellRange, 'all', true);

            let cell1 = data.rows.getCell(4, 4);
            let cell2 = data.rows.getCell(9, 4);
            let cell3 = data.rows.getCell(12, 4);

            assert.equal(cell1.text, 'a');
            assert.equal(cell1.formulas, 'a');

            assert.equal(cell2.text, 'a');
            assert.equal(cell2.formulas, 'a');

            assert.equal(cell3.text, 'a');
            assert.equal(cell3.formulas, 'a');
        });
    });

    describe('  tryParseToNum  ', () => {
        it(' 2019-01-01 ', function () {
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01"};
            data.rows.setCell(1, 1, cell, 'normal');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            assert.equal(state, false);
            assert.equal(text, '2019-01-01');
        });

        it(' 2019-01-01 normal ', function () {
            let cstyle = {};
            cstyle.format = 'normal';
            let style = data.addStyle(cstyle);
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01", "style": style};
            data.rows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, 43466);
            assert.equal(cell.formulas, 43466);
        });

        it(' =average() date ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "2019-01-01", "formulas": "=AVERAGE(E3:E4)", "style": style};
            data.rows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, "2019-01-01");
            assert.equal(cell.formulas, "=AVERAGE(E3:E4)");
        });

        it(' 43424 ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "43424", "formulas": "43424", "style": style};

            data.rows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, "2018-11-20");
            assert.equal(cell.formulas, "2018-11-20");
            assert.equal(cell.to_calc_num, "43424");
            assert.equal(cell.formulas, "2018-11-20");
        });

        it(' =average() normal ', function () {
            let cstyle = {};
            cstyle.format = 'normal';
            let style = data.addStyle(cstyle);
            let cell = {"text": "2019-01-01", "formulas": "=AVERAGE(E3:E4)", "style": style};
            data.rows.setCell(1, 1, cell, 'all_with_no_workbook');

            let args = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, 43466);
            assert.equal(cell.formulas, "=AVERAGE(E3:E4)");
        });
    });

    describe('  recast  ', () => {
        it(' =() recast', function () {
            let recast = new Recast('=()');
            let error = false;
            try {
                recast.parse();
            } catch {
                error = true;
            }
            assert.equal(error, true);
        });
    });
});
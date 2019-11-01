import {describe, it} from 'mocha';
import DataProxy from "../../src/core/data_proxy";
import Recast from "../../src/core/recast";
import CellProxy from "../../src/component/cell_proxy";
import {cutStr, deepCopy} from "../../src/core/operator";
import {RefRow} from "../../src/core/ref_row";
import EditorText from "../../src/component/editor_text";
import {calcDecimals, dateDiff, formatDate} from "../../src/component/date";
import {isHave} from "../../src/core/helper";
import {copyPasteTemplate} from "../template/templates";
import {formatNumberRender} from "../../src/core/format";
import FormatProxy from "../../src/core/format_proxy";
import {multipleCellsRender, specialWebsiteValue} from "../../src/component/special_formula_process";

let assert = require('assert');

// 越简单的放后面
describe('qq', () => {
    let data = new DataProxy("sheet1", {}, {});

    describe('  recast test  ', () => {
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

        it(' =12+12+  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=12+12+', "input");
            assert.equal(state, true);
        });

        it(' =AMORLINC(2400,39679,39813,300,1,0.15,1) ', () => {
            let {state, msg} = data.selectorCellText(1, 1, '=AMORLINC(2400,39679,39813,300,1,0.15,1)', "input");
            assert.equal(state, false);
        });

        it(' =INDEX({1,2;3,4},0,2) ', () => {
            let {state, msg} = data.selectorCellText(1, 1, '=INDEX({1,2;3,4},0,2)', "input");
            assert.equal(state, false);
        });
    });

    describe('  cutStr  ', () => {
        it(' =A1(1, 2)', function () {
            let arr = cutStr('=A1(1, 2)');
            assert.equal(arr.length, 0);
            arr = cutStr('=A1+A2');
            assert.equal(arr.length, 2);
        });

        it(' =A1(A2, A3, $A$2, 1, 2, add(1, A5)) ', function () {
            let arr = cutStr('=A1(A2, A3, $A$2, 1, 2, add(1, A5))', false, true);
            console.log(arr);
        });
    });

    describe('  paste  ', () => {
        it(' paste =D1 ', () => {
            // let tableProxy = new TableProxy(data);
            // tableProxy.rows._ = {
            //     "13": {
            //         "cells": {
            //             "5": {
            //                 formulas: "=F4",
            //                 style: 7,
            //                 text: "=F4",
            //                 value: "=F4",
            //             }
            //         }
            //     }
            // };
            // let reference = [{
            //     ri: 13,
            //     ci: 5
            // }];

        });
    });

    describe('  depend cell  ', () => {
        it(' =A1(A2, A3, $A$2, 1, 2, add(1, A5:B5)) ', function () {
            data.rows.getDependCell('A10', {text: "", formulas: "=A1(A2, A3, $A$2, 1, 2, add(1, A5:B5))"});
            let {depend} = data.rows.getCell(1, 0);
            assert.equal(depend[0], 'A10');
            let args  = data.rows.getCell(4, 0);
            assert.equal(args.depend[0], 'A10');
        });

        it(' mergeCell ', function () {
            let arr = data.rows.mergeCellExpr("A1:A6");

            assert.equal(arr[0], 'A1');
            assert.equal(arr[1], 'A2');
            assert.equal(arr[2], 'A3');
            assert.equal(arr[3], 'A4');
            assert.equal(arr[4], 'A5');

            arr = data.rows.mergeCellExpr("A3:A1");
            assert.equal(arr[0], 'A1');
            assert.equal(arr[1], 'A2');
            assert.equal(arr[2], 'A3');
        });
    });

    describe('  cell change action  ', () => {
        it(' editorChangeToHistory ', function () {
            let {state} = data.editorChangeToHistory({text: "1", }, {"text": "2"}, {ri: 1, ci: 1});
            let args = data.historyStep.getItems(1);
            assert.equal(state, true);
            assert.equal(args[0].ri, '1');
            assert.equal(args[0].ci, '1');
            assert.equal(args[0].action, '在B2中键入"2"');
            assert.equal(args[0].expr, 'B2');
            assert.equal(args[0].oldCell.text, '1');

            args = data.editorChangeToHistory({text: "1", formulas: "=add(1, 0)" }, {"text": "=add(1, 0)"}, {ri: 2, ci: 2});
            assert.equal(args.state, false);
        });

        describe('  history  ', () => {
            it(' undo ', function () {
                data.historyStep.undo();
            });
        });
    });

    describe('  formatProxy  ', () => {
        it('  1.23/1/123  ', function () {
            let formatProxy = new FormatProxy();
            let _cell = formatProxy.makeFormatCell({text: "1.23", formula: "1.23"}, {symbol: "%", position: "end"},  (s) => {
                return Number(s  * 100).toFixed(2);});

            assert.equal(_cell.text, '123.00%');
            assert.equal(_cell.formulas, '123.00');
            assert.equal(_cell.value, '1.23');

            _cell = formatProxy.makeFormatCell({text: "1", formula: "1"}, {symbol: "%", position: "end"},  (s) => {
                return Number(s  * 100).toFixed(2);});
            assert.equal(_cell.text, '100.00%');
            assert.equal(_cell.formulas, '100.00');
            assert.equal(_cell.value, '1');

            _cell = formatProxy.makeFormatCell({text: "123", formula: "123"}, {symbol: "%", position: "end"},  (s) => {
                return Number(s  * 100).toFixed(2);});
            assert.equal(_cell.text, '12300.00%');
            assert.equal(_cell.formulas, '12300.00');
            assert.equal(_cell.value, '123');
        });

        it('  1.23.23  ', function () {
            let formatProxy = new FormatProxy();
            let _cell = formatProxy.makeFormatCell({text: "1.23.23", formula: "1.23.23"}, {symbol: "%", position: "end"}, (s) => {
                return calcDecimals(s, (s2) => { return s2 * 100; });
            });
            assert.equal(_cell, null);
        });
    });

    describe('  special_formula_process  ', () => {
        it('  *HYPERLINK*/*MULTIPLECELLS*  ', function () {
            let args = specialWebsiteValue('*HYPERLINK*!{"text":"www.baidu.com","url":"www.baidu.com"} ', "=ADD()");
            assert.equal(args.state, true);
            assert.equal(args.text, "www.baidu.com");
            assert.equal(args.type, 2);

            let wb = {
                "A1": {
                    "v":"1",
                    "f":"1"
                },
                "B1": {
                    "v":"2",
                    "f":"2"
                }
            }
            args = specialWebsiteValue('*MULTIPLECELLS*!'+JSON.stringify(wb), "=ADD()");
            console.log('*MULTIPLECELLS*!'+JSON.stringify(wb));
            assert.equal(args.state, true);
            assert.equal(args.type, 1);
            let wb2  = {};
            multipleCellsRender(wb2, args.text);
            assert.equal(wb2['A1'].v, 1);
            assert.equal(wb2['B1'].f, 2);
        });
    });

    describe('  formatNumberRender  ', () => {
        it('  1.23.23  ', function () {
             assert.equal(formatNumberRender("1.23.23", -1), "1.23.23");
        });
    });

    describe(' F4 ', () => {
        it(' =A1 ', () => {
            let editorText = new EditorText('A1');
            editorText.setText('=A1');
            let args = editorText.f4ShortcutKey(3);

            assert.equal(args.inputText, '=$A$1');
            assert.equal(args.pos, 5);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=$A1');
            assert.equal(args.pos, 4);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=A$1');
            assert.equal(args.pos, 4);
        });

        it(' =A1+A2 ', () => {
            let editorText = new EditorText('A1');
            editorText.setText('=A1+A2');
            let args = editorText.f4ShortcutKey(3);

            assert.equal(args.inputText, '=$A$1+A2');
            assert.equal(args.pos, 5);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=$A1+A2');
            assert.equal(args.pos, 4);
        });
    });

    describe(' autofilter  ', () => {
        it(' number autofilter ', () => {
            let cell = {"text": "1", "formulas": "1"};
            copyPasteTemplate(cell, data);

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

        it('  2019-01-01 1 autofilter  ', function () {
            let cell = {"text": "2019-01-01 1", "formulas": "2019-01-01 1"};
            copyPasteTemplate(cell, data);

            let cell1 = data.rows.getCell(4, 4);
            let cell2 = data.rows.getCell(9, 4);
            let cell3 = data.rows.getCell(12, 4);

            assert.equal(cell1.text, '2019-01-01 2');
            assert.equal(cell1.formulas, '2019-01-01 2');

            assert.equal(cell2.text, '2019-01-01 7');
            assert.equal(cell2.formulas, '2019-01-01 7');

            assert.equal(cell3.text, '2019-01-01 10');
            assert.equal(cell3.formulas, '2019-01-01 10');
        });

        it(' 12as212a autofilter', function () {
            let cell = {"text": "12as212a", "formulas": "12as212a"};
            copyPasteTemplate(cell, data);

            let cell1 = data.rows.getCell(4, 4);
            let cell2 = data.rows.getCell(9, 4);
            let cell3 = data.rows.getCell(12, 4);

            assert.equal(cell1.text, '12as213a');
            assert.equal(cell1.formulas, '12as213a');

            assert.equal(cell2.text, '12as218a');
            assert.equal(cell2.formulas, '12as218a');

            assert.equal(cell3.text, '12as221a');
            assert.equal(cell3.formulas, '12as221a');
        });

        it(' null autofilter', function () {
            let cell = {};
            copyPasteTemplate(cell, data);
            let cell1 = data.rows.getCell(4, 4);
            let cell2 = data.rows.getCell(9, 4);
            let cell3 = data.rows.getCell(12, 4);

            assert.equal(cell1.text, '');
            assert.equal(cell1.formulas, '');

            assert.equal(cell2.text, '');
            assert.equal(cell2.formulas, '');

            assert.equal(cell3.text, '');
            assert.equal(cell3.formulas, '');
        });

        it(' letter autofilter ', () => {
            let cell = {"text": "a", "formulas": "a"};
            copyPasteTemplate(cell, data);

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

    describe('  set cell  ', () => {
        it(' setCellAll - value not empty ', function () {
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01", "value": "322.121"};
            data.rows.setCell(1, 1, cell, 'number');

            // 用户点击单元格
            data.rows.setCellAll(1, 1, "2019-01-01");
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.value, '322.121');
            assert.equal(cell.text, '2019-01-01');
            assert.equal(cell.formulas, '2019-01-01');
        });

        it('  setCellText  ', function () {
            data.rows.setCellText(1, 1, {text: "=add(1, 3)", style: 1}, '', '', 'style');
            let cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, '=add(1, 3)');
            assert.equal(cell.formulas, '=add(1, 3)');

            data.rows.setCellText(1, 1, {text: "1", style: 1}, '', '', 'format');
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, '1');
            assert.equal(cell.formulas, '=add(1, 3)');
        });
    });

    describe('  get cell  ', () => {
        it(' getCell ', function () {
            let cell = {"style": 1};
            data.rows.setCell(1, 1, cell, 'all');
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.style, '1');

            cell = {"text": 1};
            data.rows.setCell(1, 1, cell, 'all');
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, '1');
        });
    });

    describe('  tryParseToNum  ', () => {
        it(' -/a   ->   -/a', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "-", "formulas": "-", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(state, true);
            assert.equal(text, '-');
            assert.equal(cell.formulas, '-');
            assert.equal(cell.value, '-');

            cell = {"text": "a", "formulas": "a", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(args.state, true);
            assert.equal(args.text, 'a');
            assert.equal(cell.formulas, 'a');
            assert.equal(cell.value, 'a');
        });

        it(' text: 322.12 value: 322.121 to number', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "322.12", "formulas": "322.12", "value": "322.121", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;
            data.rows.setCell(1, 1, cell, 'normal');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, '322.121');
            assert.equal(cell.formulas, '322.121');
            assert.equal(cell.value, '322.121');
        });

        // 可能小数点的情况以后会发生变化
        it(' text:  1899-12-31 value: 1.23 to date', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);

            let cell = {"text": "1899-12-31", "formulas": "1899-12-31", "value": "1.23", "style": style};
            data.rows.setCell(1, 1, cell, 'date');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, '1899-12-31');
            assert.equal(cell.formulas, '1899-12-31  5:31:12');
            assert.equal(cell.value, '1.23');
        });

        it(' text: 43466.22 value: 43466.22 to date then to normal', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);

            let cell = {"text": "43466.22", "formulas": "43466.22", "value": "43466.22", "style": style};
            data.rows.setCell(1, 1, cell, 'date');
            data.tryParseToNum('input', cell, 1, 1);

            // 模拟用户点击单元格的操作
            data.rows.setCellAll(1, 1, "2019-01-01");
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.value, '43466.22');
            // end

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;

            data.rows.setCell(1, 1, cell, 'normal');
            data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, '43466.22');
            assert.equal(cell.formulas, '43466.22');
            assert.equal(cell.value, '43466.22');
        });

        it(' 44048 -> ￥', function () {
            let cstyle = {};
            cstyle.format = 'rmb';
            let style = data.addStyle(cstyle);
            let cell = {"text": "44048", "formulas": "44048", "style": style};
            data.rows.setCell(1, 1, cell, 'rmb');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(text, '44048');
            assert.equal(cell.text, '￥44048');
            assert.equal(cell.formulas, '44048');
            assert.equal(cell.value, '44048');

            cell = {"text": "2019-01-01", "formulas": "2019-01-01", "style": style};
            data.rows.setCell(1, 1, cell, 'rmb');
            let args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);
            assert.equal(args.text, '43466');
            assert.equal(cell.text, '￥43466');
            assert.equal(cell.formulas, '43466');
            assert.equal(cell.value, '43466');
        });

        it('  44048 -> % ', function () {
            let cstyle = {};
            cstyle.format = 'percent';
            let style = data.addStyle(cstyle);
            let cell = {"text": "44048", "formulas": "44048", "style": style};
            data.rows.setCell(1, 1, cell, 'percent');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(text, '44048');
            assert.equal(cell.text, '4404800.00%');
            assert.equal(cell.formulas, '4404800.00');
        });

        it(' 2019-01-01 to number', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "2019-01-01", "formulas": "2019-01-01", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(state, true);
            assert.equal(text, '43466.00');
            assert.equal(cell.formulas, '43466.00');
        });

        it(' value 2019-01-01 to normal', function () {
            let cstyle = {};
            cstyle.format = 'normal';
            let style = data.addStyle(cstyle);

            let cell = {
                "text": "43466",
                "formulas": "43466",
                "style": style,
                "value": "2019-01-01",
                "to_calc_num": "43466"
            };
            data.rows.setCell(1, 1, cell, 'normal');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(state, true);
            assert.equal(text, '43466');
            assert.equal(cell.formulas, '43466');
            assert.equal(cell.value, '2019-01-01');
        });

        // 322.12   =>    322
        it(' 322.12 to 322 normal', function () {
            let cstyle = {};
            cstyle.format = 'normal';
            let style = data.addStyle(cstyle);

            let cell = {"text": "322.12", "formulas": "322.12", "style": style};
            data.rows.setCell(1, 1, cell, 'normal');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(state, true);
            assert.equal(text, '322.12');
            assert.equal(cell.value, '322.12');
        });

        it(' 1.122 ->(date) 1899-12-31 2:55:40 ->(number) 1.12 ->(normal) 1.122  ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);

            let cell = {"text": "1.122", "formulas": "1.122", "value": "1.122", "style": style};
            data.rows.setCell(1, 1, cell, 'date');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "1899-12-31");
            assert.equal(cell.formulas, "1899-12-31  2:55:40");
            assert.equal(cell.value, "1.122");

            cstyle.format = 'number';
            style = data.addStyle(cstyle);
            cell.style = style;
            data.rows.setCell(1, 1, cell, 'date');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "1.12");
            assert.equal(cell.formulas, "1.12");
            assert.equal(cell.value, "1.122");

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;
            data.rows.setCell(1, 1, cell, 'normal');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "1.122");
            assert.equal(cell.formulas, "1.122");
            assert.equal(cell.value, "1.122");
        });

        it(' 322.12/322.123/asd/321.asa to number', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "322.12", "formulas": "322.12", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            assert.equal(state, true);
            assert.equal(text, '322.12');

            let cell2 = {"text": "322.123", "formulas": "322.123", "style": style};
            data.rows.setCell(2, 2, cell2, 'number');
            let args = data.tryParseToNum('input', cell, 2, 2);
            cell2 = data.rows.getCell(2, 2);
            assert.equal(args.state, true);
            assert.equal(args.text, '322.12');
            assert.equal(cell2.formulas, '322.12');

            let cell3 = {"text": "asd", "formulas": "asd", "style": style};
            data.rows.setCell(3, 3, cell3, 'number');
            args = data.tryParseToNum('input', cell3, 3, 3);
            cell3 = data.rows.getCell(3, 3);
            assert.equal(args.state, true);
            assert.equal(args.text, 'asd');
            assert.equal(cell3.formulas, 'asd');

            let cell4 = {"text": "321.asd", "formulas": "321.asd", "style": style};
            data.rows.setCell(4, 4, cell3, 'number');
            args = data.tryParseToNum('input', cell4, 4, 4);
            cell4 = data.rows.getCell(4, 4);
            assert.equal(args.state, true);
            assert.equal(args.text, '321.asd');
            assert.equal(cell4.formulas, '321.asd');
        });

        it('  =average(A1:A2) 123 to number  ', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "123", "formulas": "=average(A1:A2)", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

             assert.equal(state, true);
            assert.equal(text, '123.00');
            assert.equal(cell.formulas, '=average(A1:A2)');
            assert.equal(cell.text, '123.00');
        });



        it('  =average(A1:A2) 1992-01-01 to number  ', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "1992-01-01", "formulas": "=average(A1:A2)", "style": style};
            data.rows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(state, true);
            assert.equal(text, '33604.00');
            assert.equal(cell.formulas, '=average(A1:A2)');
            assert.equal(cell.text, '33604.00');
        });

        it(' 2019-01-01 ', function () {
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01"};
            data.rows.setCell(1, 1, cell, 'normal');
            let {state, text} = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);
            assert.equal(state, true);
            assert.equal(text, '43466');
            assert.equal(cell.text, "2019-01-01");
            assert.equal(cell.to_calc_num, "43466");

            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            cell = {text: "44044", formulas: "2020-08-01", style: style, to_calc_num: 44044, value: "2020-08-01"}
            data.rows.setCell(1, 1, cell, 'date');
            data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "2020-08-01");
            assert.equal(cell.formulas, '2020-08-01');
            assert.equal(cell.value, '2020-08-01');
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
            assert.equal(cell.value, "2019-01-01");
        });

        it('  57294 number to date    --  value not empty  ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "57294", "formulas": "=D3", "value": "=D3", "style": style};
            data.rows.setCell(1, 1, cell, 'normal');
            data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.value, "=D3");
        });


        it(' =average() date   --  value empty', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "2019-01-01", "formulas": "=AVERAGE(E3:E4)", "style": style};
            data.rows.setCell(1, 1, cell, 'date');
            let args = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, "2019-01-01");
            assert.equal(cell.formulas, "=AVERAGE(E3:E4)");
            assert.equal(cell.value, "2019-01-01");
        });

        // 此情况是针对 value为公式， 这时候应该取text的值而非value的值。
        it(' =average() date value ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "44048", "formulas": "=AVERAGE(D5:D6)", "value": "=AVERAGE(D5:D6)", "style": style};
            data.rows.setCell(1, 1, cell, 'date');
            let args = data.tryParseToNum('input', cell, 1, 1);

            cell = data.rows.getCell(1, 1);
            assert.equal(cell.text, "2020-08-05");
            assert.equal(cell.formulas, "=AVERAGE(D5:D6)");
            assert.equal(cell.value, "=AVERAGE(D5:D6)");
        });

        // cell.value 始终保持不变  需要不断地往这个里面加
        it(' -123.123 ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "-123.123", "formulas": "-123.123", "style": style};

            data.rows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);
            assert.equal(cell.value, "-123.123");

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;
            args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.value, "-123.123");
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
            assert.equal(cell.value, "43424");
        });

        it(' 43424.121 to date then to normal', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "43424.121", "formulas": "43424.121", "style": style};

            data.rows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "2018-11-20");
            assert.equal(cell.formulas, "2018-11-20  2:54:14");
            assert.equal(cell.to_calc_num, "43424.121");
            assert.equal(cell.value, "43424.121");

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;
            data.rows.setCell(1, 1, cell, 'normal');
            args = data.tryParseToNum('input', cell, 1, 1);
            cell = data.rows.getCell(1, 1);

            assert.equal(cell.text, "43424.121");
            assert.equal(cell.formulas, "43424.121");
            assert.equal(cell.to_calc_num, "43424.121");
            assert.equal(cell.value, "43424.121");
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
            assert.equal(cell.value, "2019-01-01");
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

        it(' =INDEX({1,2;3,4},0,2) ', function () {
            let recast = new Recast('=INDEX({1,2;3,4},0,2) ');
            let error = false;
            try {
                recast.parse();
            } catch {
                error = true;
            }
            assert.equal(error, false);
        });
    });

    describe('  cell_proxy  ', () => {
        it(' diff ', function () {
            this.workbook = [];
            this.workbook.Sheets = {};
            this.workbook.Sheets[data.name] = {
                A1: {v: "苏州群尚海", f: "苏州群尚海", z: true},
                A2: {v: "上海花屿湾", f: "上海花屿湾", z: true},
                A3: {v: "苏州红树湾东侧046、049地铁", f: "苏州红树湾东侧046、049地铁", z: true},
                A4: {v: "上海龙泉棉城公馆", f: "上海龙泉棉城公馆", z: true},
                A5: {v: "常熟万科公望花园", f: "常熟万科公望花园", z: true},
                B1: {v: "苏州", f: "苏州", z: true},
                B2: {v: "上海", f: "上海", z: true},
                B3: {v: "苏州", f: "苏州", z: true},
                B4: {v: "上海", f: "上海", z: true},
                B5: {v: "常熟", f: "常熟", z: true},
                C1: {v: "苏州", f: "苏州", z: true},
                C2: {v: "苏州群尚海", f: "=PQUERY(A1:A5, B1:B5, C1, D1:D5, E1)", z: true},
                C10: {v: 67090.75, f: "=AVERAGE(D2:D5)", t: "n"},
                D1: {v: "46601", f: "46601", z: true},
                D2: {v: "79748", f: "79748", z: true},
                D3: {v: "57294", f: "57294", z: true},
                D4: {v: "87273", f: "87273", z: true},
                D5: {v: "44048", f: "44048", z: true},
                E1: {v: "46601", f: "46601", z: true},
                E2: {v: "常熟", f: "常熟", z: true},
                E4: {v: "44048", f: "44048", z: true},
            };

            let cellProxy = new CellProxy("", "", "");
            cellProxy.setOldData(deepCopy(this.workbook));
            this.workbook.Sheets[data.name]["B5"] = {
                v: "扬州",
                f: "扬州",
                z: true
            };
            cellProxy.diff = 402;
            let args = cellProxy.calc(this.workbook, data.name);

            assert.equal(args.state, true);

            assert.equal(args.data["B5"].v, "扬州");
        });

        it(' diff associated ', function () {
            this.workbook = [];
            this.workbook.Sheets = {};
            this.workbook.Sheets[data.name] = {
                A1: {v: "1", f: "1", z: true},
                A2: {v: "2", f: "2", z: true},
                A3: {v: "=average(A1:A2)", f: "=average(A1:A2)", z: true},
            };
            let refRow = new RefRow(data.settings.row, data);
            let cellProxy = new CellProxy(refRow, "", "");
            cellProxy.setOldData(deepCopy(this.workbook));
            this.workbook.Sheets[data.name]["A1"] = {
                v: "3",
                f: "3",
                z: true
            };

            let args = cellProxy.calc(this.workbook, data.name);
            assert.equal(args.state, true);
            assert.equal(args.data["A1"].v, "3");

            this.workbook.Sheets[data.name] = args.data;
            let assoc = cellProxy.associated(data.name, this.workbook);
            args.state = args.state === false ? assoc.enter : args.state;
            let tileArr = assoc.changeArr;
            assert.equal(tileArr[0], 'A1');
            assert.equal(tileArr[1], 'A3');
        });
    });

    describe('  isHave ', () => {
        it(' isHave ', function () {
            let cell = {
                "text": "abc"
            };
            assert.equal(isHave(cell.text), true);
            assert.equal(isHave(cell.formulas), false);
        });
    });

    describe('  dateDiff  ', () => {
        it(' asd/2019-01-01/... ', function () {
            let result = dateDiff('asd');
            assert.equal(result.isValid, false);

            result = dateDiff('2019-01-01');
            assert.equal(result.isValid, true);
            assert.equal(result.diff, 43466);

            result = dateDiff('2019-01-01  1:11:11');
            console.log(result)
        });
    });


    describe('  formatDate  ', () => {
        it(' 123.00/123/123.1/123.1a/123.a.as/123.121 ', function () {
            let args = formatDate('123.00');
            assert.equal(args.state, true);
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123');
            assert.equal(args.state, true);
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123.1');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:24:00');
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123.1a');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');

            args = formatDate('123.a.as');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');

            args = formatDate('123.121');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:54:14');
            assert.equal(args.minute, true);


            args = formatDate('123.121');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:54:14');

            args = formatDate('41241.12');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '2012-11-28  2:52:48');
            assert.equal(args.minute, true);

            args = formatDate('41241');
            assert.equal(args.state, true);
            assert.equal(args.date, '2012-11-28');

            args = formatDate('41241.a');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');
        });
    })
});

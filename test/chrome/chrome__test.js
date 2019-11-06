import DataProxy from "../../src/core/data_proxy";
import Sheet from "../../src/component/sheet";
import {h} from "../../src/component/element";
import {cssPrefix} from "../../src/config";
import {GetInfoFromTable} from "../../src/event/paste";
import CellRange from "../../src/core/cell_range";
import {copy} from "../../src/event/copy";
import {copyPasteTemplate} from "../template/templates";

let assert = require('assert');
describe("hexColorLuminance", function () {
    let data = new DataProxy("sheet1", {}, {});
    let rows1 = {};
    for (let i = 0; i < 10; i++) {
        rows1[i] = {
            "cells": {}
        };
        for (let j = 0; j < 10; j++) {
            rows1[i]["cells"][j] = {
                "text": i + j,
                "formulas": '=' + i+ "+" + j,
            }
        }
    }
    data.rows.setData(rows1);
    const rootEl = h('div', `${cssPrefix}`)
        .on('contextmenu', evt => evt.preventDefault());
    let sheet = new Sheet(rootEl, data);

    it("copy/paste test", function () {
        data.selector.range = new CellRange(0, 0, 2, 2);
        let args = copy.call(sheet);

        assert.equal(args.plain, '=0+0\t=0+1\t=0+2\t\n=1+0\t=1+1\t=1+2\t\n=2+0\t=2+1\t=2+2\t\n');
        data.selector.ri = 1;
        data.selector.ci = 2;
        GetInfoFromTable.call(sheet, args.html.el);
        let cell1 = data.rows.getCell(1, 2);
        let cell2 = data.rows.getCell(1, 3);
        let cell3 = data.rows.getCell(1, 4);
        assert.equal(cell1.text, "=0+0");
        assert.equal(cell1.formulas, "=0+0");
        assert.equal(cell2.text, "=0+1");
        assert.equal(cell2.formulas, "=0+1");
        assert.equal(cell3.text, "=0+2");
        assert.equal(cell3.formulas, "=0+2");

        let cell = {"text": "=A1", "formulas": "=A1"};
        copyPasteTemplate(cell, data);

        data.selector.range = new CellRange(3, 4, 12, 4, 0, 0);
        args = copy.call(sheet);
        console.log(args);
    });
});
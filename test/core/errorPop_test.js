import {describe, it} from 'mocha';
import DataProxy from "../../src/core/data_proxy";
import Recast from "../../src/core/recast";

let assert = require('assert');

describe('', () => {
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
    });

    describe(' autofilter  ', () => {

    });

    describe.only(' date  ', () => {
        it(' tryParseToNum test ', function () {
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01"};
            let args = data.tryParseToNum('input', cell, 1, 1);
            console.log(args);
        });
    });

    describe('recast', () => {
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

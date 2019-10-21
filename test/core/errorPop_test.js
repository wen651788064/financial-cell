import assert from 'assert';
import { describe, it } from 'mocha';
import {selectorCellText} from "../../src/component/sheet";
import DataProxy from "../../src/core/data_proxy";
import Sheet from "../../src/component/sheet";

describe('format', () => {
    describe('#render()', () => {
        it(' ="""  ', function() {
            console.log("...")
            this.data = new DataProxy("sheet1", {}, {});
            this.sheet = new Sheet(null, this.data);
            selectorCellText.call(this, 1, 1, { text: "=\"\"\""}, "input", "");
        });
    });
});

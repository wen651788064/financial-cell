import assert from 'assert';
import {describe, it} from 'mocha';
import {cutStr} from "../../src/component/operator";

describe('infixExprToSuffixExpr', () => {
    it('test 1 == 1', () => {
        assert.equal(1, 1);
    });

    it('test cut', () => {
        let arr = cutStr("=A1+A2+ADD(A3, A4)");
        console.log(arr);
        let a = ['A1', 'A2', 'A3', 'A4'];
        assert.equal(arr, a);
    });
});
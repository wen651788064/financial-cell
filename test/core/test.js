var {describe, it} = require("mocha");
var {infixExprToSuffixExpr} = require("x-spreadsheet-master/src/core/cell");
var assert = require('assert');
describe('infixExprToSuffixExpr', () => {
    it('should return myname:A1 score:50 when the value is CONCAT("my name:", A1, " score:", 50)', () => {
        assert.equal(infixExprToSuffixExpr('CONCAT("my name:", A1, " score:", 50)').join(''), '"my name:A1" score:50CONCAT,4');
    });
});
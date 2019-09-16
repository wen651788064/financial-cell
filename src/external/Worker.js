// Worker.js
import XLSX_CALC from "xlsx-calc"
var formulajs = require('formulajs');

const _ = require('lodash')

const obj = {foo: 'foo'}

_.has(obj, 'foo')

// // 发送数据到父线程
// self.postMessage({ foo: 'foo' })

// 响应父线程的消息
self.addEventListener('message', (event) => {
    let {workbook} = event.data;
    XLSX_CALC.import_functions(formulajs);

    XLSX_CALC(workbook);
    postMessage({data: workbook, type: 1})
});
/**
 formula:
 key
 title
 render
 */
import {tf} from '../locale/locale';
import XLSX_CALC from "xlsx-calc"

var formulajs = require('formulajs');

const baseFormulas = [
    {
        key: 'SUM',
        title: tf('formula.sum'),
        render: ary => ary.reduce((a, b) => Number(a) + Number(b), 0),
    },
    {
        key: 'AVERAGE',
        title: tf('formula.average'),
        render: ary => ary.reduce((a, b) => Number(a) + Number(b), 0) / ary.length,
    },
    {
        key: 'MAX',
        title: tf('formula.max'),
        render: ary => Math.max(...ary.map(v => Number(v))),
    },
    {
        key: 'MIN',
        title: tf('formula.min'),
        render: ary => Math.min(...ary.map(v => Number(v))),
    },
    {
        key: 'CONCAT',
        title: tf('formula.concat'),
        render: ary => ary.join(''),
    },
    {
        key: 'MD.WLAND',
        title: tf('formula.wland'),
        render: ary => ary.join(''),
    },
    {
        key: 'MD.WFR',
        title: tf('formula.wfr'),
        render: ary => ary.join(''),
    },
    {
        key: 'MD.RTD',
        title: tf('formula.rtd'),
        render: ary => ary.join(''),
    },
];

let formulas = baseFormulas;

const formulaCalc = () => {
    XLSX_CALC.import_functions(formulajs);
    let xlsx_Fx = XLSX_CALC.xlsx_Fx;
    // formulas = [];
    Object.keys(xlsx_Fx).forEach(i => {
        let args = {
            key: i,
            title: i,
            render: xlsx_Fx[i]
        };
        formulas.push(args);
    });



    return XLSX_CALC;
};

// const formulas = (formulaAry = []) => {
//   const formulaMap = {};
//   baseFormulas.concat(formulaAry).forEach((f) => {
//     formulaMap[f.key] = f;
//   });
//   return formulaMap;
// };
const formulam = {};
baseFormulas.forEach((f) => {
    formulam[f.key] = f;
});

export default {};

export {
    formulam,
    formulas,
    baseFormulas,
    formulaCalc,
};

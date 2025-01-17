import {expr2xy, xy2expr} from './alphabet';
import {look, look2} from "../config";
// import XLSX_CALC from "xlsx-calc"
// var formulajs = require('formulajs');
// Converting infix expression to a suffix expression
// src: AVERAGE(SUM(A1,A2), B1) + 50 + B20
// return: [A1, A2], SUM[, B1],AVERAGE,50,+,B20,+
const infixExprToSuffixExpr = (src) => {
    const operatorStack = [];
    const stack = [];
    let subStrs = []; // SUM, A1, B2, 50 ...
    let fnArgType = 0; // 1 => , 2 => :
    let fnArgsLen = 1; // A1,A2,A3...
    for (let i = 0; i < src.length; i += 1) {
        const c = src.charAt(i);
        // console.log('c:', c);
        if (c !== ' ') {
            if (c >= 'a' && c <= 'z') {
                subStrs.push(c.toUpperCase());
            } else if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || c === '.') {
                subStrs.push(c);
            } else if (c === '"') {
                i += 1;
                while (src.charAt(i) !== '"') {
                    subStrs.push(src.charAt(i));
                    i += 1;
                }
                stack.push(`"${subStrs.join('')}`);
                subStrs = [];
            } else {
                // console.log('subStrs:', subStrs.join(''), stack);
                if (c !== '(' && subStrs.length > 0) {
                    stack.push(subStrs.join(''));
                }
                if (c === ')') {
                    let c1 = operatorStack.pop();
                    if (fnArgType === 2) {
                        // fn argument range => A1:B5
                        try {
                            const [ex, ey] = expr2xy(stack.pop());
                            const [sx, sy] = expr2xy(stack.pop());
                            // console.log('::', sx, sy, ex, ey);
                            let rangelen = 0;
                            for (let x = sx; x <= ex; x += 1) {
                                for (let y = sy; y <= ey; y += 1) {
                                    stack.push(xy2expr(x, y));
                                    rangelen += 1;
                                }
                            }
                            stack.push([c1, rangelen]);
                        } catch (e) {
                            // console.log(e);
                        }
                    } else if (fnArgType === 1) {
                        // fn argument => A1,A2,B5
                        stack.push([c1, fnArgsLen]);
                        fnArgsLen = 1;
                    } else {
                        // console.log('c1:', c1, fnArgType, stack, operatorStack);
                        while (c1 !== '(') {
                            stack.push(c1);
                            if (operatorStack.length <= 0) break;
                            c1 = operatorStack.pop();
                        }
                    }
                    fnArgType = 0;
                } else if (c === ':') {
                    fnArgType = 2;
                } else if (c === ',') {
                    fnArgType = 1;
                    fnArgsLen += 1;
                } else if (c === '(' && subStrs.length > 0) {
                    // function
                    operatorStack.push(subStrs.join(''));
                } else {
                    // priority: */ > +-
                    // console.log(operatorStack, c, stack);
                    if (operatorStack.length > 0 && (c === '+' || c === '-')) {
                        let top = operatorStack[operatorStack.length - 1];
                        if (top !== '(') stack.push(operatorStack.pop());
                        if (top === '*' || top === '/') {
                            while (operatorStack.length > 0) {
                                top = operatorStack[operatorStack.length - 1];
                                if (top !== '(') stack.push(operatorStack.pop());
                                else break;
                            }
                        }
                    }
                    operatorStack.push(c);
                }
                subStrs = [];
            }
        }
    }
    if (subStrs.length > 0) {
        stack.push(subStrs.join(''));
    }
    while (operatorStack.length > 0) {
        stack.push(operatorStack.pop());
    }
    return stack;
};

const evalSubExpr = (subExpr, cellRender) => {
    if (!subExpr) {
        subExpr = "";
    }
    if (subExpr[0] >= '0' && subExpr[0] <= '9') {
        return Number(subExpr);
    }
    if (subExpr[0] === '"') {
        return subExpr.substring(1);
    }
    const [x, y] = expr2xy(subExpr);
    return cellRender(x, y);
};

// evaluate the suffix expression
// srcStack: <= infixExprToSufixExpr
// formulaMap: {'SUM': {}, ...}
// cellRender: (x, y) => {}
const evalSuffixExpr = (srcStack, formulaMap, cellRender, cellList) => {
    const stack = [];
    // console.log(':::::formulaMap:', formulaMap);
    for (let i = 0; i < srcStack.length; i += 1) {
        // console.log(':::>>>', srcStack[i]);
        if (srcStack[i] === '+') {
            const top = stack.pop();
            stack.push(Number(stack.pop()) + Number(top));
        } else if (srcStack[i] === '-') {
            const top = stack.pop();
            stack.push(Number(stack.pop()) - Number(top));
        } else if (srcStack[i] === '*') {
            stack.push(Number(stack.pop()) * Number(stack.pop()));
        } else if (srcStack[i] === '/') {
            const top = stack.pop();
            stack.push(Number(stack.pop()) / Number(top));
        } else if (Array.isArray(srcStack[i])) {
            const [formula, len] = srcStack[i];
            const params = [];
            for (let j = 0; j < len; j += 1) {
                params.push(stack.pop());
            }
            stack.push(formulaMap[formula].render(params.reverse()));
        } else {
            if (cellList.includes(srcStack[i])) {
                return 0;
            }
            cellList.push(srcStack[i]);
            let s = evalSubExpr(srcStack[i], cellRender)
            stack.push(evalSubExpr(srcStack[i], cellRender));
        }
        // console.log('stack:', stack);
    }
    return stack[0];
};

function evalFormula(text, rule) {
    if (typeof text !== 'string') {
        return false;
    }
    if (text.toUpperCase().indexOf(rule.toUpperCase()) == -1) {
        return false;
    }
    return true;
}

const cellRender = (data, sheetbook, y, x, src, formulaMap, getCellText, cellList = []) => {
    if (typeof src === 'undefined') {
        return "";
    }

    if (typeof src === 'string' && look.indexOf(src.split("!")[0]) != -1) {
        let len = src.length;
        if(src.split(" ")[0]) {
            len = src.split(" ")[0].length;
        }
        let a = JSON.parse(src.substring(src.indexOf("!") + 1, len));
        let s = look.indexOf(src.split("!")[0]);

        if (s === 1) {
            return a.text;
        } else if (s === 0) {
            if (a && a[0]) {
                let {name, value} = a[0];

                if (value === 0 && a[1] && a[1].value !== 0) {
                    return name;
                } else if (value === 0 && !a[1]) {
                    return name;
                }
            }
        }

        return look2;
    }

    if (src[0] === '=' && src[1] !== '=') {
        // console.log("156", sheetbook.Sheets.Sheet1[xy2expr(x, y)], xy2expr(x, y))
        if (evalFormula(src.substring(1), "wland") || evalFormula(src.substring(1), "wfr") || evalFormula(src.substring(1), "rtd")
            || evalFormula(src.substring(1), "city")) {
            // let {date_formula} = data.settings;=MD.RTD("sina", "162411", "now")
            // date_formula.wland(date_formula, data);
            return src.toUpperCase();
        } else if (src.substring(1) && sheetbook && sheetbook.Sheets && sheetbook.Sheets[data.name] && sheetbook.Sheets[data.name][xy2expr(x, y)]) {
            // sheetbook.Sheets.Sheet1[xy2expr(x, y)].f = src.substring(1).toUpperCase();
            // XLSX_CALC.import_functions(formulajs);
            // XLSX_CALC(sheetbook);

            if ((sheetbook.Sheets[data.name][xy2expr(x, y)].f && sheetbook.Sheets[data.name][xy2expr(x, y)].f.search(/\((\+|\-|\*|\/)/) != -1) || sheetbook.Sheets[data.name][xy2expr(x, y)].v == undefined || sheetbook.Sheets[data.name][xy2expr(x, y)].v === "") {
                return "#ERROR!";
            }
            sheetbook.Sheets[data.name][xy2expr(x, y)].v = sheetbook.Sheets[data.name][xy2expr(x, y)].v + "";

            // let value = sheetbook.Sheets.Sheet1[xy2expr(x, y)].v ? sheetbook.Sheets.Sheet1[xy2expr(x, y)].v : "NaN";
            return sheetbook.Sheets[data.name][xy2expr(x, y)].w ? sheetbook.Sheets[data.name][xy2expr(x, y)].w : sheetbook.Sheets[data.name][xy2expr(x, y)].v.replace(/'/g, "\"");
        }
        // const stack = infixExprToSuffixExpr(src.substring(1));
        // if (stack.length <= 0) return src;

        return src;
    }
    return src;
};

export default {
    render: cellRender,
};
export {
    infixExprToSuffixExpr,
};

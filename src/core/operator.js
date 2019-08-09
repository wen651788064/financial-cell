const operator = [
    "+", "-", "*", "/", "&", "^", "(", ",", "=", " ", " "
];

const operator2 = [
    "+", "-", "*", "/", "&", "^", "(", ",", "=", " ", ")"
];


const operation = (s) => {
    for (let i = 0; i < operator.length; i++) {
        if (operator[i] == s) {
            return 1;
        }
    }
    return 0;
};

const operation2 = (s) => {
    for (let i = 0; i < operator2.length; i++) {
        if (operator2[i] == s) {
            return 1;
        }
    }
    return 0;
};

const cutStr = (str) => {
    if (str[0] !== "=") {
        return [];
    }
    str = str.replace(/\s/g, "");
    let arr = str.split(/([(-\/,+*=^&])/);
    let express = [];
    arr.filter(i => {
        if (i.search(/^[A-Z]+\d+$/) != -1 || i.search(/^\$[A-Z]+\$\d+$/) != -1)
            express.push(i);
    });
    return express;
};

const cutFirst = (str) => {
    let s = "";
    for(let i = 0; i < str.length; i++) {
        if(operation2(str[i])) {
            return s;
        }
        s += str[i];
    }
    return s;
};

const cuttingByPos = (str, pos) => {
    let value = "";
    let end = false;
    for (let i = pos - 1; i > 0 && end == false; i--) {
        end = operation(str[i]) ? true : false;
        if (end == false) {
            value += str[i];
        }
    }
    value = value.replace(/\s/g, "");
    value = value.split('').reverse().join('');
    return value;
};


const cutting = (str) => {
    let express = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i]) {
            express.push(str[i]);
        }
    }
    return express;
};


const helpFormula = {
    "ADD": {
        "title": [
            {
                "name": "ADD(",
                "editor": false
            },
            {

                "name": "数值1",
                "editor": false
            },
            {

                "name": "，",
                "editor": false
            },
            {
                "name": "数值2",
                "editor": false
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "example": [
            {
                "name": "ADD(",
                "editor": false
            },
            {

                "name": "2",
                "editor": false
            },
            {

                "name": "，",
                "editor": false
            },
            {
                "name": "3",
                "editor": false
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "content": {
            "摘要": "返回两个数值之和。相当于 + 运算符。",
            "数值1": "第一个加数。",
            "数值2": "第二个加数。",
        }
    },
    "SUM": {
        "title": [
            {
                "name": "SUM(",
                "editor": false
            },
            {
                "name": "值一",
                "editor": false
            },
            {

                "name": "，",
                "editor": false
            },
            {
                "name": "[数值2, ...]",
                "editor": true,
                "index": 3
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "example": [
            {
                "name": "SUM(",
                "editor": false
            },
            {
                "name": "A2:A100",
                "editor": false
            },
            {

                "name": "，",
                "editor": false
            },
            {
                "name": "101",
                "editor": true,
                "index": 3
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "content": {
            "摘要": "返回一组数值和/或单元格的总和。",
            "值1": "要相加的第一个数值或范围。",
            "数值2… - [可选] 可重复": "要与“数值1”相加的其他数值或范围。",
        }
    },
    "PMT": {
        "title": [
            {
                "name": "PMT(",
                "editor": false
            },
            {
                "name": "rate",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "nper",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "pv",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "fv",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "type",
                "editor": false
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "example": [
            {
                "name": "PMT(",
                "editor": false
            },
            {
                "name": "0.1",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "120",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "1000",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "0",
                "editor": false
            },
            {
                "name": ",",
                "editor": false
            },
            {
                "name": "0",
                "editor": false
            },
            {
                "name": ")",
                "editor": false
            }
        ],
        "content": {             // 这部分是内容说明。
            "摘要": "基于固定利率及等额分期付款方式，返回贷款的每期付款额。",
            "rate": "贷款利率。",
            "nper": "该项贷款的付款期数。",
            "pv": "现值，或一系列未来付款的当前值的累积和，也称为本金。",
            "fv": "为未来值，或在最后一次付款后希望得到的现金余额，如果省略 fv，则假设其值为零，也就是一笔贷款的未来值为零。",
            "type": "指定各期的付款时间是在期初还是期末。0或者省略为期初，1为期末",
        }
    },
};

const isAbsoluteValue = (str) => {
    if (str.search(/^\$[A-Z]+\$\d+$/) != -1)
        return true;
    return false;
};

const cutting2 = (str) => {
    let arr = str.split(/([(-\/,+*\s=^&])/);

    let color = 0;
    let express = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]) {
            express.push(arr[i]);
        }
    }

    let colors = [];
    for (let i = 0; i < express.length; i++) {
        if (express[i].search(/^[A-Z]+\d+$/) != -1 || express[i].search(/^\$[A-Z]+\$\d+$/) != -1) {
            for (let i2 = 0; i2 < express[i].length; i2++)
                colors.push({
                    "code": color,
                    "data": express[i][i2],
                });
            color = color + 1;
        } else {
            for (let i2 = 0; i2 < express[i].length; i2++)
                colors.push({
                    "code": -1,
                    "data": express[i][i2],
                });
        }
    }

    return colors;
};

export {
    operator,
    operation,
    cutStr,
    cutting,
    cutting2,
    isAbsoluteValue,
    cuttingByPos,
    helpFormula,
    cutFirst,
}
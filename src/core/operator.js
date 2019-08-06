const operator = [
    "+", "-", "*", "/", "&", "^", "(", ",", "=", " "
];


const operation = (s) => {
    for (let i = 0; i < operator.length; i++) {
        if (operator[i] == s) {
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

const cuttingByPos = (str, pos) => {
    let value = "";
    let end = false;
    for (let i = pos - 1; i > 0 && end == false; i--) {
        end = operation(str[i]) ? true : false;
        if (end == false) {
            value += str[i];
        }
    }
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
    }
};

const isAbsoluteValue = (str) => {
    if (str.search(/^\$[A-Z]+\$\d+$/) != -1)
        return true;
    return false;
};

const cutting2 = (str) => {
    let arr = str.split(/([(-\/,+* =^&])/);

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
}
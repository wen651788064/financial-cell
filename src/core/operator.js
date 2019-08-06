const operator = [
    "+", "-", "*", "/", "&", "^", "(", ",", "="
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

const cutting = (str) => {
    // let arr = str.split(/([(-\/,+*=^&])/);
    //
    let express = [];
    // for (let i = 0; i < arr.length; i++) {
    //     if (arr[i]) {
    //         express.push(arr[i]);
    //     }
    // }
    for (let i = 0; i < str.length; i++) {
        if (str[i]) {
            express.push(str[i]);
        }
    }
    return express;
};

const isAbsoluteValue = (str) => {
    if(str.search(/^\$[A-Z]+\$\d+$/) != -1)
        return true;
    return false;
};

const cutting2 = (str) => {
    let arr = str.split(/([(-\/,+*=^&])/);

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
}
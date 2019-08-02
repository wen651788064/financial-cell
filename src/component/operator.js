const operator = [
    "+", "-", "*", "/", "&", "^", "(", "," ,"="
];

const operation = (s) => {
    for(let i = 0; i < operator.length; i++) {
        if(operator[i] == s) {
            return 1;
        }
    }
    return 0;
};

const cutStr = (str) => {
    str = str.replace(/\s/g,"");
    let arr = str.split(/([(-\/,=^&])/);
    let express = [];
    arr.filter(i => {
        if(i.search(/^[A-Za-z]+\d+$/) != -1)
            express.push(i);
    });
    return express;
};

const merge = function() {
    return Array.prototype.concat.apply([], arguments)
};

export {
    operator,
    operation,
    cutStr,
    merge,
}
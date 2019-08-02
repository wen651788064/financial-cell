const operator = [
    "+", "-", "*", "/", "&", "^", "(", ","
];

const operation = (s) => {
    for(let i = 0; i < operator.length; i++) {
        if(operator[i] == s) {
            return 1;
        }
    }
    return 0;
};

export {
    operator,
    operation
}
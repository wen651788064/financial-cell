const recast = require("recast");

const colon = "$$$";
const fqm = '"\\"\\""';

export default class Recast {
    constructor(formula) {
        this.formula = formula;
        this.ast = "";
    }

    preProcess() {
        this.formula = this.formula.replace(/=/g, '');
        this.formula = this.formula.replace(/:/g, colon);
        this.formula = this.formula.replace(/""""/g, fqm);
    }

    parse() {
        this.preProcess();
        let {formula} = this;
        this.ast = recast.parse(formula);
    }

    ignoreSpace() {

    }
}
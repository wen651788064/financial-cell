const recast = require("recast");

export default class Recast {
    constructor(formula) {
        this.formula = formula;
        this.ast = "";
    }

    preProcess() {
        this.formula = this.formula.replace(/=/g, '');
        this.formula = this.formula.replace(/:/g, '$$$');
    }

    parse() {
        this.preProcess();
        let {formula} = this;
        this.ast = recast.parse(formula);
    }

    ignoreSpace() {

    }
}
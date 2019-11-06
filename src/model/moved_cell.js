import { expr2xy } from '../core/alphabet';
import { isHave } from '../core/helper';

export default class MovedCell {
  constructor(expr, cell, ri, ci) {
    this.expr = expr;
    this.cell = cell;
    this.ri = ri;
    this.ci = ci;
  }

  each(cb) {
    let {cell} = this;
    if(isHave(cell.depend) === false) {
      return;
    }
    for(let i = 0; i < cell.depend.length; i++) {
      let expr = cell.depend[i];
      let [ci, ri] = expr2xy(expr);
      cb(ri, ci);
    }
  }
}

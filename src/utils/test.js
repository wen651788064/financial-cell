import {isHave} from "../core/helper";

export function testValid() {
    if(isHave(this.valid)) {
        this.valid.assert();
    }
}
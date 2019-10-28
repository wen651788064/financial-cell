import {offsetTop} from "../config";
import {positionAngle} from "../core/operator";

export default class RectProxy {
    constructor(rect) {
        this.rect = rect;
    }

    isLocInside(x, y) {
        let {rect} = this;

        if (x < rect.width + rect.left && x > rect.left && y - offsetTop > rect.top && y - offsetTop < rect.top + rect.height) {
            return true;
        }
        return false;
    }

    getUpDownLeftRight(targetx, targety, clientX, clientY) {
        let {rect} = this;

        let pos = 0;
        if (targetx < rect.width + rect.left && targetx > rect.left) {
            if (targety > rect.top + rect.height + offsetTop) {
                pos = 1;
            } else if (targety - offsetTop < rect.top) {
                pos = 4;
            }

            if (pos === 1 && targety < 0) {
                pos = 4;
            } else if (document.body.clientHeight < targety && pos === 4) {
                pos = 1;
            }
        } else if (targety - (rect.height - rect.top - offsetTop) > 0 && (rect.height + rect.top + offsetTop) > targety) {
            if (targetx > rect.width + rect.left) {
                pos = 3;
            } else if (targetx < rect.left) {
                pos = 2;
            }
        }

        if (pos === 0) {
            pos = positionAngle(clientX, targetx, clientY, targety);
        }

        return pos;
    }
}
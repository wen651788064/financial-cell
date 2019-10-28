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

    getUpDownLeftRight(e, clientX, clientY) {
        let {rect} = this;

        let pos = 0;
        if (e.clientX < rect.width + rect.left && e.clientX > rect.left) {
            if (e.clientY > rect.top + rect.height + offsetTop) {
                pos = 1;
            } else if (e.clientY - offsetTop < rect.top) {
                pos = 4;
            }

            if (pos === 1 && e.clientY < 0) {
                pos = 4;
            } else if (document.body.clientHeight < e.clientY && pos === 4) {
                pos = 1;
            }
        } else if (e.clientY - (rect.height - rect.top - offsetTop) > 0 && (rect.height + rect.top + offsetTop) > e.clientY) {
            if (e.clientX > rect.width + rect.left) {
                pos = 3;
            } else if (e.clientX < rect.left) {
                pos = 2;
            }
        }

        if (pos === 0) {
            pos = positionAngle(clientX, e.clientX, clientY, e.clientY);
        }

        return pos;
    }
}
import {splitStr} from "../core/operator";

class ApplicationSample {
    constructor(alias, cb) {
        this._ = {};
        this.alias = alias;
        this.cb = cb;
    }

    setData() {
        this.cb();
    }
}

export default class ApplicationFactory {
    constructor(cb) {
        this.factory = [];
        this.cb = cb;
    }

    createSample(text) {
        let sample = new ApplicationSample(text, this.cb);
        this.factory.push(sample);
    }

    push(text) {
        let arr = splitStr(text);
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            let str = arr[i];
            let _exec = /[0-9a-zA-Z]+![A-Za-z]+\d+/.exec(str);
            if (_exec && _exec[0]) {
                result.push(_exec[0]);
            }
        }

        if (result.length <= 0)
            return;

        let {factory} = this;
        let needPush = [];
        for (let i = 0; i < result.length; i++) {
            let r = result[i];
            let enter = false;

            for (let j = 0; enter == false && j < factory.length; j++) {
                let f = factory[j];

                if (r.split("!")[0] == f.alias) {
                    enter = true;
                }
            }

            if (!enter) {
                needPush.push(r.split("!")[0]);
            }
        }
        if (needPush.length > 0) {
            this.createSample(...needPush);
        }
    }
}
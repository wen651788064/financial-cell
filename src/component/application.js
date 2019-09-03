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
        for (let str in arr) {
            let _exec = /[0-9a-zA-Z]+![A-Za-z]+\d+/.exec(str);
            if (_exec && _exec[0]) {
                result.push(_exec[0]);
            }
        }

        if(result.length <= 0)
            return;

        let {factory} = this;
        let needPush = [];
        for(let r in result) {
            let enter = false;

            for(let f in factory) {
                if(r == f.alias) {
                    enter = true;
                }
            }

            if(!enter) {
                needPush.push(r);
            }
        }
        this.createSample(...needPush);
    }
}
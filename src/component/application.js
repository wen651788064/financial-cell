import {splitStr} from "../core/operator";

class ApplicationSample {
    constructor(alias) {
        this.alias = alias;
    }
}

export default class ApplicationFactory {
    constructor(cb) {
        this.factory = [];
        this.cb = cb;
        this._ = [];
        this._calc = [];
    }

    createSample(text) {
        let sample = new ApplicationSample(text, this.cb);
        this.factory.push(sample);
    }

    async getSamples(sheet) {
        let res = await this.setData();
        this._calc = res.data.calc;
        this._calc.push(sheet);
        let data = {};
        Object.keys(this._calc).forEach(i => {
            Object.keys(this._calc[i]).forEach(is => {
                data[is] = this._calc[i][is];
            });
        });
        return data;
    }

    async push(text) {
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

    setData() {
        let arr = [];
        for (let i = 0; i < this.factory.length; i++) {
            arr.push(this.factory[i].alias);
        }

        const {cb} = this;
        let ress = cb.getData(cb.axios, arr, cb.user_id);
        return ress;
    }
}
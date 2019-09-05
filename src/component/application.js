import {splitStr} from "../core/operator";
import helper from "../core/helper";

class ApplicationSample {
    constructor(alias) {
        this.alias = alias;
    }
}

export default class ApplicationFactory {
    constructor(cb, name) {
        this.factory = [];
        this.cb = cb;
        this._ = [];
        this.name = name;
        this._calc = [];
        this._calc2 = [];
        this.lock = false;
        this.data = [];
    }

    createSample(text) {
        let sample = new ApplicationSample(text, this.cb);
        this.factory.push(sample);
    }

    calcDiff(alias, newData) {

        newData = newData[alias];
        let oldData = this.data[alias];
        console.log();
    }

    async getSamples(sheet) {
        if( this.lock) {
            this.lock = false;
            let res = await this.setData();
            this._calc = res.data.calc;
        }
        let _calc2 = helper.cloneDeep(this._calc);

        _calc2.push(sheet);
        let data = {};
        Object.keys(_calc2).forEach(i => {
            Object.keys(_calc2[i]).forEach(is => {
                data[is] = _calc2[i][is];
            });
        });

        return data;
    }

    async push(text) {
        if(!this.cb || !this.cb.getData)
            return;
        let arr = splitStr(text);
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            let str = arr[i].replace(/\$/g, '');
            let _exec = /[\u4E00-\u9FA50-9a-zA-Z]+![A-Za-z]+\d+/.exec(str);
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
            this.lock = true;
        }
    }

    async setData() {
        let arr = [];
        for (let i = 0; i < this.factory.length; i++) {
            arr.push(this.factory[i].alias);
        }

        const {cb} = this;
        let ress = await cb.getData(cb.axios, arr, cb.user_id, this.name);
        return ress;
    }
}
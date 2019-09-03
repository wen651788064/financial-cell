class ApplicationSample {
    constructor(alias, path) {
        this._ = {};
        this.alias = alias;
        this.path = path;
    }

    setData() {

    }
}

export default class ApplicationFactory {
    constructor() {
        this.factory = [];
    }

    createSample(text) {

        let sample = new ApplicationSample();
        this.factory.push(sample);
    }

    find() {

    }
}
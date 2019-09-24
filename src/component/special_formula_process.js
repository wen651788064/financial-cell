import {look} from "../config";

function isSpecialWebsite(text) {
    if(look.indexOf(text.split("!")[0]) === 1) {
        return {
            "state": true,
            "text": JSON.parse(text.split("!")[1]).url,
        };
    }
    return {
        "state": false,
        "text": "",
    };
}

export {
    isSpecialWebsite
}
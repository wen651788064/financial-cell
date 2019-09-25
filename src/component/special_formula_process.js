import {look} from "../config";

let v1 = "HYPERLINK";
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

function specialWebsiteValue(text, formula) {
    if( look.indexOf(text.split("!")[0]) === 1 && formula.toUpperCase().indexOf(v1) === -1) {
        let arr = text.split(" ");
        let s = "";
        if(arr.length >= 1) {
            text = arr[0];
            for(let i = 1; i < arr.length; i++) {
                s += arr[i];
            }
        }
        return {
            "state": true,
            "text": JSON.parse(text.split("!")[1]).text + s,
        };
    }
    return {
        "state": false,
        "text": "",
    };
}

export {
    isSpecialWebsite,
    specialWebsiteValue,
}
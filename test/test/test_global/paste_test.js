import DataProxy from "../../../src/core/data_proxy";

describe('paste', () => {
    it(' =D4 ', function() {
        let dom = parseToDOM('<table class=""><tbody class=""><tr class=""><td class=""><tt class="" ri="9" ci="3">=D1</tt></td></tr></tbody></table>');
        let d = new DataProxy("sheet1", {}, {});
        debugger
        console.log(d);
    });
});


function parseToDOM(str) {
    var div = document.createElement("div");
    if (typeof str == "string")
        div.innerHTML = str;
    return div.childNodes;
}
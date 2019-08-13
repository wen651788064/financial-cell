import {h} from "../component/element";

function mountCopy(event) {
    console.log(this);
    event.preventDefault();
    let args = {
        plain: "",
        html: h("table", ""),
    };
    let {clipboard, rows, styles} = this.data;
    let {sri, eri, sci, eci} = clipboard.range;
    let tbody = h('tbody', '');
    for (let i = sri; i <= eri; i += 1) {
        let tr = h('tr', '');
        for (let j = sci; j <= eci; j += 1) {
            let td = h('td', '');
            if (rows._[i] && rows._[i].cells && rows._[i].cells[j]) {
                args.plain += rows._[i].cells[j].text;
                if (rows._[i].cells[j] && styles[rows._[i].cells[j].style]) {
                    td.css('color', styles[rows._[i].cells[j].style].color);
                }
                td.html(rows._[i].cells[j].text);
                args.plain += "\t";
            } else {
                args.plain += "\t";
            }
            tr.child(td);
        }

        tbody.child(tr);
        args.plain += "\n";
    }
    args.html.child(tbody);

    console.log(args.html.el,  parseDom(args.html.el));

    if (event.clipboardData) {
        console.log(parseDom(args.html.el));
        event.clipboardData.setData("text/html", parseDom(args.html.el));
        event.clipboardData.setData("text/plain", args.plain);
    }
}

function parseDom(node) {
    let tmpNode = document.createElement("div");
    tmpNode.appendChild(node.cloneNode(true));
    let str = tmpNode.innerHTML;

    return str;
};

export {
    mountCopy
}
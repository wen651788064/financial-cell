import {h} from "../component/element";

function mountCopy(event) {
    event.preventDefault();
    if (this.direction) {
        // console.log(parseDom(getChooseImg.call(this).img2), 6);
        if (event.clipboardData) {
            event.clipboardData.setData("text/html", parseDom(getChooseImg.call(this).img2));
            event.clipboardData.setData("text/plain", "");
        }
        return;
    }


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
                if (rows._[i].cells[j] && styles[rows._[i].cells[j].style]) {
                    td.css('color', styles[rows._[i].cells[j].style].color);
                    if (styles[rows._[i].cells[j].style].font.bold) {
                        let bold = styles[rows._[i].cells[j].style].font.bold ? '900' : '';
                        td.css('font-weight', bold);
                    }
                    td.css('background', styles[rows._[i].cells[j].style].bgcolor);
                }
                let text = rows._[i].cells[j].text.replace(/ /g, "");
                td.html(text);
                args.plain += text;
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

    console.log(args.html.el, parseDom(args.html.el));

    if (event.clipboardData) {
        console.log(parseDom(args.html.el));
        event.clipboardData.setData("text/html", parseDom(args.html.el));
        event.clipboardData.setData("text/plain", args.plain);
    }
}

function getChooseImg() {
    let {pasteDirectionsArr} = this;

    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
        for (let i = 0; i < pasteDirectionsArr.length; i++) {
            if (pasteDirectionsArr[i].state === true) {
                return pasteDirectionsArr[i];
            }
        }
    }
    return null;
}

function parseDom(node) {
    let tmpNode = document.createElement("div");
    tmpNode.appendChild(node.cloneNode(true));
    let str = tmpNode.innerHTML;

    return str;
};

export {
    mountCopy,
    getChooseImg,
}
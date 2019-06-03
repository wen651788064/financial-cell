import {tf} from '../locale/locale';

const formatStringRender = v => v;

const formatNumberRender = (v) => {
    //

    if (/^(-?\d*.?\d*)$/.test(v)) {
        const v1 = Number(v).toFixed(2).toString();
        const [first, ...parts] = v1.split('\\.');
        console.log(first.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'), "7.");
        return first.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }

    return v;
};

const baseFormats = [
    {
        key: 'normal',
        title: tf('format.normal'),
        type: 'string',
        render: formatStringRender,
    },
    {
        key: 'text',
        title: tf('format.text'),
        type: 'string',
        render: formatStringRender,
    },
    {
        key: 'number',
        title: tf('format.number'),
        type: 'number',
        label: '1,000.12',
        render: formatNumberRender,
    },
    {
        key: 'percent',
        title: tf('format.percent'),
        type: 'number',
        label: '10.12%',
        render: v => {
            let a = multiply(v, 100);
            let a_s = a + "";
            return `${a_s}%`
        },
    },
    {
        key: 'rmb',
        title: tf('format.rmb'),
        type: 'number',
        label: '￥10.00',
        render: v => `￥${formatNumberRender(v)}`,
    },
    {
        key: 'usd',
        title: tf('format.usd'),
        type: 'number',
        label: '$10.00',
        render: v => `$${formatNumberRender(v)}`,
    },
    {
        key: 'date',
        title: tf('format.date'),
        type: 'date',
        label: '26/09/2008',
        render: formatStringRender,
    },
    {
        key: 'time',
        title: tf('format.time'),
        type: 'date',
        label: '15:59:00',
        render: formatStringRender,
    },
    {
        key: 'datetime',
        title: tf('format.datetime'),
        type: 'date',
        label: '26/09/2008 15:59:00',
        render: formatStringRender,
    },
    {
        key: 'duration',
        title: tf('format.duration'),
        type: 'date',
        label: '24:01:00',
        render: formatStringRender,
    },
];

function isInteger(obj) {
    return Math.floor(obj) === obj
}


function add(a, b, digits) {
    return operation(a, b, digits, 'add')
}

function subtract(a, b, digits) {
    return operation(a, b, digits, 'subtract')
}

export function multiply(a, b, digits) {
    return operation(a, b, digits, 'multiply')
}

function divide(a, b, digits) {
    return operation(a, b, digits, 'divide')
}

/*
 * 将一个浮点数转成整数，返回整数和倍数。如 3.14 >> 314，倍数是 100
 * @param floatNum {number} 小数
 * @return {object}
 *   {times:100, num: 314}
 */
function toInteger(floatNum) {
    var ret = {times: 1, num: 0}
    var isNegative = floatNum < 0
    if (isInteger(floatNum)) {
        ret.num = floatNum
        return ret
    }
    var strfi = floatNum + ''
    var dotPos = strfi.indexOf('.')
    var len = strfi.substr(dotPos + 1).length
    var times = Math.pow(10, len)
    var intNum = parseInt(Math.abs(floatNum) * times + 0.5, 10)
    ret.times = times
    if (isNegative) {
        intNum = -intNum
    }
    ret.num = intNum
    return ret
}

function operation(a, b, digits, op) {
    var o1 = toInteger(a)
    var o2 = toInteger(b)
    var n1 = o1.num
    var n2 = o2.num
    var t1 = o1.times
    var t2 = o2.times
    var max = t1 > t2 ? t1 : t2
    var result = null
    switch (op) {
        case 'add':
            if (t1 === t2) { // 两个小数位数相同
                result = n1 + n2
            } else if (t1 > t2) { // o1 小数位 大于 o2
                result = n1 + n2 * (t1 / t2)
            } else { // o1 小数位 小于 o2
                result = n1 * (t2 / t1) + n2
            }
            return result / max
        case 'subtract':
            if (t1 === t2) {
                result = n1 - n2
            } else if (t1 > t2) {
                result = n1 - n2 * (t1 / t2)
            } else {
                result = n1 * (t2 / t1) - n2
            }
            return result / max
        case 'multiply':
            result = (n1 * n2) / (t1 * t2)
            return result
        case 'divide':
            result = (n1 / n2) * (t2 / t1)
            return result
    }
}

// const formats = (ary = []) => {
//   const map = {};
//   baseFormats.concat(ary).forEach((f) => {
//     map[f.key] = f;
//   });
//   return map;
// };
const formatm = {};
baseFormats.forEach((f) => {
    formatm[f.key] = f;
});

export default {};
export {
    formatm,
    baseFormats,
};

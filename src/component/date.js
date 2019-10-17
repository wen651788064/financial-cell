import dayjs from 'dayjs'
import {dateRule, str2Re} from "../core/re";

export function formatDate(numb, format) {
    const time = new Date((numb - 1) * 24 * 3600000 + 1);
    time.setYear(time.getFullYear() - 70);
    const year = time.getFullYear() + '';
    const month = time.getMonth() + 1 + '';
    const date = time.getDate() - 1 + '';
    if (format && format.length === 1) {
        return year + format + month + format + date;
    }
    return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date);
}

export function dateDiff(date) {
    // console.log(dayjs('2019-01').format('YYYY-MM-DD'));
    // console.log(dayjs('2019/01').format('YYYY-MM-DD'));
    // console.log(dayjs('2019').format('YYYY-MM-DD'));
    // console.log(dayjs('2019sa').format('YYYY-MM-DD'));
    let valid = false;

    for (let i = 0; valid === false && i < dateRule.length; i++) {
        try {
            valid = str2Re(dateRule[i]).test(date);
        } catch (e) {
            console.log(e);
        }
    }

    if (valid === false) {
        return {
            "isValid": false,
        };
    } else {
        return {
            "diff": dayjs(date).diff(dayjs('1900-01-01'), 'day') + 2,
            "isValid": true,
        }
    }
}
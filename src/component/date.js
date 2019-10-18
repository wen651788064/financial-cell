import dayjs from 'dayjs'
import {datePattern, str2Re} from "../core/re";

export function formatDate(diff) {
    let date = dayjs('1900-01-01').add(diff, 'day').subtract(2, 'day').format('YYYY-MM-DD');

    return {
        "state": date === 'Invalid Date' ? false : true,
        "date": date,
    }
}

export function cellDate() {

}

export function dateDiff(date) {
    // console.log(dayjs('2019-01').format('YYYY-MM-DD'));
    // console.log(dayjs('2019/01').format('YYYY-MM-DD'));
    // console.log(dayjs('2019').format('YYYY-MM-DD'));
    // console.log(dayjs('2019sa').format('YYYY-MM-DD'));
    let valid = false;

    for (let i = 0; valid === false && i < datePattern.length; i++) {
        valid = str2Re(datePattern[i]).test(date);
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
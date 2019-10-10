export const logicOperator = "([(-\\/,+*，=^&])";
export const blankOperator = "(^\\s*)|(\\s*$)";
export const letterOperator = "^[A-Z]+\\d+$";
export const letterOperatorWithDollor = "^\\$[A-Z]+\\$\\d+$";
export const letterAndLetterOperator = "^[A-Za-z]+\\d+:[A-Za-z]+\\d+$";
export const letterOperatorWithDollorEnd = "^[A-Z]+\\$\\d+$";
export const letterOperatorWithDollorPrex = "^\\$[A-Z]+\\d+$";

export function str2Re(str) {
    let re = new RegExp(str, 'g');

    return re;
}
export const isMinus = (text) => {
    if(isNaN(text)) {
        return false;
    } else if(x == "") {
        return false;
    }

    if(parseInt(text) > 0)
        return false;

    return true;
};
export function simulateMouseEvent(typeArg, props = {
    cancelable: true,
    bubble: true,
    view: window
}) {
    return new MouseEvent(typeArg, props);
}
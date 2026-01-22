import type { MouseEvent } from "react";
import type { MouseOrTouchEvent } from "../types/frontendTypes";

// Determines if the browser supprots passive events
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
    const options: AddEventListenerOptions = {
        get passive() {
            passiveSupported = true;
            return false;
        }
    };
    const eventHandler = () => { };
    window.addEventListener("click", eventHandler, options);
    window.removeEventListener("click", eventHandler);
} catch {
    passiveSupported = false;
}

export default function makePassiveEventOption(passive?: boolean): AddEventListenerOptions | boolean | undefined {
    return passiveSupported ? { passive } : passive;
}

export const isMouseEvent = (e: MouseOrTouchEvent) => {
    return (e as MouseEvent).button !== undefined;
}
export const isPrimaryMouseButton = (e: MouseEvent) => {
    return e.buttons === 1;
}
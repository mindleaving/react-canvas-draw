import type { MouseEvent, Touch, TouchEvent } from "react";
import type { ClientPoint, ICoordinateSystem, IStateMachineState, MouseOrTouchEvent } from "../types/frontendTypes";

export const TOUCH_SLOP = 10;
export const PINCH_TIMEOUT_MS = 250;
export const SUPPRESS_SCROLL = (e: WheelEvent): IStateMachineState => {
    // No zooming while drawing, but we'll cancel the scroll event.
    e.preventDefault();
    return this!;
};

export function clientPointFromEvent(e: MouseOrTouchEvent | Touch | WheelEvent): ClientPoint {
    // use cursor pos as default
    const mouseEvent = e as MouseEvent;
    let clientX = mouseEvent.clientX;
    let clientY = mouseEvent.clientY;

    // use first touch if available
    const touchEvent = e as TouchEvent;
    if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
        clientX = touchEvent.changedTouches[0].clientX;
        clientY = touchEvent.changedTouches[0].clientY;
    }

    return { clientX, clientY };
}

export function viewPointFromEvent(coordSystem: ICoordinateSystem, e: MouseOrTouchEvent) {
    return coordSystem.clientPointToViewPoint(clientPointFromEvent(e));
}

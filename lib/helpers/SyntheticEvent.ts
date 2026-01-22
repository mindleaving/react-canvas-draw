import type { ClientPoint } from "../types/frontendTypes";

export class SyntheticEvent {
    clientX: number;
    clientY: number;
    touches: { clientX: number, clientY: number }[];

    constructor({ clientX, clientY }: ClientPoint) {
        this.clientX = clientX;
        this.clientY = clientY;
        this.touches = [{ clientX, clientY }];
    }

    preventDefault = () => { };
}
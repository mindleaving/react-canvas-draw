import type { Point } from "lazy-brush";
import type { IStateMachineState, ClientPoint, MouseOrTouchEvent, CanvasDrawTools, IOngoingDrawing } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL, clientPointFromEvent } from "../stateMachineHelpers";
import { DefaultState } from "./DefaultState";

/**
 * This state is active as long as the user is panning the image. This state is
 * retained until the pan ceases.
 */
export class PanState implements IStateMachineState {
    dragStart?: ClientPoint;
    panStart?: Point;
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.drawing = drawing;
    }

    handleMouseWheel = SUPPRESS_SCROLL.bind(this);

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        this.dragStart = clientPointFromEvent(e);
        this.panStart = { x: tools.coordinateSystem.x, y: tools.coordinateSystem.y };

        return this;
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();
        if(!this.dragStart || !this.panStart) {
            throw new Error("Cannot handle draw move in PanState. handleDrawStart was not called.");
        }

        const { clientX, clientY } = clientPointFromEvent(e);
        const dx = clientX - this.dragStart!.clientX;
        const dy = clientY - this.dragStart!.clientY;
        tools.coordinateSystem.setView({ x: this.panStart!.x + dx, y: this.panStart!.y + dy });

        return this;
    };

    handleDrawEnd = (): IStateMachineState => new DefaultState(this.drawing);
}
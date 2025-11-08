import type { TouchEvent } from "react";
import type { CanvasDrawTools, IOngoingDrawing, IStateMachineState, MouseOrTouchEvent } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL, viewPointFromEvent } from "../stateMachineHelpers";
import { DefaultState } from "./DefaultState";
import { clampPointToDocument } from "../pointHelpers";

/**
 * This state is active when the user is drawing.
 */
export class DrawingState implements IStateMachineState {
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.drawing = drawing;
    }

    handleMouseWheel = SUPPRESS_SCROLL.bind(this);

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        const touchEvent = e as TouchEvent;
        if (touchEvent.touches && touchEvent.touches.length) {
            // on touch, set catenary position to touch pos
            const { x, y } = viewPointFromEvent(tools.coordinateSystem, e);
            tools.lazyBrush.update({ x, y }, { both: true });
        }

        return this.handleDrawMove(e, tools);
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        const { x, y } = viewPointFromEvent(tools.coordinateSystem, e);
        tools.lazyBrush.update({ x, y });

        const clampedPoint = clampPointToDocument(
            tools.lazyBrush.brush.toObject(), 
            this.drawing.canvasSize.width, 
            this.drawing.canvasSize.height,
            tools.drawOptions
        );
        this.drawing.addToLineInProgress(clampedPoint, tools.drawOptions);

        return this;
    };

    handleDrawEnd = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        // Draw to this end pos
        this.handleDrawMove(e, tools);
        this.drawing.finishLineInProgress();

        return new DefaultState(this.drawing);
    };
}
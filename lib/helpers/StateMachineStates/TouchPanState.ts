import type { TouchEvent } from "react";
import type { IStateMachineState, MouseOrTouchEvent, CanvasDrawTools, IOngoingDrawing } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL } from "../stateMachineHelpers";
import { DefaultState } from "./DefaultState";
import type { ScaleOrPanState } from "./ScaleOrPanState";

/**
 * The user is actively using touch gestures to pan the image.
 */
export class TouchPanState implements IStateMachineState {
    scaleOrPanState: ScaleOrPanState;
    drawing: IOngoingDrawing;

    constructor(scaleOrPanState: ScaleOrPanState, drawing: IOngoingDrawing) {
        this.scaleOrPanState = scaleOrPanState;
        this.drawing = drawing;
    }

    handleMouseWheel = SUPPRESS_SCROLL.bind(this);
    handleDrawStart = (): IStateMachineState => this;

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        const touchEvent = e as TouchEvent;
        if (!touchEvent.touches || touchEvent.touches.length < 2) {
            return new DefaultState(this.drawing);
        }

        const ref = this.scaleOrPanState;
        if(!ref.start || !ref.panStart) {
            throw new Error("Cannot handle draw move in TouchPanState: Parent ScaleOrPanState has no start");
        }
        const { centroid } = ref.recentMetrics = ref.getTouchMetrics(touchEvent);

        const dx = centroid.clientX - ref.start.centroid.clientX;
        const dy = centroid.clientY - ref.start.centroid.clientY;

        tools.coordinateSystem.setView({ x: ref.panStart.x + dx, y: ref.panStart.y + dy });

        return this;
    };

    handleDrawEnd = (): IStateMachineState => new DefaultState(this.drawing);
}
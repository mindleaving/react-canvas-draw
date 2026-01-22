import type { TouchEvent } from "react";
import type { IStateMachineState, MouseOrTouchEvent, CanvasDrawTools, IOngoingDrawing } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL } from "../stateMachineHelpers";
import { DefaultState } from "./DefaultState";
import type { ScaleOrPanState } from "./ScaleOrPanState";

/**
 * The user is actively using touch gestures to scale the drawing.
 */
export class TouchScaleState implements IStateMachineState {
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
        if(!ref.start || !ref.scaleStart) {
            throw new Error("Cannot handle draw move in TouchPanState: Parent ScaleOrPanState has no start");
        }
        const { centroid, distance } = ref.recentMetrics = ref.getTouchMetrics(touchEvent);

        const targetScale = ref.scaleStart * (distance / ref.start.distance);
        const dScale = targetScale - tools.coordinateSystem.scale;
        tools.coordinateSystem.scaleAtClientPoint(dScale, centroid);

        return this;
    };

    handleDrawEnd = (): IStateMachineState => new DefaultState(this.drawing);
}
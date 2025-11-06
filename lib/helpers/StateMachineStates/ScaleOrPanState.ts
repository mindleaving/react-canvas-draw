import type { TouchEvent } from "react";
import type { IStateMachineState, MouseOrTouchEvent, CanvasDrawTools, Point, TouchMetric, IOngoingDrawing } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL, TOUCH_SLOP, clientPointFromEvent } from "../stateMachineHelpers";
import { DefaultState } from "./DefaultState";
import { TouchPanState } from "./TouchPanState";
import { TouchScaleState } from "./TouchScaleState";

/**
 * This state is active when the user has added at least two touch points but we
 * don't yet know if they intend to pan or zoom.
 */
export class ScaleOrPanState implements IStateMachineState {
    start?: TouchMetric;
    panStart?: Point;
    scaleStart?: number;
    recentMetrics?: TouchMetric;
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.drawing = drawing;
    }

    handleMouseWheel = SUPPRESS_SCROLL.bind(this);

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        const touchEvent = e as TouchEvent;
        if (!touchEvent.touches || touchEvent.touches.length < 2) {
            return new DefaultState(this.drawing);
        }
        this.start = this.getTouchMetrics(touchEvent);
        this.panStart = { x: tools.coordinateSystem.x, y: tools.coordinateSystem.y };
        this.scaleStart = tools.coordinateSystem.scale;
        return this;
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        const touchEvent = e as TouchEvent;
        if (!touchEvent.touches || touchEvent.touches.length < 2) {
            return new DefaultState(this.drawing);
        }
        if(!this.start) {
            throw new Error("Cannot handle draw move in ScaleOrPanState: Start touch not set. handleDrawStart was not called");
        }

        const { centroid, distance } = this.recentMetrics = this.getTouchMetrics(touchEvent);

        // Switch to scaling?
        const dd = Math.abs(distance - this.start.distance);
        if (dd >= TOUCH_SLOP) {
            return new TouchScaleState(this, this.drawing).handleDrawMove(e, tools);
        }

        // Switch to panning?
        const dx = centroid.clientX - this.start.centroid.clientX;
        const dy = centroid.clientY - this.start.centroid.clientY;
        const dc = Math.abs(dx) + Math.abs(dy);
        if (dc >= TOUCH_SLOP) {
            return new TouchPanState(this, this.drawing).handleDrawMove(e, tools);
        }

        // Not enough movement yet
        return this;
    };

    handleDrawEnd = (): IStateMachineState => new DefaultState(this.drawing);

    getTouchMetrics = (e: TouchEvent): TouchMetric => {
        const { clientX: t1x, clientY: t1y } = clientPointFromEvent(e.touches[0]);
        const { clientX: t2x, clientY: t2y } = clientPointFromEvent(e.touches[1]);

        const dx = t2x - t1x;
        const dy = t2y - t1y;

        return {
            t1: { clientX: t1x, clientY: t1y },
            t2: { clientX: t2x, clientY: t2y },
            distance: Math.sqrt(dx * dx + dy * dy),
            centroid: { clientX: (t1x + t2x) / 2.0, clientY: (t1y + t2y) / 2.0 },
        };
    };
}
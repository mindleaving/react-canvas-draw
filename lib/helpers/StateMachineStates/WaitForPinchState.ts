import type { TouchEvent } from "react";
import type { IStateMachineState, MouseOrTouchEvent, CanvasDrawTools, ClientPoint, IOngoingDrawing } from "../../types/frontendTypes";
import { SUPPRESS_SCROLL, clientPointFromEvent, PINCH_TIMEOUT_MS, TOUCH_SLOP } from "../stateMachineHelpers";
import { SyntheticEvent } from "../SyntheticEvent";
import { DrawingState } from "./DrawingState";
import { ScaleOrPanState } from "./ScaleOrPanState";

/**
 * This state is active when the user has initiated the drawing action but has
 * not yet created any lines. We use this state to try and detect a second touch
 * event to initiate a pinch-zoom action. We'll give up on that if enough time
 * or movement happens without a second touch.
 */
export class WaitForPinchState implements IStateMachineState {
    startClientPoint: ClientPoint | null;
    startTimestamp: number;
    deferredPoints: ClientPoint[];
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.startClientPoint = null;
        this.startTimestamp = (new Date()).valueOf();
        this.deferredPoints = [];
        this.drawing = drawing;
    }

    handleMouseWheel = SUPPRESS_SCROLL.bind(this);

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        const { enablePanAndZoom } = tools.drawOptions;
        e.preventDefault();

        // We're going to transition immediately into lazy-drawing mode if
        // pan-and-zoom isn't enabled or if this event wasn't triggered by a touch.
        const touchEvent = e as TouchEvent;
        if (!touchEvent.touches || !touchEvent.touches.length || !enablePanAndZoom) {
            return (new DrawingState(this.drawing)).handleDrawStart(e, tools);
        }

        // If we already have two touch events, we can move straight into pinch/pan
        if (enablePanAndZoom && touchEvent.touches && touchEvent.touches.length >= 2) {
            return (new ScaleOrPanState(this.drawing)).handleDrawStart(e, tools);
        }

        return this.handleDrawMove(e, tools);
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        e.preventDefault();

        // If we have two touches, move to pinch/pan (we don't have to recheck
        // whether zoom is enabled because that happend in draw start).
        const touchEvent = e as TouchEvent;
        if (touchEvent.touches && touchEvent.touches.length >= 2) {
            // Use the start draw to handler to transition.
            return (new ScaleOrPanState(this.drawing)).handleDrawStart(e, tools);
        }

        const clientPt = clientPointFromEvent(e);
        this.deferredPoints.push(clientPt);

        // If we've already moved far enough, or if enough time has passed, give up
        // and switch over to drawing.
        if ((new Date()).valueOf() - this.startTimestamp < PINCH_TIMEOUT_MS) {
            if (this.startClientPoint === null) {
                this.startClientPoint = clientPt;
            }

            // Note that we're using "manhattan distance" rather than computing a
            // hypotenuse here as a cheap approximation
            const d =
                Math.abs(clientPt.clientX - this.startClientPoint.clientX)
                + Math.abs(clientPt.clientY - this.startClientPoint.clientY);

            if (d < TOUCH_SLOP) {
                // We're not ready to give up yet.
                return this;
            }
        }

        // Okay, give up and start drawing.
        return this.issueDeferredPoints(tools);
    };

    handleDrawEnd = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        // The user stopped drawing before we decided what to do. Just treat this as
        // if they were drawing all along.
        return this.issueDeferredPoints(tools).handleDrawEnd(e, tools);
    };

    issueDeferredPoints = (tools: CanvasDrawTools): IStateMachineState => {
        // Time to give up. Play our deferred points out to the drawing state.
        // The first point will have been a start draw.
        let nextState: IStateMachineState = new DrawingState(this.drawing);
        for (let i = 0; i < this.deferredPoints.length; i++) {
            const deferredPt = this.deferredPoints[i];
            const syntheticEvent: MouseOrTouchEvent = new SyntheticEvent(deferredPt) as unknown as MouseOrTouchEvent;
            const func = i === 0 ? nextState.handleDrawStart : nextState.handleDrawMove;
            nextState = func(syntheticEvent, tools);
        }
        return nextState;
    };
}
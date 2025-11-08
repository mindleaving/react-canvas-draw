import type { WheelEvent } from "react";
import type { CanvasDrawTools, IOngoingDrawing, IStateMachineState, MouseOrTouchEvent } from "../../types/frontendTypes";
import { clientPointFromEvent, viewPointFromEvent } from "../stateMachineHelpers";
import { DisabledState } from "./DisabledState";
import { PanState } from "./PanState";
import { WaitForPinchState } from "./WaitForPinchState";

/**
 * The default state for the interaction state machine. Supports zoom and
 * initiating pan and drawing actions.
 */
export class DefaultState implements IStateMachineState {
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.drawing = drawing;
    }

    handleMouseWheel = (e: WheelEvent, tools: CanvasDrawTools): IStateMachineState => {
        const { disabled, enablePanAndZoom, mouseZoomFactor } = tools.drawOptions;
        if (disabled) {
            return new DisabledState(this.drawing);
        } else if (enablePanAndZoom && e.ctrlKey) {
            e.preventDefault();
            tools.coordinateSystem.scaleAtClientPoint(-mouseZoomFactor * e.deltaY, clientPointFromEvent(e));
        }
        return this;
    };

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools) => {
        const { disabled, enablePanAndZoom } = tools.drawOptions;
        if (disabled) {
            return new DisabledState(this.drawing);
        } else if (e.ctrlKey && enablePanAndZoom) {
            return (new PanState(this.drawing)).handleDrawStart(e, tools);
        } else {
            return (new WaitForPinchState(this.drawing)).handleDrawStart(e, tools);
        }
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        if (tools.drawOptions.disabled) {
            return new DisabledState(this.drawing);
        } else {
            const { x, y } = viewPointFromEvent(tools.coordinateSystem, e);
            tools.lazyBrush.update({ x, y });
            return this;
        }
    };

    handleDrawEnd = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        return tools.drawOptions.disabled ? (new DisabledState(this.drawing)) : this;
    };
};
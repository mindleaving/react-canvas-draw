import type { WheelEvent } from "react";
import type { CanvasDrawTools, IOngoingDrawing, IStateMachineState, MouseOrTouchEvent } from "../../types/frontendTypes";
import { DefaultState } from "./DefaultState";

/**
 * This state is used as long as the disabled prop is active. It ignores all
 * events and doesn't prevent default actions. The disabled state can only be
 * triggered from the default state (i.e., while no action is actively being
 * performed).
 */
export class DisabledState implements IStateMachineState {
    drawing: IOngoingDrawing;

    constructor(drawing: IOngoingDrawing) {
        this.drawing = drawing;
    }

    handleMouseWheel = (e: WheelEvent, tools: CanvasDrawTools): IStateMachineState => {
        if (tools.drawOptions.disabled) {
            return this;
        } else {
            return (new DefaultState(this.drawing)).handleMouseWheel(e, tools);
        }
    };

    handleDrawStart = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        if (tools.drawOptions.disabled) {
            return this;
        } else {
            return (new DefaultState(this.drawing)).handleDrawStart(e, tools);
        }
    };

    handleDrawMove = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        if (tools.drawOptions.disabled) {
            return this;
        } else {
            return (new DefaultState(this.drawing)).handleDrawMove(e, tools);
        }
    };

    handleDrawEnd = (e: MouseOrTouchEvent, tools: CanvasDrawTools): IStateMachineState => {
        if (tools.drawOptions.disabled) {
            return this;
        } else {
            return (new DefaultState(this.drawing)).handleDrawEnd(e, tools);
        }
    }
}
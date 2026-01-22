import { useCallback, useEffect, useMemo, useState, type WheelEvent } from "react";
import makePassiveEventOption from "../helpers/eventHelpers";
import type { CanvasDrawOptions, CanvasDrawTools, CanvasProps, IOngoingDrawing, IStateMachineState, MouseOrTouchEvent, ViewListener } from "../types/frontendTypes";
import { LazyBrush } from "lazy-brush";
import { DefaultState } from "../helpers/StateMachineStates/DefaultState";
import { clearCanvas, drawInterface, setCanvasSize } from "../helpers/canvasDrawer";

interface InterfaceCanvasProps extends CanvasProps {
    drawing: IOngoingDrawing;
    drawOptions: CanvasDrawOptions;
}

export const InterfaceCanvas = (props: InterfaceCanvasProps) => {

    const { canvasWidth, canvasHeight, drawing, coordinateSystem, drawOptions } = props;

    const [ canvas, setCanvas ] = useState<HTMLCanvasElement>();
    const context = useMemo(() =>  canvas?.getContext("2d"), [ canvas ]);
    const chainLength = useMemo(() => drawOptions.caternary.radius * window.devicePixelRatio, [ drawOptions.caternary.radius ]);
    const lazyBrush = useMemo(() => new LazyBrush({
        radius: chainLength,
        enabled: true,
        initialPoint: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        }
    }), [ chainLength ]);
    const tools = useMemo(() => ({
        coordinateSystem: coordinateSystem,
        lazyBrush: lazyBrush,
        drawOptions: drawOptions
    } as CanvasDrawTools), [ lazyBrush, drawOptions, coordinateSystem ]);
    const [ userInputStateMachine, setUserInputStateMachine ] = useState<IStateMachineState>(() => new DefaultState(drawing));

    useEffect(() => {
        setUserInputStateMachine(new DefaultState(drawing));
    }, [ drawing ]);

    useEffect(() => {
        if(!canvas) {
            return;
        }
        coordinateSystem.canvas = canvas;
    }, [ canvas, coordinateSystem ]);

    const redrawCanvas = useCallback(() => {
        if(!context) {
            return;
        }
        drawInterface(context, lazyBrush, drawOptions);
    }, [context, lazyBrush, drawOptions]);

    useEffect(() => {
        if(!canvas) {
            return;
        }
        setCanvasSize(canvas, canvasWidth, canvasHeight);
        redrawCanvas();
    }, [ canvas, canvasWidth, canvasHeight, redrawCanvas ]);

    const handleWheel = useCallback((e: WheelEvent | globalThis.WheelEvent) => {
        const newState = userInputStateMachine.handleMouseWheel(e as WheelEvent, tools);
        setUserInputStateMachine(newState);
    }, [ userInputStateMachine, tools ]);

    const handleDrawStart = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawStart(e, tools);
        setUserInputStateMachine(newState);
    }, [ userInputStateMachine, tools ]);

    const handleDrawMove = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawMove(e, tools);
        setUserInputStateMachine(newState);
        redrawCanvas();
    }, [ userInputStateMachine, tools, redrawCanvas ]);

    const handleDrawEnd = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawEnd(e, tools);
        setUserInputStateMachine(newState);
    }, [ userInputStateMachine, tools ]);

    useEffect(() => {
        const interfaceCanvas = canvas;
        if(!interfaceCanvas) {
            return;
        }
        // Attach our wheel event listener here instead of in the render so that we can specify a non-passive listener.
        // This is necessary to prevent the default event action on chrome.
        // https://github.com/facebook/react/issues/14856
        interfaceCanvas.addEventListener("wheel", handleWheel, makePassiveEventOption());
        return () => {
            interfaceCanvas.removeEventListener("wheel", handleWheel);
        }
    }, [ canvas, handleWheel ]);

    const onCoordinateSystemChanged: ViewListener = useCallback(() => {
        if (!context) {
            return;
        }
        clearCanvas(context);
        const m = coordinateSystem.transformMatrix;
        context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
        redrawCanvas();
    }, [context, coordinateSystem, redrawCanvas]);

    useEffect(() => {
        coordinateSystem.attachViewChangeListener(onCoordinateSystemChanged);
        return () => {
            coordinateSystem.detachViewChangeListener(onCoordinateSystemChanged);
        }
    }, [ onCoordinateSystemChanged, coordinateSystem ]);

    return (<canvas
        ref={node => setCanvas(node ?? undefined)}
        className="react-canvas-draw-canvas"
        onMouseDown={handleDrawStart}
        onMouseMove={handleDrawMove}
        onMouseUp={handleDrawEnd}
        onMouseOut={handleDrawEnd}
        onTouchStart={handleDrawStart}
        onTouchMove={handleDrawMove}
        onTouchEnd={handleDrawEnd}
        onTouchCancel={handleDrawEnd}
    />);

}
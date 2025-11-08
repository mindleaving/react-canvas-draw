import './styles/react-canvas-draw.css';
import { LazyBrush } from "lazy-brush";
import makePassiveEventOption from "./helpers/eventHelpers";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from "react";
import { DefaultState } from "./helpers/StateMachineStates/DefaultState";
import type { CanvasContextCollection, CanvasDrawOptions, CanvasDrawTools, ICoordinateSystem, IOngoingDrawing, IStateMachineState, Line, MouseOrTouchEvent, PartialDrawOptions, ViewListener } from "./types/frontendTypes";
import CoordinateSystem from "./helpers/CoordinateSystem";
import { clearCanvas, copyCanvas, createImage, drawImageToCanvas, drawGrid, drawInterface, drawPoints, drawLines as drawLinesToCanvas, setCanvasSize } from "./helpers/canvasDrawer";
import { DefaultCanvasWidth, DefaultCanvasHeight, DefaultDrawOptions } from "./helpers/constants";
import { useDeepEqualityMemo } from './helpers/customHooks';

interface CanvasDrawProps {
    drawing: IOngoingDrawing;
    canvasWidth?: number;
    canvasHeight?: number;
    drawOptions?: PartialDrawOptions;
    className?: string;
    style?: CSSProperties;
    imgSrc?: string;
}

// The order of these is important: grid > drawing > temp > interface
const canvasTypes = ["grid", "drawing", "temp", "interface"];

export const CanvasDraw = (props: CanvasDrawProps) => {

    const {
        drawing,
        canvasWidth,
        canvasHeight,
        drawOptions,
        className,
        style,
        imgSrc
    } = props;

    const effectiveCanvasWidth = useMemo(() => canvasWidth ?? DefaultCanvasWidth, [ canvasWidth ]);
    const effectiveCanvasHeight = useMemo(() => canvasHeight ?? DefaultCanvasHeight, [ canvasHeight ]);
    const deepEqualityCheckedDrawOptions: PartialDrawOptions = useDeepEqualityMemo(drawOptions as object);
    const effectiveDrawingOptions: CanvasDrawOptions = useMemo(() => ({ 
        ...DefaultDrawOptions, 
        ...deepEqualityCheckedDrawOptions, 
        caternary: {
            ...DefaultDrawOptions.caternary,
            ...deepEqualityCheckedDrawOptions?.caternary
        },
        grid: {
            ...DefaultDrawOptions.grid,
            ...deepEqualityCheckedDrawOptions?.grid
        }
    }), [ deepEqualityCheckedDrawOptions ]);
    const { zoomExtents, enablePanAndZoom } = effectiveDrawingOptions;
    const canvasContextCollection: CanvasContextCollection = useMemo(() => ({}), []);
    const [ image, setImage ] = useState<HTMLImageElement>();
    const chainLength = useMemo(() => effectiveDrawingOptions.caternary.radius * window.devicePixelRatio, [ effectiveDrawingOptions.caternary.radius ]);
    const lazyBrush = useMemo(() => new LazyBrush({
        radius: chainLength,
        enabled: true,
        initialPoint: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        }
    }), [ chainLength ]);
    const coordinateSystem: ICoordinateSystem = useMemo(() => new CoordinateSystem(
        effectiveDrawingOptions.zoomExtents, 
        { width: effectiveCanvasWidth, height: effectiveCanvasHeight }),
    [ effectiveDrawingOptions.zoomExtents, effectiveCanvasWidth, effectiveCanvasHeight ]);
    const tools = useMemo(() => ({
        coordinateSystem: coordinateSystem,
        lazyBrush: lazyBrush,
        drawOptions: effectiveDrawingOptions
    } as CanvasDrawTools), [ lazyBrush, effectiveDrawingOptions, coordinateSystem ]);
    const [ userInputStateMachine, setUserInputStateMachine ] = useState<IStateMachineState>(() => new DefaultState(drawing));
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUserInputStateMachine(new DefaultState(drawing));
    }, [ drawing ]);

    useEffect(() => {
        if(!canvasContextCollection.interface) {
            return;
        }
        coordinateSystem.canvas = canvasContextCollection.interface.canvas;
    }, [ coordinateSystem, canvasContextCollection ]);

    const drawImage = useCallback((imgSrc: string) => {
        if(!canvasContextCollection.drawing) {
            return;
        }
        const gridContext = canvasContextCollection.grid!.context;
        const image = createImage(imgSrc, e => drawImageToCanvas({ ctx: gridContext, img: e.target as HTMLImageElement }));
        setImage(image);
    }, [ canvasContextCollection ]);

    useEffect(() => {
        if(!imgSrc) {
            return;
        }
        drawImage(imgSrc);
    }, [ imgSrc, drawImage ]);

    const redrawInterfaceCanvas = useCallback(() => {
        drawInterface(canvasContextCollection.interface!.context, lazyBrush, effectiveDrawingOptions);
    }, [canvasContextCollection, lazyBrush, effectiveDrawingOptions]);

    const redrawImage = useCallback(() => {
        if(!image || !image.complete || !canvasContextCollection.grid) {
            return;
        }
        drawImageToCanvas({ ctx: canvasContextCollection.grid.context, img: image });
    }, [ canvasContextCollection, image ]);

    const redrawGridCanvas = useCallback(() => {
        drawGrid(canvasContextCollection.grid!.context, coordinateSystem, effectiveDrawingOptions);
        redrawImage();
    }, [canvasContextCollection, coordinateSystem, effectiveDrawingOptions, redrawImage]);

    const copyTempCanvasToDrawingCanvas = useCallback(() => {
        copyCanvas(canvasContextCollection.temp!, canvasContextCollection.drawing!);
        clearCanvas(canvasContextCollection.temp!.context);
    }, [ canvasContextCollection ]);

    const drawLines = useCallback((lines: Line[], { immediate = false} = {}) => {
        clearCanvas(canvasContextCollection.temp!.context);
        drawLinesToCanvas(
            canvasContextCollection.temp!.context, 
            lines, 
            effectiveDrawingOptions, 
            copyTempCanvasToDrawingCanvas, 
            { immediate });
    }, [canvasContextCollection, effectiveDrawingOptions, copyTempCanvasToDrawingCanvas ]);

    const redrawDrawingCanvas = useCallback(() => {
        clearCanvas(canvasContextCollection.drawing!.context);
        drawLines(drawing.lines, { immediate: true });
    }, [canvasContextCollection, drawLines, drawing]);

    const redrawAll = useCallback(() => {
        redrawGridCanvas();
        redrawDrawingCanvas();
        redrawInterfaceCanvas();
    }, [redrawGridCanvas, redrawDrawingCanvas, redrawInterfaceCanvas]);

    useEffect(() => {
        const width = effectiveCanvasWidth;
        const height = effectiveCanvasHeight;
        setCanvasSize(canvasContextCollection.interface!.canvas, width, height);
        setCanvasSize(canvasContextCollection.drawing!.canvas, width, height);
        setCanvasSize(canvasContextCollection.temp!.canvas, width, height);
        setCanvasSize(canvasContextCollection.grid!.canvas, width, height);
        drawing.rescale({ width, height });
        redrawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ canvasContextCollection, drawing, effectiveCanvasWidth, effectiveCanvasHeight ]);

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
        redrawInterfaceCanvas();
    }, [ userInputStateMachine, tools, redrawInterfaceCanvas ]);

    const handleDrawEnd = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawEnd(e, tools);
        setUserInputStateMachine(newState);
    }, [ userInputStateMachine, tools ]);

    useEffect(() => {
        const interfaceCanvas = canvasContextCollection.interface?.canvas;
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
    }, [ canvasContextCollection, handleWheel ]);

    const onPointAdded = useCallback((lineInProgress: Line) => {
        const lineDrawOptions: CanvasDrawOptions = {
            ...effectiveDrawingOptions,
            brushColor: lineInProgress.brushColor,
            brushRadius: lineInProgress.brushRadius
        };
        drawPoints(canvasContextCollection.temp!.context, lineInProgress.points, lineDrawOptions);
    }, [ canvasContextCollection, effectiveDrawingOptions ]);

    useEffect(() => {
        drawing.registerOnPointAddedCallback(onPointAdded);
        return () => {
            drawing.unregisterOnPointAddedCallback(onPointAdded);
        }
    }, [ drawing, onPointAdded ]);

    const onNewLine = useCallback(( /*newLine: Line */) => {
        copyTempCanvasToDrawingCanvas();
    }, [ copyTempCanvasToDrawingCanvas ]);

    useEffect(() => {
        drawing.registerOnLineCompletedCallback(onNewLine);
        return () => {
            drawing.unregisterOnLineCompletedCallback(onNewLine);
        }
    }, [ drawing, onNewLine ]);

    const clearLines = useCallback(() => {
        clearCanvas(canvasContextCollection.drawing!.context);
        clearCanvas(canvasContextCollection.temp!.context);
    }, [ canvasContextCollection ]);

    const onLineRemoved = useCallback((removedLine: Line, remainingLines: Line[]) => {
        clearLines();
        drawLines(remainingLines, { immediate: true });
    }, [ clearLines, drawLines ]);

    useEffect(() => {
        drawing.registerOnLineRemovedCallback(onLineRemoved);
        return () => {
            drawing.unregisterOnLineRemovedCallback(onLineRemoved);
        }
    }, [ drawing, onLineRemoved ]);

    const onLinesChanges = useCallback((lines: Line[]) => {
        clearLines();
        drawLines(lines, { immediate: true });
    }, [ clearLines, drawLines ]);

    useEffect(() => {
        drawing.registerOnLinesChangedCallback(onLinesChanges);
        return () => {
            drawing.unregisterOnLinesChangedCallback(onLinesChanges);
        }
    }, [ drawing, onLinesChanges ]);

    useEffect(() => {
        if(!zoomExtents) {
            return;
        }
        coordinateSystem.scaleExtents = zoomExtents;
        if(!enablePanAndZoom) {
            coordinateSystem.resetView();
        }
    }, [ coordinateSystem, zoomExtents, enablePanAndZoom ]);

    const applyView: ViewListener = useCallback(() => {
        if (!canvasContextCollection.drawing) {
            return;
        }
        canvasTypes
            .map((name) => canvasContextCollection[name]!.context)
            .forEach((ctx) => {
                if(!ctx) {
                    return;
                }
                clearCanvas(ctx);
                const m = coordinateSystem.transformMatrix;
                ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
            });

        redrawAll();
    }, [coordinateSystem, canvasContextCollection, redrawAll]);

    useEffect(() => {
        coordinateSystem.attachViewChangeListener(applyView);
        return () => {
            coordinateSystem.detachViewChangeListener(applyView);
        }
    }, [ applyView, coordinateSystem ]);

    return (<div
        className={className}
        style={{
            display: "block",
            background: effectiveDrawingOptions.backgroundColor,
            touchAction: "none",
            width: effectiveCanvasWidth,
            height: effectiveCanvasHeight,
            ...style,
        }}
        ref={container}
    >
        {canvasTypes.map((canvasType) => {
            const isInterface = canvasType === "interface";
            return (
                <canvas
                    key={canvasType}
                    ref={(canvas) => {
                        if (!canvas) {
                            return;
                        }
                        canvasContextCollection[canvasType] = {
                            canvas: canvas,
                            context: canvas.getContext("2d")!
                        };
                    }}
                    id={`canvas-${canvasType}`}
                    className="canvas"
                    onMouseDown={isInterface ? handleDrawStart : undefined}
                    onMouseMove={isInterface ? handleDrawMove : undefined}
                    onMouseUp={isInterface ? handleDrawEnd : undefined}
                    onMouseOut={isInterface ? handleDrawEnd : undefined}
                    onTouchStart={isInterface ? handleDrawStart : undefined}
                    onTouchMove={isInterface ? handleDrawMove : undefined}
                    onTouchEnd={isInterface ? handleDrawEnd : undefined}
                    onTouchCancel={isInterface ? handleDrawEnd : undefined}
                />
            );
        })}
    </div>);
}
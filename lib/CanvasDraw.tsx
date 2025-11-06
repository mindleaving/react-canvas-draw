import { LazyBrush } from "lazy-brush";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import makePassiveEventOption from "./helpers/eventHelpers";
import { DefaultState } from "./helpers/StateMachineStates/DefaultState";
import type { CanvasContextCollection, CanvasDrawOptions, CanvasDrawTools, ICoordinateSystem, IOngoingDrawing, IStateMachineState, Line, MouseOrTouchEvent, Size, ViewListener } from "./types/frontendTypes";
import CoordinateSystem from "./helpers/CoordinateSystem";
import { clearCanvas, copyCanvas, createImage, drawImageToCanvas, drawGrid, drawInterface, drawPoints, drawLines as drawLinesToCanvas, setCanvasSize } from "./helpers/canvasDrawer";
import { last } from "./helpers/collectionHelpers";
import { DefaultCanvasWidth, DefaultCanvasHeight, DefaultDrawOptions } from "./helpers/constants";

interface CanvasDrawProps {
    drawing: IOngoingDrawing;
    canvasWidth?: number;
    canvasHeight?: number;
    drawOptions?: Partial<CanvasDrawOptions>;
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
    const effectiveDrawingOptions = useMemo(() => ({ ...DefaultDrawOptions, ...drawOptions }), [ drawOptions ]);
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
        drawOptions: drawOptions
    } as CanvasDrawTools), [ lazyBrush, drawOptions, coordinateSystem ]);
    const [ userInputStateMachine, setUserInputStateMachine ] = useState<IStateMachineState>(() => new DefaultState(drawing));
    const [ hasMouseMoved, setHasMouseMoved ] = useState<boolean>(false);
    const [ deferRedrawOnViewChange, setDeferRedrawOnViewChange ] = useState<boolean>(false);
    const [ isRedrawRequired, setIsRedrawRequired ] = useState<boolean>(false);
    const container = useRef<HTMLDivElement>(null);

    const clearLines = useCallback(() => {
        setIsRedrawRequired(true);
        clearCanvas(canvasContextCollection.drawing!.context);
        clearCanvas(canvasContextCollection.temp!.context);
    }, [ canvasContextCollection ]);

    useEffect(() => {
        drawing.rescale({ width: effectiveCanvasWidth, height: effectiveCanvasHeight });
    }, [ drawing, effectiveCanvasWidth, effectiveCanvasHeight]);

    useEffect(() => {
        setUserInputStateMachine(new DefaultState(drawing));
    }, [ drawing ]);

    useEffect(() => {
        if(!canvasContextCollection.interface) {
            return;
        }
        coordinateSystem.canvas = canvasContextCollection.interface.canvas;
    }, [ coordinateSystem, canvasContextCollection ]);

    useEffect(() => {
        // Why is this delayed?
        setTimeout(() => {
            const initX = window.innerWidth / 2;
            const initY = window.innerHeight / 2;
            lazyBrush.update(
                { x: initX - chainLength / 4, y: initY },
                { both: true }
            );
            lazyBrush.update(
                { x: initX + chainLength / 4, y: initY },
                { both: false }
            );
            setHasMouseMoved(true);
            setIsRedrawRequired(true);
            clearLines();
        }, 100);
    }, [ chainLength, clearLines, lazyBrush]);

    const drawImage = useCallback((imgSrc: string) => {
        if(!canvasContextCollection.drawing) {
            return;
        }
        const drawingContext = canvasContextCollection.drawing!.context;
        const image = createImage(imgSrc, e => drawImageToCanvas({ ctx: drawingContext, img: e.target as HTMLImageElement }));
        setImage(image);
    }, [ canvasContextCollection ]);

    const loop = useCallback(({ once = false } = {}) => {
        if (hasMouseMoved || isRedrawRequired) {
            drawInterface(canvasContextCollection.interface!.context, lazyBrush, effectiveDrawingOptions);
            setHasMouseMoved(false);
            setIsRedrawRequired(false);
        }

        if (!once) {
            window.requestAnimationFrame(() => {
                loop();
            });
        }
    }, [ canvasContextCollection, hasMouseMoved, isRedrawRequired, lazyBrush, effectiveDrawingOptions]);

    useEffect(() => {
        loop();
    }, [ loop ]);

    const handleCanvasResize = useCallback((entries: { contentRect: { width: number, height: number} }[]) => {
        if(entries.length === 0) {
            return;
        }
        setDeferRedrawOnViewChange(true);
        try {
            const entryContentRect = last(entries)!.contentRect;
            const newCanvasSize: Size = { width: entryContentRect.width, height: entryContentRect.height };
            const { width, height } = newCanvasSize;
            setCanvasSize(canvasContextCollection.interface!.canvas, width, height);
            setCanvasSize(canvasContextCollection.drawing!.canvas, width, height);
            setCanvasSize(canvasContextCollection.temp!.canvas, width, height);
            setCanvasSize(canvasContextCollection.grid!.canvas, width, height);

            coordinateSystem.documentSize = newCanvasSize;
            drawGrid(canvasContextCollection.grid!.context, coordinateSystem, effectiveDrawingOptions);
            if(imgSrc) {
                drawImage(imgSrc);
            }
            loop({ once: true });
            drawing.rescale(newCanvasSize);
        } finally {
            setDeferRedrawOnViewChange(false);
        }
    }, [ canvasContextCollection, coordinateSystem, drawing, effectiveDrawingOptions, drawImage, imgSrc, loop ]);

    useEffect(() => {
        if(!container.current) {
            return;
        }
        const containerLocalCopy = container.current;
        const observer = new ResizeObserver(handleCanvasResize);
        observer.observe(containerLocalCopy);
        return () => {
            observer.unobserve(containerLocalCopy);
        }
    }, [ handleCanvasResize, container ]);

    const handleWheel = useCallback((e: WheelEvent) => {
        const newState = userInputStateMachine.handleMouseWheel(e, tools);
        setUserInputStateMachine(newState);
    }, [ userInputStateMachine, tools ]);

    const handleDrawStart = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawStart(e, tools);
        setUserInputStateMachine(newState);
        setHasMouseMoved(true);
    }, [ userInputStateMachine, tools ]);

    const handleDrawMove = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawMove(e, tools);
        setUserInputStateMachine(newState);
        setHasMouseMoved(true);
    }, [ userInputStateMachine, tools ]);

    const handleDrawEnd = useCallback((e: MouseOrTouchEvent) => {
        const newState = userInputStateMachine.handleDrawEnd(e, tools);
        setUserInputStateMachine(newState);
        setHasMouseMoved(true);
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
        if(lineInProgress.points.length < 2) {
            return;
        }
        drawPoints(canvasContextCollection.temp!.context, lineInProgress.points, { ...effectiveDrawingOptions });
    }, [ canvasContextCollection, effectiveDrawingOptions ]);

    useEffect(() => {
        drawing.registerOnPointAddedCallback(onPointAdded);
        return () => {
            drawing.unregisterOnPointAddedCallback(onPointAdded);
        }
    }, [ drawing, onPointAdded ]);

    const copyTempCanvasToDrawingCanvas = useCallback(() => {
        copyCanvas(canvasContextCollection.temp!, canvasContextCollection.drawing!);
        clearCanvas(canvasContextCollection.temp!.context);
    }, [ canvasContextCollection ]);

    const drawLines = useCallback((lines: Line[], { immediate = false} = {}) => {
        drawLinesToCanvas(
            canvasContextCollection.temp!.context, 
            lines, 
            effectiveDrawingOptions, 
            copyTempCanvasToDrawingCanvas, 
            { immediate });
    }, [canvasContextCollection, effectiveDrawingOptions, copyTempCanvasToDrawingCanvas ]);

    const onNewLine = useCallback(( /*newLine: Line */) => {
        copyTempCanvasToDrawingCanvas();
    }, [ copyTempCanvasToDrawingCanvas ]);

    useEffect(() => {
        drawing.registerOnLineCompletedCallback(onNewLine);
        return () => {
            drawing.unregisterOnLineCompletedCallback(onNewLine);
        }
    }, [ drawing, onNewLine ]);

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
        if(!imgSrc) {
            return;
        }
        drawImage(imgSrc);
    }, [ imgSrc, drawImage ]);

    useEffect(() => {
        if(!zoomExtents) {
            return;
        }
        coordinateSystem.scaleExtents = zoomExtents;
        if(!enablePanAndZoom) {
            coordinateSystem.resetView();
        }
    }, [ coordinateSystem, zoomExtents, enablePanAndZoom ]);

    useEffect(() => {
        setIsRedrawRequired(true);
    }, [ props ]);

    const redrawImage = useCallback(() => {
        if(!image || !image.complete || !canvasContextCollection.grid) {
            return;
        }
        drawImageToCanvas({ ctx: canvasContextCollection.grid.context, img: image });
    }, [ canvasContextCollection, image ]);

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

        if(deferRedrawOnViewChange) {
            drawGrid(canvasContextCollection.grid!.context, coordinateSystem, effectiveDrawingOptions);
            redrawImage();
            loop({ once: true });
            drawLines(drawing.lines, { immediate: true });
        }
    }, [
        coordinateSystem, 
        canvasContextCollection,
        deferRedrawOnViewChange, 
        drawLines, 
        drawing, 
        effectiveDrawingOptions, 
        loop, 
        redrawImage
    ]);

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
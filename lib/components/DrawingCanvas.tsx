import { useCallback, useEffect, useMemo, useState } from "react";
import { clearCanvas, drawLines as drawLinesToCanvas, setCanvasSize } from "../helpers/canvasDrawer";
import type { CanvasDrawOptions, CanvasProps, ICoordinateSystem, IOngoingDrawing, Line, ViewListener } from "../types/frontendTypes";

interface DrawingCanvasProps extends CanvasProps {
    drawing: IOngoingDrawing;
    coordinateSystem: ICoordinateSystem;
    drawOptions: CanvasDrawOptions;
}

export const DrawingCanvas = (props: DrawingCanvasProps) => {

    const { canvasWidth, canvasHeight, drawing, coordinateSystem, drawOptions } = props;

    const [ canvas, setCanvas ] = useState<HTMLCanvasElement>();
    const context = useMemo(() =>  canvas?.getContext("2d"), [ canvas ]);

    const drawLines = useCallback((lines: Line[], { immediate = false} = {}) => {
        if(!context) {
            return;
        }
        drawLinesToCanvas(
            context, 
            lines, 
            drawOptions, 
            () => {}, 
            { immediate });
    }, [context, drawOptions ]);

    const redrawCanvas = useCallback(() => {
        if(!context) {
            return;
        }
        clearCanvas(context);
        drawLines(drawing.lines, { immediate: true });
    }, [context, drawLines, drawing]);

    const onNewLine = useCallback(( /*newLine: Line */) => {
        redrawCanvas();
    }, [ redrawCanvas ]);

    useEffect(() => {
        drawing.registerOnLineCompletedCallback(onNewLine);
        return () => {
            drawing.unregisterOnLineCompletedCallback(onNewLine);
        }
    }, [ drawing, onNewLine ]);

    const onLineRemoved = useCallback(() => {
        redrawCanvas();
    }, [ redrawCanvas ]);

    useEffect(() => {
        drawing.registerOnLineRemovedCallback(onLineRemoved);
        return () => {
            drawing.unregisterOnLineRemovedCallback(onLineRemoved);
        }
    }, [ drawing, onLineRemoved ]);

    const onLinesChanges = useCallback(() => {
        redrawCanvas();
    }, [ redrawCanvas ]);

    useEffect(() => {
        drawing.registerOnLinesChangedCallback(onLinesChanges);
        return () => {
            drawing.unregisterOnLinesChangedCallback(onLinesChanges);
        }
    }, [ drawing, onLinesChanges ]);

    useEffect(() => {
        if(!canvas) {
            return;
        }
        setCanvasSize(canvas, canvasWidth, canvasHeight);
        drawing.rescale({ width: canvasWidth, height: canvasHeight });
        redrawCanvas();
    }, [ canvas, canvasWidth, canvasHeight, drawing, redrawCanvas ]);

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
    />);

}
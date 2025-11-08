import { useEffect, useCallback, useMemo, useState } from "react";
import { setCanvasSize, clearCanvas, drawPoints } from "../helpers/canvasDrawer";
import type { CanvasDrawOptions, CanvasProps, IOngoingDrawing, Line, ViewListener } from "../types/frontendTypes";

interface TemporaryCanvasProps extends CanvasProps {
    drawing: IOngoingDrawing;
}

export const TemporaryCanvas = (props: TemporaryCanvasProps) => {

    const { canvasWidth, canvasHeight, coordinateSystem, drawOptions, drawing } = props;

    const [ canvas, setCanvas ] = useState<HTMLCanvasElement>();
    const context = useMemo(() =>  canvas?.getContext("2d"), [ canvas ]);

    const onPointAdded = useCallback((lineInProgress: Line) => {
        if(!context) {
            return;
        }
        const lineDrawOptions: CanvasDrawOptions = {
            ...drawOptions,
            brushColor: lineInProgress.brushColor,
            brushRadius: lineInProgress.brushRadius
        };
        clearCanvas(context);
        drawPoints(context, lineInProgress.points, lineDrawOptions);
    }, [ context, drawOptions ]);

    useEffect(() => {
        drawing.registerOnPointAddedCallback(onPointAdded);
        return () => {
            drawing.unregisterOnPointAddedCallback(onPointAdded);
        }
    }, [ drawing, onPointAdded ]);

    const onNewLine = useCallback(( /*newLine: Line */) => {
        if(!context) {
            return;
        }
        clearCanvas(context);
    }, [ context ]);

    useEffect(() => {
        drawing.registerOnLineCompletedCallback(onNewLine);
        return () => {
            drawing.unregisterOnLineCompletedCallback(onNewLine);
        }
    }, [ drawing, onNewLine ]);

    const redrawCanvas = useCallback(() => {
        if(!context) {
            return;
        }
        clearCanvas(context);
    }, [ context ]);

    useEffect(() => {
        if(!canvas) {
            return;
        }
        setCanvasSize(canvas, canvasWidth, canvasHeight);
        redrawCanvas();
    }, [ canvas, canvasWidth, canvasHeight, redrawCanvas ]);

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
import './styles/react-canvas-draw.css';
import { useEffect, useMemo, type CSSProperties } from "react";
import type { CanvasDrawOptions, CanvasProps, ICoordinateSystem, IOngoingDrawing, PartialDrawOptions } from "./types/frontendTypes";
import CoordinateSystem from "./helpers/CoordinateSystem";
import { DefaultCanvasWidth, DefaultCanvasHeight, DefaultDrawOptions } from "./helpers/constants";
import { useDeepEqualityMemo } from './helpers/customHooks';
import { GridCanvas } from './components/GridCanvas';
import { DrawingCanvas } from './components/DrawingCanvas';
import { TemporaryCanvas } from './components/TemporaryCanvas';
import { InterfaceCanvas } from './components/InterfaceCanvas';

interface CanvasDrawProps {
    drawing: IOngoingDrawing;
    canvasWidth?: number;
    canvasHeight?: number;
    drawOptions?: PartialDrawOptions;
    className?: string;
    style?: CSSProperties;
    imgSrc?: string;
}

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
    const coordinateSystem: ICoordinateSystem = useMemo(() => new CoordinateSystem(
        effectiveDrawingOptions.zoomExtents, 
        { width: effectiveCanvasWidth, height: effectiveCanvasHeight }),
    [ effectiveDrawingOptions.zoomExtents, effectiveCanvasWidth, effectiveCanvasHeight ]);
    const commonCanvasProps: CanvasProps = useMemo(() => ({
        canvasWidth: effectiveCanvasWidth,
        canvasHeight: effectiveCanvasHeight,
        coordinateSystem: coordinateSystem,
        drawOptions: effectiveDrawingOptions
    }), [coordinateSystem, effectiveCanvasHeight, effectiveCanvasWidth, effectiveDrawingOptions]);

    useEffect(() => {
        if(!zoomExtents) {
            return;
        }
        coordinateSystem.scaleExtents = zoomExtents;
        if(!enablePanAndZoom) {
            coordinateSystem.resetView();
        }
    }, [ coordinateSystem, zoomExtents, enablePanAndZoom ]);

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
    >
        <GridCanvas {...commonCanvasProps} imgSrc={imgSrc} />
        <DrawingCanvas {...commonCanvasProps} drawing={drawing} />
        <TemporaryCanvas {...commonCanvasProps} drawing={drawing} />
        <InterfaceCanvas {...commonCanvasProps} drawing={drawing} />
    </div>);
}
import type { LazyBrush } from "lazy-brush";
import type { MouseEvent, TouchEvent, WheelEvent } from "react";

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Line {
    points: Point[];
    brushColor: string;
    brushRadius: number;
}

export interface Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

export interface ScaleExtents {
    min: number;
    max: number;
}

export interface ViewPoint {
    x: number;
    y: number;
    untransformedX?: number;
    untransformedY?: number;
    relativeClientX?: number;
    relativeClientY?: number;
}
export interface CanvasBounds extends Rectangle {
    canvasWidth: number;
    canvasHeight: number;
    viewMin: ViewPoint;
    viewMax: ViewPoint;
}

export interface CanvasDrawState {
    lines: Line[];
    erasedLines: Line[];
}
export interface CanvasDrawSaveData {
    points: Point[];
    lines: Line[];
    width: number;
    height: number;
}
export interface CanvasDrawGridOptions {
    hideGrid: boolean;
    gridLineWidth: number;
    gridColor: string | CanvasGradient | CanvasPattern;
    gridSizeX: number;
    hideGridX: boolean;
    gridSizeY: number;
    hideGridY: boolean;
}
export interface CaternaryOptions {
    radius: number;
    color: string;
}
export interface CanvasDrawOptions {
    hideInterface: boolean;
    backgroundColor: string;
    brushColor: string;
    brushRadius: number;
    caternary: CaternaryOptions;
    disabled: boolean;
    enablePanAndZoom: boolean;
    mouseZoomFactor: number;
    clampLinesToDocument: boolean;
    grid: CanvasDrawGridOptions;
    zoomExtents: ScaleExtents;
    immediateLoading: boolean;
    drawTimeStepSizeInMilliseconds: number;
}
export interface PartialDrawOptions {
    hideInterface?: boolean;
    backgroundColor?: string;
    brushColor?: string;
    brushRadius?: number;
    caternary?: Partial<CaternaryOptions>;
    disabled?: boolean;
    enablePanAndZoom?: boolean;
    mouseZoomFactor?: number;
    clampLinesToDocument?: boolean;
    grid?: Partial<CanvasDrawGridOptions>;
    zoomExtents?: ScaleExtents;
    immediateLoading?: boolean;
    drawTimeStepSizeInMilliseconds?: number;
}
export interface DrawImageProps {
    ctx: CanvasRenderingContext2D;
    img: HTMLImageElement;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    offsetX?: number;
    offsetY?: number;
}
export type ViewListener = (view: View) => void;
export interface ClientPoint {
    clientX: number;
    clientY: number;
    x?: number;
    y?: number;
    relativeX?: number;
    relativeY?: number;
}
export interface Rectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
export interface View {
    scale: number;
    x: number;
    y: number;
}
export interface ICoordinateSystem {
    x: number;
    y: number;
    scale: number;
    documentSize: Size;
    scaleExtents: ScaleExtents;
    canvas?: HTMLCanvasElement;
    canvasBounds: CanvasBounds | undefined;
    transformMatrix: Matrix;
    setView: (view: Partial<View>) => void;
    resetView: () => void;
    clientPointToViewPoint: (clientPoint: ClientPoint, view?: View) => ViewPoint;
    scaleAtClientPoint: (scaleFactor: number, clientPoint: ClientPoint) => View;
    attachViewChangeListener: (listener: ViewListener) => void;
    detachViewChangeListener: (listener: ViewListener) => void;
}
export interface CanvasDrawTools {
    coordinateSystem: ICoordinateSystem;
    lazyBrush: LazyBrush;
    drawOptions: CanvasDrawOptions;
}
export type MouseOrTouchEvent = MouseEvent | TouchEvent;
export interface IStateMachineState {
    handleMouseWheel: (e: WheelEvent, tools: CanvasDrawTools) => IStateMachineState;
    handleDrawStart: (e: MouseOrTouchEvent, tools: CanvasDrawTools) => IStateMachineState;
    handleDrawMove: (e: MouseOrTouchEvent, tools: CanvasDrawTools) => IStateMachineState;
    handleDrawEnd: (e: MouseOrTouchEvent, tools: CanvasDrawTools) => IStateMachineState;
}
export interface TouchMetric {
    t1: ClientPoint;
    t2: ClientPoint;
    centroid: ClientPoint;
    distance: number;
}
export interface SavedDrawing {
    lines: Line[];
    width: number;
    height: number;
}
export type OnPointAddedCallback = (lineInProgress: Line) => void;
export type OnLineCompletedCallback = (completedLine: Line) => void;
export type OnLineRemovedCallback = (removedLine: Line, remainingLines: Line[]) => void;
export type OnLinesChangedCallback = (lines: Line[]) => void;
export interface IOngoingDrawing {
    canvasSize: Size;
    lineInProgress?: Line;
    lines: Line[];
    erasedLines: Line[];

    addToLineInProgress: (point: Point, drawOptions: CanvasDrawOptions) => void;
    finishLineInProgress: () => void;

    registerOnPointAddedCallback: (callback: OnPointAddedCallback) => void;
    unregisterOnPointAddedCallback: (callback: OnPointAddedCallback) => void;

    registerOnLineCompletedCallback: (callback: OnLineCompletedCallback) => void;
    unregisterOnLineCompletedCallback: (callback: OnLineCompletedCallback) => void;

    registerOnLineRemovedCallback: (callback: OnLineRemovedCallback) => void;
    unregisterOnLineRemovedCallback: (callback: OnLineRemovedCallback) => void;

    registerOnLinesChangedCallback: (callback: OnLinesChangedCallback) => void;
    unregisterOnLinesChangedCallback: (callback: OnLinesChangedCallback) => void;

    serialize: () => string;
    load: (json: string) => void;
    eraseAll: () => void;
    clear: () => void;
    clearExceptErasedLines: () => void;
    undo: () => void;
    rescale: (newCanvasSize: Size) => void;
}
export interface CanvasWithContext {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
}
export interface CanvasContextCollection {
    grid?: CanvasWithContext;
    drawing?: CanvasWithContext;
    temp?: CanvasWithContext;
    interface?: CanvasWithContext;
    [key:string]: CanvasWithContext | undefined;
}
export type GenericObject = { [key: string]: unknown };
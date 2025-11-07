import type { CanvasDrawOptions, IOngoingDrawing, Line, OnLineCompletedCallback, OnLineRemovedCallback, OnLinesChangedCallback, OnPointAddedCallback, Point, SavedDrawing, Size } from "../types/frontendTypes";
import { last } from "./collectionHelpers";
import { distance } from "./pointHelpers";
import { scaleSavedDrawingToCurrentCanvas } from "./storeHelpers";

export class OngoingDrawing implements IOngoingDrawing {
    canvasSize: Size;
    lineInProgress?: Line;
    lines: Line[] = [];
    erasedLines: Line[] = [];
    onPointAddedCallbacks = new Set<OnPointAddedCallback>();
    onLineCompletedCallbacks = new Set<OnLineCompletedCallback>();
    onLineRemovedCallbacks = new Set<OnLineRemovedCallback>();
    onLinesChangedCallbacks = new Set<OnLinesChangedCallback>();

    constructor(canvasSize: Size) {
        this.canvasSize = canvasSize;
    }

    addToLineInProgress = (point: Point, drawOptions: CanvasDrawOptions) => {
        if(!this.lineInProgress) {
            this.lineInProgress = {
                brushColor: drawOptions.brushColor,
                brushRadius: drawOptions.brushRadius,
                points: [ point ]
            }
            this.lineInProgress.points.push();
            this.onPointAdded();
            return;
        }
        const lastPoint = last(this.lineInProgress.points)!;
        if(distance(point, lastPoint) > 0.5 * drawOptions.brushRadius) {
            this.lineInProgress.points.push(point);
            this.onPointAdded();
        }
    }
    finishLineInProgress = (drawOptions: CanvasDrawOptions) => {
        if(!this.lineInProgress) {
            return;
        }
        if(this.lineInProgress.points.length === 1) {
            const singlePoint = this.lineInProgress.points[0];
            this.lineInProgress.points.push({
                x: singlePoint.x + 1,
                y: singlePoint.y + 1
            });
        }
        this.lineInProgress.brushColor = drawOptions.brushColor;
        this.lineInProgress.brushRadius = drawOptions.brushRadius;
        this.lines.push(this.lineInProgress);
        this.onLineCompleted(this.lineInProgress);
        this.lineInProgress = undefined;
    }

    onPointAdded = () => {
        if(!this.lineInProgress) {
            return;
        }
        const lineInProgressCopy = this.lineInProgress;
        this.onPointAddedCallbacks.forEach(callback => callback(lineInProgressCopy));
    }
    registerOnPointAddedCallback = (callback: OnPointAddedCallback) => {
        if(this.onPointAddedCallbacks.has(callback)) {
            return;
        }
        this.onPointAddedCallbacks.add(callback);
    }
    unregisterOnPointAddedCallback = (callback: OnPointAddedCallback) => {
        this.onPointAddedCallbacks.delete(callback);
    }

    onLineCompleted = (completedLine: Line) => {
        this.onLineCompletedCallbacks.forEach(callback => callback(completedLine));
    }
    registerOnLineCompletedCallback = (callback: OnLineCompletedCallback) => {
        if(this.onLineCompletedCallbacks.has(callback)) {
            return;
        }
        this.onLineCompletedCallbacks.add(callback);
    }
    unregisterOnLineCompletedCallback = (callback: OnLineCompletedCallback) => {
        this.onLineCompletedCallbacks.delete(callback);
    }

    onLineRemoved = (removedLine: Line) => {
        const remainingLines = this.lines;
        this.onLineRemovedCallbacks.forEach(callback => callback(removedLine, remainingLines));
    }
    registerOnLineRemovedCallback = (callback: OnLineRemovedCallback) => {
        if(this.onLineRemovedCallbacks.has(callback)) {
            return;
        }
        this.onLineRemovedCallbacks.add(callback);
    }
    unregisterOnLineRemovedCallback = (callback: OnLineRemovedCallback) => {
        this.onLineRemovedCallbacks.delete(callback);
    }

    onLinesChanged = () => {
        const linesCopy = this.lines;
        this.onLinesChangedCallbacks.forEach(callback => callback(linesCopy));
    }
    registerOnLinesChangedCallback = (callback: OnLinesChangedCallback) => {
        if(this.onLinesChangedCallbacks.has(callback)) {
            return;
        }
        this.onLinesChangedCallbacks.add(callback);
    }
    unregisterOnLinesChangedCallback = (callback: OnLinesChangedCallback) => {
        this.onLinesChangedCallbacks.delete(callback);
    }

    serialize = (): string => {
        const savedDrawing = {
            width: this.canvasSize.width,
            height: this.canvasSize.height,
            lines: this.lines
        };
        return JSON.stringify(savedDrawing);
    }
    load = (json: string) => {
        const savedDrawing = JSON.parse(json) as SavedDrawing;
        const rescaledDrawing = scaleSavedDrawingToCurrentCanvas(savedDrawing, this.canvasSize);
        this.lines = rescaledDrawing.lines;
        this.lineInProgress = undefined;
        this.erasedLines = [];
        this.onLinesChanged();
    }
    eraseAll = () => {
        if(this.lines.length === 0) {
            return;
        }
        this.erasedLines.push(...this.lines);
        this.lines = [];
        this.onLinesChanged();
    }
    clear = () => {
        this.erasedLines = [];
        this.lineInProgress = undefined;
        if(this.lines.length > 0) {
            this.lines = [];
            this.onLinesChanged();
        }
    }
    clearExceptErasedLines = () => {
        this.lineInProgress = undefined;
        if(this.lines.length > 0) {
            this.lines = [];
            this.onLinesChanged();
        }
    }
    undo = () => {
        if(this.lineInProgress) {
            return;
        }
        if(this.lines.length > 0) {
            const removedLine = this.lines.pop()!;
            this.onLineRemoved(removedLine);
        } else if(this.erasedLines.length > 0) {
            const lastErasedLine = this.erasedLines.pop();
            if(lastErasedLine) {
                this.lines.push(lastErasedLine);
                this.onLineCompleted(lastErasedLine);
            }
        }
    }
    
    rescale = (newCanvasSize: Size) => {
        const savedDrawing: SavedDrawing = {
            width: this.canvasSize.width,
            height: this.canvasSize.height,
            lines: this.lines
        };
        const rescaledDrawing = scaleSavedDrawingToCurrentCanvas(savedDrawing, newCanvasSize);
        const savedErasedLines: SavedDrawing = {
            width: this.canvasSize.width,
            height: this.canvasSize.height,
            lines: this.erasedLines
        };
        const rescaledErasedLines = scaleSavedDrawingToCurrentCanvas(savedErasedLines, newCanvasSize);

        this.canvasSize = newCanvasSize;
        this.lineInProgress = undefined;
        this.lines = rescaledDrawing.lines;
        this.erasedLines = rescaledErasedLines.lines;
    }

}
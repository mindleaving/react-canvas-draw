import type { ViewPoint, CanvasBounds, Matrix } from "../types/frontendTypes";

export const NULL_VIEW_POINT: ViewPoint = Object.freeze({
    x: 0, y: 0, untransformedX: 0, untransformedY: 0
});

export const NULL_BOUNDS: CanvasBounds = Object.freeze({
    canvasWidth: 0, 
    canvasHeight: 0,
    left: 0, 
    top: 0, 
    right: 0, 
    bottom: 0,
    viewMin: NULL_VIEW_POINT, viewMax: NULL_VIEW_POINT,
});

/**
 * The identity matrix (a transform that results in view coordinates that are
 * identical to relative client coordinates).
 */
export const IDENTITY: Matrix = Object.freeze({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

export const valueOrDefault = <T>(value: T | null | undefined, defaultValue: T) => {
    if (value === null || (typeof value) === "undefined") {
        return defaultValue;
    } else {
        return value;
    }
}
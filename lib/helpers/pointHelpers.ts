import type { CanvasDrawOptions, Point } from "../types/frontendTypes";

export const midPointBetween = (p1: Point, p2: Point): Point => {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
    };
}
export const clampPointToDocument = (
    point: Point,
    canvasWidth: number,
    canvasHeight: number,
    drawOptions: CanvasDrawOptions) => {
        
    if (drawOptions.clampLinesToDocument) {
        return {
            x: Math.max(Math.min(point.x, canvasWidth), 0),
            y: Math.max(Math.min(point.y, canvasHeight), 0),
        };
    } else {
        return point;
    }
}
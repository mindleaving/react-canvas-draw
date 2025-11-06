import type { SavedDrawing, Size } from "../types/frontendTypes";

export const loadSaveData = (json: string): SavedDrawing => {
    const savedDrawing = JSON.parse(json);
    const { lines } = savedDrawing;

    if (!lines || typeof lines.push !== "function") {
        throw new Error("saveData.lines needs to be an array!");
    }
    return savedDrawing as SavedDrawing;
}
export const scaleSavedDrawingToCurrentCanvas = (savedDrawing: SavedDrawing, currentCanvasSize: Size): SavedDrawing => {
    if(savedDrawing.width === currentCanvasSize.width && savedDrawing.height === currentCanvasSize.height) {
        return savedDrawing;
    }
    const scaleX = currentCanvasSize.width / savedDrawing.width;
    const scaleY = currentCanvasSize.height / savedDrawing.height;
    const scaleAvg = (scaleX + scaleY) / 2;
    const scaledLines = savedDrawing.lines.map(line => ({
        ...line,
        points: line.points.map(p => ({
            x: p.x * scaleX,
            y: p.y * scaleY,
        })),
        brushRadius: line.brushRadius * scaleAvg
    }));
    return {
        width: currentCanvasSize.width,
        height: currentCanvasSize.height,
        lines: scaledLines
    };
}
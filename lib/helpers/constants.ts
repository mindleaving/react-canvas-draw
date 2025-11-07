import type { CanvasDrawOptions } from "../types/frontendTypes";

export const DefaultCanvasWidth: number = 400;
export const DefaultCanvasHeight: number = 400;
export const DefaultDrawOptions: CanvasDrawOptions = {
    brushColor: "#444",
    brushRadius: 12,
    caternary: {
        radius: 12,
        color: "#0a0302"
    },
    mouseZoomFactor: 0.01,
    backgroundColor: "#FFF",
    disabled: false,
    clampLinesToDocument: false,
    enablePanAndZoom: false,
    hideInterface: false,
    grid: {
        hideGrid: false,
        hideGridX: false,
        gridSizeX: 25,
        hideGridY: false,
        gridSizeY: 25,
        gridColor: "rgba(150,150,150,0.17)",
        gridLineWidth: 1
    },
    zoomExtents: { min: 0.33, max: 3 },
    immediateLoading: false,
    drawTimeStepSizeInMilliseconds: 5
}
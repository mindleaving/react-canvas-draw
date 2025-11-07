import { drawResult, getCatenaryCurve } from "catenary-curve";
import type { CanvasDrawOptions, CanvasWithContext, DrawImageProps, ICoordinateSystem, Line, Point } from "../types/frontendTypes";
import { IDENTITY } from "./coordinateSystemHelpers";
import type { LazyBrush } from "lazy-brush";
import { midPointBetween } from "./pointHelpers";

export const createImage = (
    imgSrc: string,
    onImageLoaded: (ev: Event) => void
) => {
    // Load the image
    const image = new Image();

    // Prevent SecurityError "Tainted canvases may not be exported." #70
    image.crossOrigin = "anonymous";

    // Draw the image once loaded
    image.onload = onImageLoaded;
    image.src = imgSrc;
    return image;
};

/** 
 * Original from: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
 * Original By Ken Fyrstenberg Nilsen
 * 
 * Note: img must be fully loaded or have correct width & height set.
 */
export const drawImageToCanvas = ({ ctx, img, x, y, w, h, offsetX, offsetY }: DrawImageProps) => {
    // Defaults
    if (typeof x !== "number") x = 0;
    if (typeof y !== "number") y = 0;
    if (typeof w !== "number") w = ctx.canvas.width;
    if (typeof h !== "number") h = ctx.canvas.height;
    if (typeof offsetX !== "number") offsetX = 0.5;
    if (typeof offsetY !== "number") offsetY = 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    const iw = img.width;
    const ih = img.height;
    const r = Math.min(w / iw, h / ih);
    let nw = iw * r; // new prop. width
    let nh = ih * r; // new prop. height
    let cx, cy, cw, ch, ar = 1;

    // decide which gap to fill
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

export const drawGrid = (
    ctx: CanvasRenderingContext2D,
    coordinateSystem: ICoordinateSystem,
    drawOptions: CanvasDrawOptions
) => {
    const gridOptions = drawOptions.grid;
    if (gridOptions.hideGrid) return;

    clearCanvas(ctx);

    const gridSize = 25;
    const { viewMin, viewMax } = coordinateSystem.canvasBounds!;
    const minx = Math.floor(viewMin.x / gridSize - 1) * gridSize;
    const miny = Math.floor(viewMin.y / gridSize - 1) * gridSize;
    const maxx = viewMax.x + gridSize;
    const maxy = viewMax.y + gridSize;

    ctx.beginPath();
    ctx.setLineDash([5, 1]);
    ctx.setLineDash([]);
    ctx.strokeStyle = gridOptions.gridColor;
    ctx.lineWidth = gridOptions.gridLineWidth;

    if (!gridOptions.hideGridX) {
        let countX = minx;
        const gridSizeX = gridOptions.gridSizeX;
        while (countX < maxx) {
            countX += gridSizeX;
            ctx.moveTo(countX, miny);
            ctx.lineTo(countX, maxy);
        }
        ctx.stroke();
    }

    if (!gridOptions.hideGridY) {
        let countY = miny;
        const gridSizeY = gridOptions.gridSizeY;
        while (countY < maxy) {
            countY += gridSizeY;
            ctx.moveTo(minx, countY);
            ctx.lineTo(maxx, countY);
        }
        ctx.stroke();
    }
};
export const inClientSpace = (affectedContexts: CanvasRenderingContext2D[], action: () => void) => {
    // Store and reset current canvas transforms...
    affectedContexts.forEach((ctx) => {
        ctx.save();
        ctx.setTransform(
            IDENTITY.a,
            IDENTITY.b,
            IDENTITY.c,
            IDENTITY.d,
            IDENTITY.e,
            IDENTITY.f
        );
    });

    try {
        // ...perform action...
        action();
    } finally {
        // ...and restore transforms
        affectedContexts.forEach((ctx) => ctx.restore());
    }
}
export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
    inClientSpace([ctx], () =>
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    );
}
export const drawInterface = (
    ctx: CanvasRenderingContext2D,
    lazyBrush: LazyBrush,
    drawOptions: CanvasDrawOptions
) => {
    if (drawOptions?.hideInterface) return;

    clearCanvas(ctx);

    // Draw brush preview
    const brush = lazyBrush.getBrushCoordinates();
    ctx.beginPath();
    ctx.fillStyle = drawOptions.brushColor;
    ctx.arc(brush.x, brush.y, drawOptions.brushRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw mouse point (the one directly at the cursor)
    const pointer = lazyBrush.getPointerCoordinates();
    ctx.beginPath();
    ctx.fillStyle = drawOptions.caternary.color;
    ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw catenary
    if (lazyBrush.isEnabled()) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = drawOptions.caternary.color;
        const p1 = { x: brush.x, y: brush.y };
        const p2 = { x: pointer.x, y: pointer.y };
        const catenary = getCatenaryCurve(p1, p2, lazyBrush.radius);
        drawResult(catenary, ctx);
        ctx.stroke();
    }

    // Draw brush point (the one in the middle of the brush preview)
    ctx.beginPath();
    ctx.fillStyle = drawOptions.caternary.color;
    ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
    ctx.fill();
};
export const drawPoints = (
    tempContext: CanvasRenderingContext2D,
    points: Point[],
    drawOptions: CanvasDrawOptions) => {
    if(points.length === 0) {
        return;
    }

    tempContext.lineJoin = "round";
    tempContext.lineCap = "round";
    tempContext.strokeStyle = drawOptions.brushColor;

    clearCanvas(tempContext);
    tempContext.lineWidth = drawOptions.brushRadius * 2;

    let p1 = points[0];
    let p2 = points.length >= 2 ? points[1] : points[0];

    tempContext.moveTo(p2.x, p2.y);
    tempContext.beginPath();

    for (let i = 1, len = points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = midPointBetween(p1, p2);
        tempContext.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = points[i];
        p2 = points[i + 1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    tempContext.lineTo(p1.x, p1.y);
    tempContext.stroke();
};
export const drawLines = (
    ctx: CanvasRenderingContext2D,
    lines: Line[], 
    drawOptions: CanvasDrawOptions, 
    onLineDrawn: () => void,
    { immediate = false} = {}) => {

    if(immediate) {
        for (const line of lines) {
            const { points, brushColor, brushRadius } = line;
            const lineDrawOptions: CanvasDrawOptions = {
                ...drawOptions,
                brushColor: brushColor,
                brushRadius: brushRadius
            };
            drawPoints(ctx, points, lineDrawOptions);
            onLineDrawn();
        }
    } else {
        let t = 0;
        const deltaT = immediate 
            ? 0 
            : drawOptions.drawTimeStepSizeInMilliseconds;
        for (const line of lines) {
            const { points, brushColor, brushRadius } = line;
            const lineDrawOptions: CanvasDrawOptions = {
                ...drawOptions,
                brushColor: brushColor,
                brushRadius: brushRadius
            };
            for (let i = 1; i < points.length; i++) {
                setTimeout(() => {
                    drawPoints(
                        ctx,
                        points.slice(0, i + 1),
                        lineDrawOptions);
                }, t);
                t += deltaT;
            }
            setTimeout(() => {
                onLineDrawn();
            }, t);
        }
    }
}
export const copyCanvas = (
    source: CanvasWithContext, 
    target: CanvasWithContext
) => {
    inClientSpace([source.context, target.context], () => {
        target.context.drawImage(
            source.canvas,
            0,
            0,
            target.canvas.width,
            target.canvas.height
        )
    });
}
export const setCanvasSize = (canvas: HTMLCanvasElement, width: number, height: number) => {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}
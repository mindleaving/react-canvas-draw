import { useCallback, useEffect, useMemo, useState } from "react";
import type { CanvasProps, ViewListener } from "../types/frontendTypes";
import { clearCanvas, createImage, drawGrid, drawImageToCanvas, setCanvasSize } from "../helpers/canvasDrawer";

interface GridCanvasProps extends CanvasProps {
    imgSrc?: string;
}

export const GridCanvas = (props: GridCanvasProps) => {

    const { canvasWidth, canvasHeight, coordinateSystem, drawOptions, imgSrc } = props;
    
    const [ canvas, setCanvas ] = useState<HTMLCanvasElement>();
    const context = useMemo(() => canvas?.getContext("2d"), [ canvas ]);
    const [ image, setImage ] = useState<HTMLImageElement>();

    const drawImage = useCallback((imgSrc: string) => {
        if(!context) {
            return;
        }
        const image = createImage(imgSrc, e => drawImageToCanvas({ ctx: context, img: e.target as HTMLImageElement }));
        setImage(image);
    }, [ context ]);

    useEffect(() => {
        if(!imgSrc) {
            return;
        }
        drawImage(imgSrc);
    }, [ imgSrc, drawImage ]);

    const redrawImage = useCallback(() => {
        if(!image || !image.complete || !context) {
            return;
        }
        drawImageToCanvas({ ctx: context, img: image });
    }, [ context, image ]);

    const redrawCanvas = useCallback(() => {
        if(!context) {
            return;
        }
        drawGrid(context, coordinateSystem, drawOptions);
        redrawImage();
    }, [ context, coordinateSystem, drawOptions, redrawImage]);

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
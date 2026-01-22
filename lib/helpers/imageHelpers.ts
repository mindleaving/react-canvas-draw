import { createImage } from "./canvasDrawer";

/**
   * Combination of work by Ernie Arrowsmith and emizz
   * References:
   * https://stackoverflow.com/questions/32160098/change-html-canvas-black-background-to-white-background-when-creating-jpg-image
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL

   * This function will export the canvas to a data URL, which can subsequently be used to share or manipulate the image file.
   * @param {string} fileType Specifies the file format to export to. Note: should only be the file type, not the "image/" prefix.
   *  For supported types see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
   * @param {bool} useBgImage Specifies whether the canvas' current background image should also be exported. Default is false.
   * @param {string} backgroundColour The desired background colour hex code, e.g. "#ffffff" for white.
   */
export const getDataURL = (
    canvas: HTMLCanvasElement, 
    imgSrc: string,
    fileType: string, 
    useBgImage: boolean, 
    backgroundColour: string,
    onImageLoaded: (e: Event) => void
) => {
    const context = canvas.getContext("2d")!;

    //cache height and width
    const width = canvas.width;
    const height = canvas.height;

    //get the current ImageData for the canvas
    const storedImageData = context.getImageData(0, 0, width, height);

    //store the current globalCompositeOperation
    const compositeOperation = context.globalCompositeOperation;

    //set to draw behind current content
    context.globalCompositeOperation = "destination-over";

    // If "useBgImage" has been set to true, this takes precedence over the background colour parameter
    if (useBgImage) {
        if (!imgSrc) return "Background image source not set";

        // Write the background image
        createImage(imgSrc, onImageLoaded);
    } else if (backgroundColour != null) {
        //set background color
        context.fillStyle = backgroundColour;

        //fill entire canvas with background colour
        context.fillRect(0, 0, width, height);
    }

    // If the file type has not been specified, default to PNG
    if (!fileType) fileType = "png";

    // Export the canvas to data URL
    const imageData = canvas.toDataURL(`image/${fileType}`);

    //clear the canvas
    context.clearRect(0, 0, width, height);

    //restore it with original / cached ImageData
    context.putImageData(storedImageData, 0, 0);

    //reset the globalCompositeOperation to what it was
    context.globalCompositeOperation = compositeOperation;

    return imageData;
};
import { CanvasDraw, OngoingDrawing } from '../';
import { DefaultCanvasHeight, DefaultCanvasWidth } from '../lib/helpers/constants';
import type { CanvasDrawOptions, Size } from '../lib/types/frontendTypes';
import './App.css';
import { useEffect, useMemo, useState } from 'react';

const imageUrls = [
    "https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg",
    "https://i.imgur.com/a0CGGVC.jpg"
];
const DefaultCanvasSize: Size = { width: DefaultCanvasWidth, height: DefaultCanvasHeight };
const App = () => {
    const [ color, setColor ] = useState<string>('#ffc600');
    const [ width, setWidth ] = useState<number>(400);
    const [ height, setHeight ] = useState<number>(400);
    const [ brushRadius, setBrushRadius ] = useState<number>(10);
    const [ lazyRadius, setLazyRadius ] = useState<number>(12);
    const [ backgroundImgSrc, setBackgroundImgSrc ] = useState<string>("https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg");
    const defaultDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const brushColorDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const backgroundImageDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const refreshableBackgroundImageDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const hideUiDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const zoomPanDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);
    const saveDemoDrawing = useMemo(() => new OngoingDrawing({ width, height }), []);
    const loadDemoDrawing = useMemo(() => new OngoingDrawing(DefaultCanvasSize), []);

    useEffect(() => {
        // let's change the color randomly every 2 seconds. fun!
        setInterval(() => {
            setColor("#" + Math.floor(Math.random() * 16777215).toString(16));
        }, 2000);
    }, []);

    useEffect(() => {
        if(imageUrls.length < 2) {
            return;
        }
        setInterval(() => {
            setBackgroundImgSrc(state => imageUrls.filter(img => img !== state)[0]);
        }, 2000);
    }, []);

    useEffect(() => {
        const saveData = localStorage.getItem("savedDrawing");
        if(!saveData) {
            return;
        }
        loadDemoDrawing.load(saveData);
    }, [ loadDemoDrawing ]);

    return (
    <div>
        <h1>React Canvas Draw</h1>
        <iframe
            title="GitHub link"
            src="https://ghbtns.com/github-btn.html?user=embiem&repo=react-canvas-draw&type=star&count=true"
            width="160px"
            height="30px"
        />
        <h2>default</h2>
        <p>
            This is a simple <span>{`<CanvasDraw />`}</span> component with
            default values.
        </p>
        <p>Try it out! Draw on this white canvas:</p>
        <CanvasDraw drawing={defaultDrawing} />
        <h2>Custom Brush-Color</h2>
        <p>
            Let's spice things up by using custom brush colors{" "}
            <span>{`<CanvasDraw brushColor={color} />`}</span>. We
            randomly change them every 2 seconds. But you could easily use a
            color-picker!
        </p>
        <div>
            Current color:{" "}
            <div
                style={{
                    display: "inline-block",
                    width: "24px",
                    height: "24px",
                    backgroundColor: color,
                    border: "1px solid #272727"
                }}
            />
        </div>
        <CanvasDraw drawing={brushColorDrawing} drawOptions={{ brushColor: color }} />
        <h2>Background Image</h2>
        <p>You can also set the `imgSrc` prop to draw on a background-image.</p>
        <p>
            It will automatically resize to fit the canvas and centered vertically
            & horizontally.
        </p>
        <CanvasDraw
            drawing={backgroundImageDrawing}
            drawOptions={{
                brushColor: "rgba(155,12,60,0.3)"
            }}
            imgSrc="https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg"
        />

        <h2>Refreshable Background Image</h2>
        <p>This will refresh the background in every two seconds.</p>
        <CanvasDraw
            drawing={refreshableBackgroundImageDrawing}
            drawOptions={{ brushColor: "rgba(155,12,60,0.3)" }}
            imgSrc={backgroundImgSrc}
        />
        <h2>Hide UI</h2>
        <p>To hide the UI elements, set the `hideInterface` prop. You can also hide the grid with the `hideGrid` prop.</p>
        <CanvasDraw drawing={hideUiDrawing} drawOptions={{ hideInterface: true, grid: { hideGrid: true }}} />
        <h2>Zoom & Pan</h2>
        <p>
            Set the <span>enablePanAndZoom</span> prop to enable mouse scrolling
            and panning (using Ctrl), pinch zooming, and two-finger panning. If
            you want to ensure that all lines stay within the bounds of the
            canvas, set the <span>clampLinesToDocument</span> property.
        </p>
        <CanvasDraw
            drawing={zoomPanDrawing}
            drawOptions={{
                enablePanAndZoom: true,
                clampLinesToDocument: true,
                grid: {
                    gridColor: "#ccc"
                }
            }}
            imgSrc="https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg"
        />
        <h2>Save & Load</h2>
        <p>
            This part got me most excited. Very easy to use saving and loading of
            drawings. It even comes with a customizable loading speed to control
            whether your drawing should load instantly (loadTimeOffset = 0) or
            appear after some time (loadTimeOffset &gt; 0){" "}
            <span>{`<CanvasDraw loadTimeOffset={10} />`}</span>
        </p>
        <p>Try it out! Draw something, hit "Save" and then "Load".</p>
        <div className="tools">
            <button
                onClick={() => {
                    localStorage.setItem(
                        "savedDrawing",
                        saveDemoDrawing.serialize()
                    );
                }}
            >
                Save
            </button>
            <button
                onClick={() => {
                    saveDemoDrawing.eraseAll();
                }}
            >
                Erase
            </button>
            <button
                onClick={() => {
                    saveDemoDrawing.undo();
                }}
            >
                Undo
            </button>
            {/* <button
                onClick={() => {
                    console.log(saveableCanvas.current!.getDataURL());
                    alert("DataURL written to console")
                }}
            >
                GetDataURL
            </button> */}
            <div>
                <label>Width:</label>
                <input
                    type="number"
                    value={width}
                    onChange={e => setWidth(parseInt(e.target.value, 10))}
                />
            </div>
            <div>
                <label>Height:</label>
                <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(parseInt(e.target.value, 10))}
                />
            </div>
            <div>
                <label>Brush-Radius:</label>
                <input
                    type="number"
                    value={brushRadius}
                    onChange={e => setBrushRadius(parseInt(e.target.value, 10))}
                />
            </div>
            <div>
                <label>Lazy-Radius:</label>
                <input
                    type="number"
                    value={lazyRadius}
                    onChange={e => setLazyRadius(parseInt(e.target.value, 10))}
                />
            </div>
        </div>
        <CanvasDraw
            drawing={saveDemoDrawing}
            canvasWidth={width}
            canvasHeight={height}
            drawOptions={{
                brushColor: color,
                brushRadius: brushRadius,
                caternary: {
                    radius: lazyRadius
                }
            } as Partial<CanvasDrawOptions>}
        />
        <p>
            The following is a disabled canvas with a hidden grid that we use to
            load & show your saved drawing.
        </p>
        <button
            onClick={() => {
                const savedDataJson = localStorage.getItem("savedDrawing");
                if(!savedDataJson) {
                    return;
                }
                loadDemoDrawing.load(savedDataJson);
            }}
        >
            Load what you saved previously into the following canvas. Either by
            calling `loadSaveData()` on the component's reference or passing it
            the `saveData` prop:
        </button>
        <CanvasDraw
            drawing={loadDemoDrawing}
            drawOptions={{
                disabled: true,
                grid: {
                    hideGrid: true
                }
            }}
        />
        <p>
            The saving & loading also takes different dimensions into account.
            Change the width & height, draw something and save it and then load it
            into the disabled canvas. It will load your previously saved
            masterpiece scaled to the current canvas dimensions.
        </p>
        <p>
            That's it for now! Take a look at the{" "}
            <a href="https://github.com/mBeierl/react-canvas-draw/tree/master/demo/src">
                source code of these examples
            </a>
            .
        </p>
    </div>);
}

export default App;

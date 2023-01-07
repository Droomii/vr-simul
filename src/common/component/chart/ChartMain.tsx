import {useEffect, useRef} from "react";
import styles from './ChartMain.module.scss'
import Candle from "./elements/Candle";
import ChartRoot from "./elements/ChartRoot";
import ChartController from "./controller/ChartController";
import XTick from "./elements/XTick";
import MovingAvgLine from "./elements/MovingAvgLine";

const ChartMain = ({root}: { root: ChartRoot }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const chartCtrl = new ChartController(root, ctx, {normalize: true});
        new XTick(chartCtrl);
        const candle = new Candle(chartCtrl);
        new MovingAvgLine(chartCtrl, 30);
        new MovingAvgLine(chartCtrl, 60, 'blue');
        new MovingAvgLine(chartCtrl, 200, 'green');

        const {refresh} = root;

        const mouseDownHandler = (e: MouseEvent) => {
            const handleChangeOffset = candle.getOffsetSetter();
            const startX = e.x;
            let movementX = 0;
            let lastX = 0;

            const moveHandler = (e: MouseEvent) => {
                const changed = handleChangeOffset(startX - e.x)
                movementX = e.movementX;
                lastX = e.x;
                changed && refresh();
            }

            canvas.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', () => {
                canvas.removeEventListener('mousemove', moveHandler)
                let stop = false;
                window.addEventListener('mousedown', () => {
                    stop = true;
                }, {once: true})

                const inertiaHandler = () => {
                    if (Math.abs(movementX) > 0.2 && !stop) {
                        lastX += movementX * 2
                        stop = handleChangeOffset(startX - lastX + Math.floor(movementX), true)
                        movementX += movementX > 0 ? -0.2 : 0.2;
                        refresh()
                        requestAnimationFrame(inertiaHandler)
                    }
                }
                inertiaHandler()
            }, {once: true})
        }

        const wheelHandler = (e: WheelEvent) => {
            candle.handleZoom(e.deltaY, e.x - canvas.getBoundingClientRect().left);
            refresh();
        }

        canvas.addEventListener('wheel', wheelHandler)

        canvas.addEventListener('mousedown', mouseDownHandler)

        window.addEventListener('resize', refresh);
        refresh();

        return () => {
            window.removeEventListener('resize', refresh);
            canvas.removeEventListener('mousedown', mouseDownHandler)
            canvas.removeEventListener('wheel', wheelHandler)
            chartCtrl.destroy();
        }
    }, [])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default ChartMain;
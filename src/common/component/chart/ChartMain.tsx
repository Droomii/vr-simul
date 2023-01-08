import {useEffect, useRef} from "react";
import styles from './ChartMain.module.scss'
import Candle from "./elements/Candle";
import ChartRoot from "./elements/ChartRoot";
import ChartController from "./controller/ChartController";
import XTick from "./elements/XTick";
import TimeGrid from "./elements/TimeGrid";
import Line from "./elements/Line";
import Util from "../../../util/Util";
import SubController from "./controller/SubController";

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
        const chartCtrl = new ChartController(root, ctx, {log: true});

        new TimeGrid(chartCtrl, {unit: 'week'});
        new XTick(chartCtrl);
        new Candle(chartCtrl);

        const subCtrl = new SubController(chartCtrl, {log: true});
        new Line(subCtrl, (v, i) => {
            const week = Math.floor(Util.getWeek(v.date) / 2);
            return week * 250;
        })

        const {refresh} = root;

        let isMouseDown = false;

        const mouseDownHandler = (e: MouseEvent) => {
            isMouseDown = true;
            const handleChangeOffset = chartCtrl.getOffsetSetter();
            const startX = e.x;
            let movementX = 0;
            let lastX = 0;
            let isMoving = false;

            const moveDecay = () => {
                if (Math.abs(movementX) < 5) {
                    movementX = 0;
                } else {
                    movementX /= 1.2;
                }

                if (isMouseDown) {
                    requestAnimationFrame(moveDecay);
                }
            }

            moveDecay();
            const moveHandler = (e: MouseEvent) => {
                if (isMoving) {
                    return;
                }
                isMoving = true;
                const changed = handleChangeOffset(startX - e.x)
                movementX = (movementX + e.movementX);
                lastX = e.x;
                changed && refresh();
                requestAnimationFrame(() => {
                    isMoving = false;
                })
            }

            canvas.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', () => {
                isMouseDown = false;
                canvas.removeEventListener('mousemove', moveHandler)
                let stop = false;
                window.addEventListener('mousedown', () => {
                    stop = true;
                }, {once: true})

                const inertiaHandler = () => {
                    if (Math.abs(movementX) >= 1 && !stop) {
                        lastX += movementX
                        stop = handleChangeOffset(startX - lastX + Math.floor(movementX), true)
                        movementX += movementX > 0 ? -1 : 1;
                        refresh()
                        requestAnimationFrame(inertiaHandler)
                    }
                }
                inertiaHandler()
            }, {once: true})
        }

        const wheelHandler = (e: WheelEvent) => {
            chartCtrl.handleZoom(e.deltaY, e.x - canvas.getBoundingClientRect().left);
            refresh();
        }

        canvas.addEventListener('wheel', wheelHandler)

        canvas.addEventListener('mousedown', mouseDownHandler)

        window.addEventListener('resize', refresh);
        chartCtrl.refresh();
        return () => {
            window.removeEventListener('resize', refresh);
            canvas.removeEventListener('mousedown', mouseDownHandler)
            canvas.removeEventListener('wheel', wheelHandler)
            chartCtrl.destroy();
        }
    }, [root])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default ChartMain;
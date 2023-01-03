import {useEffect, useRef} from "react";
import styles from './ChartMain.module.scss'
import Candle from "./elements/Candle";
import TQQQ from "../../../stockData/TQQQ";

const ChartMain = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const candle = new Candle(ctx);
        candle.setData(TQQQ)

        const draw = () => {
            // set the width and height of the canvas
            const {width, height} = wrapper.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
            candle.draw()
        }

        const mouseDownHandler = (e: MouseEvent) => {
            const handleChangeOffset = candle.getOffsetSetter();
            const startX = e.x;
            const moveHandler = (e: MouseEvent) => {
                handleChangeOffset(startX - e.x)
                draw();
            }

            canvas.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', () => {
                canvas.removeEventListener('mousemove', moveHandler)
            }, {once: true})
        }

        canvas.addEventListener('mousedown', mouseDownHandler)

        window.addEventListener('resize', draw);
        draw();

        return () => {
            window.removeEventListener('resize', draw);
            canvas.removeEventListener('mousedown', mouseDownHandler)
        }
    }, [ref.current])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default ChartMain;
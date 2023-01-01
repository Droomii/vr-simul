import {useEffect, useRef} from "react";
import styles from './Chart.module.scss'
import Candle from "./elements/Candle";
import IStockData from "../../../define/IStockData";
import TQQQ from "../../../stockData/TQQQ";

const Chart = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            // set the width and height of the canvas
            const {width, height} = wrapper.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
            const candle = new Candle(ctx);

            const padding = 50;
            ctx.fillStyle = 'lightgray'
            ctx.fillRect(50, 50, width - padding * 2, height - padding * 2);

            const [chartX, chartY, chartWidth, chartHeight] = [padding + 1, padding + 1, width - padding * 2 - 2, height - padding * 2 - 2]
            ctx.fillStyle = 'white'
            ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

            candle.setContainer(chartX, chartY, chartWidth, chartHeight);

            const stockData = Array(200).fill(0).reduce<IStockData[]>((acc) => {
                const oldClose = acc.at(-1)?.close ?? 10;
                const open = oldClose * (0.95 + Math.random() * 0.1)
                const close = oldClose * (0.95 + Math.random() * 0.1)
                const high = Math.max(open, close) * (1 + Math.random() * 0.05);
                const low = Math.min(open, close) * (1 - Math.random() * 0.05);
                acc.push({
                    open, close, high, low
                })
                return acc;
            }, [])

            candle.draw(TQQQ.slice(-200))

        }

        window.addEventListener('resize', draw);
        draw();

        return () => {
            ctx.lineWidth = 400;
            window.removeEventListener('resize', draw);
        }
    }, [ref.current])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default Chart;
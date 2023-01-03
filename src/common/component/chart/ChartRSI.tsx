import Util from "../../../util/Util";
import TQQQ from "../../../stockData/TQQQ";
import {useEffect, useRef} from "react";
import styles from "./ChartMain.module.scss";

const ChartRSI = () => {
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
            const data = TQQQ.slice(-200);
            const rsi = data.map((v, i) => Util.dropDecimal(Util.getRsi(TQQQ.slice(i - 14, i).map(v => v.close)), 2));

            // draw RSI
            ctx.beginPath();
            ctx.moveTo(0, height - height * rsi[0] / 100);
            ctx.strokeStyle = "red";

            rsi.forEach(( v, i) => {
                ctx.lineTo((i+1) * 4 - 3, height - height * v / 100);
            })

            ctx.lineTo(width, height - height - height * (rsi.at(-1) ?? 0) / 100)
            ctx.stroke();
            ctx.closePath();

        }

        window.addEventListener('resize', draw);
        draw();

        return () => {
            window.removeEventListener('resize', draw);
        }
    }, [])




    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default ChartRSI;
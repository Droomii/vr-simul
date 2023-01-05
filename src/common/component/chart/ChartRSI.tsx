import Util from "../../../util/Util";
import TQQQ from "../../../stockData/TQQQ";
import {useEffect, useRef} from "react";
import styles from "./ChartMain.module.scss";
import ChartRoot from "./elements/ChartRoot";
import RSI from "./elements/RSI";
import ChartController from "./controller/ChartController";

const ChartRSI = ({root}: {root: ChartRoot}) => {
    const ref = useRef<HTMLCanvasElement>(null);


    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const ctrl = new ChartController(root, ctx);
        new RSI(ctrl, (v, i) => Util.dropDecimal(Util.getRsi(TQQQ.slice(i - 14, i).map(v => v.close)), 2));

        const draw = () => {
            root.refresh();
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
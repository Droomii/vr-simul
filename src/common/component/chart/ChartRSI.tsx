import Util from "../../../util/Util";
import {useEffect, useRef} from "react";
import styles from "./ChartMain.module.scss";
import RSI from "./elements/RSI";
import ChartController from "./controller/ChartController";
import useChartContext from "../../../context/useChartContext";

const ChartRSI = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const root = useChartContext();

    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const ctrl = new ChartController(root, ctx);
        new RSI(ctrl, data => data.map((v, i, arr) => Util.dropDecimal(Util.getRsi(arr.slice(i - 14, i).map(v => v.close)), 2)));
        ctrl.refresh();
        return () => {
            ctrl.destroy();
        }
    }, [root])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
    </div>
}

export default ChartRSI;
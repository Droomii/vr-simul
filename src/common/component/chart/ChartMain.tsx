import {useEffect, useRef, useState} from "react";
import styles from './ChartMain.module.scss'
import Util from "../../../util/Util";
import IVRHistory from "../../../define/IVRHistory";
import useChartContext from "../../../context/useChartContext";
import IStockHistory from "../../../define/IStockHistory";
import TQQQ_virtual from "../../../stockData/TQQQ_virtual";
import ChartRoot from './elements/ChartRoot';

const root = new ChartRoot();

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

    const chartCtrl = root.addController(ctx, {log: true, debug: 'main'});

    TQQQ_virtual.then(data => {
      root.loadData(data, () => {
        chartCtrl.addElement('timeGrid', {unit: 'year'})
        chartCtrl.addElement('yTick');
        chartCtrl.addElement('candle', {
          riseBoxColor: "rgba(203,104,105,0.47)",
          riseWickColor: "rgba(229,26,28,0.45)",
          fallBoxColor: "rgba(15,124,196,0.44)",
          fallWickColor: "rgba(33,140,211,0.42)",
        })
      });
    })

    return root.cleanup;
  }, [])

  return <div className={styles.wrapper}>
    <canvas ref={ref}/>
  </div>
}

export default ChartMain;
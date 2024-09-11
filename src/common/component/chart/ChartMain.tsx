import {useEffect, useRef, useState} from "react";
import {ITradeHistory} from '../../../define/ITradeHistory';
import styles from './ChartMain.module.scss'
import Util from "../../../util/Util";
import useChartContext from "../../../context/useChartContext";
import IStockHistory from "../../../define/IStockHistory";
import TQQQ_virtual from "../../../stockData/TQQQ_virtual";

const ChartMain = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const {state: {root, settings}} = useChartContext();
  const [mousePosData, setMousePosData] = useState<{ x: number, y: number, index: number, price: number, vrData: ITradeHistory, stockData: IStockHistory } | null>(null);
  useEffect(() => {
    const {current: canvas} = ref;
    if (!canvas) return;

    const wrapper = canvas.parentElement;
    if (!wrapper) return;

    // get the context for the canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    root.startDate = settings.startDate;
    root.endDate = settings.endDate;
    const chartCtrl = root.addController(ctx, {log: true, debug: 'main'});

    TQQQ_virtual.then(data => {
      root.loadData(data, () => {
        chartCtrl.addElement('timeGrid', {unit: 'year'})
        chartCtrl.addElement('stockSplit', data => data.map(v => v.split ?? null));
        chartCtrl.addElement('yTick');
        chartCtrl.addElement('candle', {
          riseBoxColor: "rgb(229,26,28)",
          riseWickColor: "rgb(229,26,28)",
          fallBoxColor: "rgb(33,140,211)",
          fallWickColor: "rgb(33,140,211)",
        })

        const startAsset = settings.startStock;
        const firstCount = Math.floor(startAsset / (root.data[0].close * root.data[0].ratio));
        const firstValue = firstCount * root.data[0].close * root.data[0].ratio;
        const firstPool = settings.startPool + startAsset - firstValue;
        const firstUsablePool = firstPool * settings.getPoolLimit(0);
        const firstSavedPool = firstPool - firstUsablePool

        let lastWeek = 0
        let lastHistory: ITradeHistory = {
          costBasis: 0,
          count: 0
        }

        const tradeHistory: ITradeHistory[] = root.data.map((v, i) => {
          const totalAsset = lastHistory.costBasis * lastHistory.count;
          lastHistory.count++
          lastHistory.costBasis = (totalAsset + v.close) / lastHistory.count

          return {
            ...lastHistory
          }
        })


        chartCtrl.addElement('line', data => data.map((v, i) => {
          // if (Math.floor(i / 10) % 2) {
          //   return null;
          // }
          return tradeHistory[i].costBasis
        }), )

        /*chartCtrl.addElement('line', data => data.map((v, i, arr) => {
          return arr.slice(i - 40, i).reduce((acc, v) => acc + v.close, 0) / 40
        }), {excludeRange: true})*/

/*
        // 원금
        subCtrl.addElement('line', data => {
          return data.map((v, i) => vrHistory[i].totalDeposit)
        }, {stroke: 'black', square: true, excludeRange: true})

        // 주식
        subCtrl.addElement('lineArea', (data) => {
          return data.map(({close, ratio}, i) => {
            const vr = vrHistory[i];
            return {
              top: vr.usablePool + vr.savedPool + vr.stockCount * close * ratio,
              bottom: vr.usablePool + vr.savedPool
            };
          })
        }, {bottomStroke: 'transparent'})

        // use pool
        subCtrl.addElement('lineArea', (data) => {
          return data.map(({close}, i) => {
            const vr = vrHistory[i];
            return {top: vr.usablePool + vr.savedPool, bottom: vr.savedPool};
          })
        }, {topStroke: 'none', bottomStroke: 'none', fill: 'rgba(255,213,74,0.27)'})

        // inactive pool
        subCtrl.addElement('lineArea', (data) => {
          return data.map(({close}, i) => {
            const vr = vrHistory[i];
            return {top: vr.savedPool, bottom: 0};
          })
        }, {topStroke: 'none', bottomStroke: 'none', fill: 'rgba(0,150,8,0.27)'})

        // 타겟 v
        subCtrl.addElement('line', () => vrHistory.map(v => v.targetValue + v.usablePool + v.savedPool), {
          stroke: '#ff0000',
          square: true
        })
        // 밴드
        subCtrl.addElement('lineArea', () => vrHistory.map(v => {
          const totalTarget = v.targetValue + v.usablePool + v.savedPool
          return ({top: totalTarget * (1 + settings.band / 100), bottom: totalTarget * (1 - settings.band / 100)})
        }), {bottomStroke: 'orange', fill: 'rgba(255,203,146,0.2)', topStroke: 'orange', square: true})
*/

        // event listeners
        chartCtrl.setEventListener('mouseout', () => {
          setMousePosData(null)
        })

        chartCtrl.setEventListener('mousedown', () => {
          setMousePosData(null)
        })

        chartCtrl.setEventListener('mousemove', ({mouseY, mouseX, data, dataIndex}) => {
          setMousePosData({
            index: dataIndex,
            x: mouseX,
            y: mouseY,
            price: chartCtrl.getMousePosData({x: mouseX, y: mouseY}).valueX * data.ratio,
            vrData: tradeHistory[dataIndex],
            stockData: data
          });
        })
      });
    })

    return root.cleanup;
  }, [settings])

  const label = (() => {
    if (!(mousePosData && root.data[mousePosData.index])) {
      return null;
    }

    const date = new Date(root.data[mousePosData.index].date).toISOString().substring(0, 10);
    const close = Util.dropDecimal(mousePosData.stockData.close * mousePosData.stockData.ratio, 2);
    return {
      date,
      close,
    }
  })();
  return <div className={styles.wrapper}>
    <canvas ref={ref}/>
    {mousePosData && label && root.data[mousePosData.index] && <>
        <div className={styles.xLine} style={{top: 0, left: mousePosData.x}}>
        </div>
        <div className={styles.yLine} style={{top: mousePosData.y, left: 0}}>
            <div>${Util.dropDecimal(mousePosData.price, 2).toLocaleString()}</div>
        </div>
        <div className={styles.labelWrap} style={{
          top: mousePosData.y,
          left: mousePosData.x,
          transform: `translate(-${mousePosData.x > 300 ? 100 : 0}%, -${mousePosData.y > 300 ? 100 : 0}%)`
        }}>
            <div className={styles.label}>
                <div>{label.date}</div>
                <div>종가: ${label.close.toLocaleString()}</div>
            </div>
        </div>
    </>}
  </div>
}

export default ChartMain;
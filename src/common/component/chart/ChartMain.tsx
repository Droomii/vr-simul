import {useEffect, useRef, useState} from "react";
import styles from './ChartMain.module.scss'
import Util from "../../../util/Util";
import IVRHistory from "../../../define/IVRHistory";
import useChartContext from "../../../context/useChartContext";
import IStockHistory from "../../../define/IStockHistory";
import TQQQ_virtual from "../../../stockData/TQQQ_virtual";

const ChartMain = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const {state: {root, settings}} = useChartContext();
  const [mousePosData, setMousePosData] = useState<{ x: number, y: number, index: number, price: number, vrData: IVRHistory, stockData: IStockHistory } | null>(null);
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
          riseBoxColor: "rgba(203,104,105,0.47)",
          riseWickColor: "rgba(229,26,28,0.45)",
          fallBoxColor: "rgba(15,124,196,0.44)",
          fallWickColor: "rgba(33,140,211,0.42)",
        })

        const subCtrl = chartCtrl.addSubController({log: false});

        const startAsset = settings.startStock;
        const firstCount = Math.floor(startAsset / (root.data[0].close * root.data[0].ratio));
        const firstValue = firstCount * root.data[0].close * root.data[0].ratio;
        const firstPool = settings.startPool + startAsset - firstValue;
        const firstUsablePool = firstPool * settings.getPoolLimit(0);
        const firstSavedPool = firstPool - firstUsablePool

        const firstWeek = Math.floor(Util.getWeek(root.data[0].date) / settings.weekCycleUnit);
        let lastWeek = 0
        let lastVR: IVRHistory = {
          week: lastWeek,
          savedPool: firstSavedPool,
          costBasis: root.data[0].close * root.data[0].ratio,
          usablePool: firstUsablePool,
          stockCount: firstCount,
          targetValue: firstValue,
          totalDeposit: startAsset + settings.startPool,
          poolDiff: 0,
          countDiff: 0
        }

        const vrHistory: IVRHistory[] = root.data.map((v, i) => {
          const week = Math.floor(Util.getWeek(v.date) / settings.weekCycleUnit) - firstWeek;
          if (v.split) {
            lastVR.costBasis /= v.split;
            lastVR.stockCount *= v.split;
            const leftover = lastVR.stockCount - Math.floor(lastVR.stockCount);
            lastVR.stockCount -= leftover;
            lastVR.savedPool += leftover * v.close * v.ratio;
          }
          const marketValue = v.close * v.ratio * lastVR.stockCount
          if (week !== lastWeek) {
            const totalPool = lastVR.savedPool + lastVR.usablePool;
            const gradient = settings.getGradient(week * settings.weekCycleUnit);
            const newPool = Math.max(totalPool + settings.getCycleDeposit(week), 0);
            const nextValue = Math.max(lastVR.targetValue + totalPool / gradient + (settings.isAdvancedFormula ? (marketValue - lastVR.targetValue) / (2 * Math.sqrt(gradient)) : 0) + settings.getCycleDeposit(week), 0);
            const newSavedPool = newPool * (1 - settings.getPoolLimit(week * settings.weekCycleUnit));
            const newUsablePool = newPool - newSavedPool;
            lastVR.totalDeposit = Math.max(lastVR.totalDeposit + settings.getCycleDeposit(week), 0)

            lastWeek = week;
            lastVR = {
              ...lastVR,
              week: lastWeek,
              targetValue: nextValue,
              savedPool: newSavedPool,
              usablePool: newUsablePool,
              poolDiff: 0,
              countDiff: 0
            }
          }

          const bandRange = settings.band / 100;

          const ceilingValue = lastVR.targetValue * (1 + bandRange);
          const bottomValue = lastVR.targetValue * (1 - bandRange);

          if (marketValue > ceilingValue) {
            const overpriced = marketValue - ceilingValue;
            const overpriceCount = Math.floor(overpriced / (v.close * v.ratio));
            const sold = overpriceCount * v.close * v.ratio;

            lastVR.savedPool += sold;
            lastVR.stockCount -= overpriceCount;
            lastVR.poolDiff += sold;
            lastVR.countDiff -= overpriceCount;
          }

          if (marketValue < bottomValue) {
            const underpriced = Math.min(bottomValue - marketValue, lastVR.usablePool);
            const underpriceCount = Math.floor(underpriced / (v.close * v.ratio));
            const bought = underpriceCount * v.close * v.ratio;
            lastVR.costBasis = (lastVR.costBasis * lastVR.stockCount + bought) / (lastVR.stockCount + underpriceCount)
            lastVR.stockCount += underpriceCount;
            lastVR.usablePool -= bought;
            lastVR.poolDiff -= bought;
            lastVR.countDiff += underpriceCount;
          }

          return {
            ...lastVR
          }
        })

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
            price: subCtrl.getMousePosData({x: mouseX, y: mouseY}).valueX,
            vrData: vrHistory[dataIndex],
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
    const week = mousePosData.vrData.week * settings.weekCycleUnit;
    const totalDeposit = mousePosData.vrData.totalDeposit;
    const pool = Util.dropDecimal(mousePosData.vrData.savedPool + mousePosData.vrData.usablePool, 2);
    const stockCount = mousePosData.vrData.stockCount;
    const marketPrice = Util.dropDecimal(mousePosData.vrData.stockCount * mousePosData.stockData.close * mousePosData.stockData.ratio, 2);
    const totalValue = pool + marketPrice
    const targetValue = Util.dropDecimal(mousePosData.vrData.targetValue, 2);
    const targetValueRate = Util.dropDecimal((marketPrice / mousePosData.vrData.targetValue - 1) * 100, 2);
    const poolDiff = Util.dropDecimal(mousePosData.vrData.poolDiff, 2);
    const countDiff = Util.dropDecimal(mousePosData.vrData.countDiff, 2);
    const costBasis = Util.dropDecimal(mousePosData.vrData.costBasis, 2);
    const close = Util.dropDecimal(mousePosData.stockData.close * mousePosData.stockData.ratio, 2);
    const rate = Util.dropDecimal((totalValue / totalDeposit - 1) * 100, 2)
    const gradient = settings.getGradient(week);
    const poolLimit = Math.round(settings.getPoolLimit(week) * 100);
    return {
      date,
      week,
      totalDeposit,
      pool,
      stockCount,
      marketPrice,
      totalValue,
      poolDiff,
      countDiff,
      costBasis,
      close,
      rate,
      gradient,
      poolLimit,
      targetValue,
      targetValueRate
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
                <div>{label.date} ({label.week}주차)</div>
                <div>원금: ${label.totalDeposit.toLocaleString()}</div>
                <div>Pool:
                    ${label.pool.toLocaleString()} {!!label.poolDiff && <span
                        style={{color: label.countDiff > 0 ? 'blue' : 'red'}}>({label.poolDiff > 0 ? '+' : '-'}${Math.abs(label.poolDiff).toLocaleString()})</span>}</div>
                <div>수량: {label.stockCount.toLocaleString()}주 {!!label.countDiff && <span
                    style={{color: label.countDiff > 0 ? 'red' : 'blue'}}>({label.countDiff > 0 && '+'}{label.countDiff.toLocaleString()})</span>}</div>
                <div>목표 V: ${label.targetValue.toLocaleString()}</div>
                <div>종가: ${label.close.toLocaleString()}</div>
                <div>TQQQ 평가금:
                    ${label.marketPrice.toLocaleString()}</div>
                <div>목표 V 대비 <span
                    style={{color: label.targetValueRate > 0 ? 'red' : 'blue'}}>{label.targetValueRate > 0 && '+'}{label.targetValueRate}%</span>
                </div>
                <div>G: {label.gradient}</div>
                <div>Pool 한도: {label.poolLimit}%</div>
                <div>총평가금:
                    ${label.totalValue.toLocaleString()}<span
                        style={{color: label.rate > 0 ? 'red' : 'blue'}}>({label.rate > 0 && '+'}{label.rate.toLocaleString()}%)</span>
                </div>
            </div>
        </div>
    </>}
  </div>
}

export default ChartMain;
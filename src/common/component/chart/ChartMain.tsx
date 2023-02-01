import {useEffect, useRef, useState} from "react";
import styles from './ChartMain.module.scss'
import Candle from "./elements/Candle";
import ChartController from "./controller/ChartController";
import XTick from "./elements/XTick";
import TimeGrid from "./elements/TimeGrid";
import Util from "../../../util/Util";
import SubController from "./controller/SubController";
import LineArea from "./elements/LineArea";
import Line from "./elements/Line";
import IVRHistory from "../../../define/IVRHistory";
import useChartContext from "../../../context/useChartContext";
import IStockHistory from "../../../define/IStockHistory";

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
        root.loadData('TQQQ', () => {
            const chartCtrl = new ChartController(root, ctx, {log: true});

            new TimeGrid(chartCtrl, {unit: 'year'});
            new XTick(chartCtrl);
            new Candle(chartCtrl, {
                riseBoxColor: "rgba(203,104,105,0.47)",
                riseWickColor: "rgba(229,26,28,0.45)",
                fallBoxColor: "rgba(15,124,196,0.44)",
                fallWickColor: "rgba(33,140,211,0.42)",
            });

            const subCtrl = new SubController(chartCtrl, {log: false});

            const startAsset = settings.startAsset;
            const firstCount = Math.floor(startAsset / (root.data[0].close * root.data[0].ratio));
            const firstValue = firstCount * root.data[0].close * root.data[0].ratio;
            const firstPool = startAsset - firstValue;

            const firstWeek = Math.floor(Util.getWeek(root.data[0].date) / 2);
            let lastWeek = 0
            let lastVR: IVRHistory = {
                week: lastWeek,
                savedPool: 0,
                costBasis: root.data[0].close * root.data[0].ratio,
                usablePool: firstPool,
                stockCount: firstCount,
                targetValue: firstValue,
                totalDeposit: startAsset,
                poolDiff: 0,
                countDiff: 0
            }

            const vrHistory: IVRHistory[] = root.data.map((v, i) => {
                const week = Math.floor(Util.getWeek(v.date) / settings.weekCycleUnit) - firstWeek;
                if (v.split) {
                    lastVR.costBasis /= v.split;
                    lastVR.stockCount *= v.split;
                }
                const marketValue = v.close * v.ratio * lastVR.stockCount
                if (week !== lastWeek) {
                    const totalPool = lastVR.savedPool + lastVR.usablePool;
                    const gradient = settings.getGradient(week * settings.weekCycleUnit);
                    const newPool = Math.max(totalPool + settings.getCycleDeposit(week), 0);
                    const nextValue = Math.max(lastVR.targetValue + totalPool / gradient + (marketValue - lastVR.targetValue) / (2 * Math.sqrt(gradient)) + settings.getCycleDeposit(week), 0);
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

                const bandRange = 0.15;

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
            new Line(subCtrl, data => {
                return data.map((v, i) => vrHistory[i].totalDeposit)
            }, {stroke: 'black', square: true})

            // 주식
            new LineArea(subCtrl, (data) => {
                return data.map(({close, ratio}, i) => {
                    const vr = vrHistory[i];
                    return {
                        top: vr.usablePool + vr.savedPool + vr.stockCount * close * ratio,
                        bottom: vr.usablePool + vr.savedPool
                    };
                })
            }, {bottomStroke: 'transparent'})

            // use pool
            new LineArea(subCtrl, (data) => {
                return data.map(({close}, i) => {
                    const vr = vrHistory[i];
                    return {top: vr.usablePool + vr.savedPool, bottom: vr.savedPool};
                })
            }, {topStroke: 'none', bottomStroke: 'none', fill: 'rgba(255,213,74,0.27)'})

            // inactive pool
            new LineArea(subCtrl, (data) => {
                return data.map(({close}, i) => {
                    const vr = vrHistory[i];
                    return {top: vr.savedPool, bottom: 0};
                })
            }, {topStroke: 'none', bottomStroke: 'none', fill: 'rgba(0,150,8,0.27)'})

            // 타겟 v
            new Line(subCtrl, () => vrHistory.map(v => v.targetValue + v.usablePool + v.savedPool), {
                stroke: '#ff0000',
                square: true
            })
            // 밴드
            new LineArea(subCtrl, () => vrHistory.map(v => {
                const totalTarget = v.targetValue + v.usablePool + v.savedPool
                return ({top: totalTarget * 1.15, bottom: totalTarget * 0.85})
            }), {bottomStroke: 'orange', fill: 'rgba(255,203,146,0.2)', topStroke: 'orange', square: true})

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
                    canvas.removeEventListener('mousemove', crossHandler);
                    canvas.addEventListener('mousemove', crossHandler);

                    isMouseDown = false;
                    canvas.removeEventListener('mousemove', moveHandler)
                    let stop = false;
                    window.addEventListener('mousedown', () => {
                        canvas.removeEventListener('mousemove', crossHandler);
                        setMousePosData(null);
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

            let moveThrottle = false;
            const crossHandler = (e: MouseEvent) => {
                if (moveThrottle) return;
                moveThrottle = true;
                const {x, y} = canvas.getBoundingClientRect();
                const posData = subCtrl.getMousePosData({x: e.x - x, y: e.y - y});

                setMousePosData({...posData, vrData: vrHistory[posData.index], stockData: root.data[posData.index]});
                requestAnimationFrame(() => moveThrottle = false)
            }

            canvas.addEventListener('mousemove', crossHandler)


            chartCtrl.refresh();
            return () => {
                window.removeEventListener('resize', refresh);
                canvas.removeEventListener('mousedown', mouseDownHandler)
                canvas.removeEventListener('wheel', wheelHandler)
                canvas.removeEventListener('mousemove', crossHandler)
            }
        });

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
        const poolDiff = Util.dropDecimal(mousePosData.vrData.poolDiff, 2);
        const countDiff = Util.dropDecimal(mousePosData.vrData.countDiff, 2);
        const costBasis = Util.dropDecimal(mousePosData.vrData.costBasis, 2);
        const close = Util.dropDecimal(mousePosData.stockData.close * mousePosData.stockData.ratio, 2);
        const rate = Util.dropDecimal((totalValue / totalDeposit - 1) * 100, 2)
        return {date, week, totalDeposit, pool, stockCount, marketPrice, totalValue, poolDiff, countDiff, costBasis, close, rate}
    })();

    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
        {mousePosData && label && root.data[mousePosData.index] && <>
            <div className={styles.xLine} style={{top: 0, left: mousePosData.x}}>
            </div>
            <div className={styles.yLine} style={{top: mousePosData.y, left: 0}}>
                <div>${Util.dropDecimal(mousePosData.price, 2).toLocaleString()}</div>
            </div>
            <div className={styles.label} style={{top: mousePosData.y + 10, left: mousePosData.x + 10}}>
                <div>{label.date} ({label.week}주차)</div>
                <div>원금: ${label.totalDeposit.toLocaleString()}</div>
                <div>Pool:
                    ${label.pool.toLocaleString()} {!!label.poolDiff && <span style={{color: label.countDiff > 0 ? 'blue' : 'red'}}>({label.poolDiff > 0 ? '+' : '-'}${Math.abs(label.poolDiff).toLocaleString()})</span>}</div>
                <div>수량: {label.stockCount.toLocaleString()}주 {!!label.countDiff && <span style={{color: label.countDiff > 0 ? 'red' : 'blue'}}>({label.countDiff > 0 && '+'}{label.countDiff.toLocaleString()})</span>}</div>
                <div>평단: ${label.costBasis.toLocaleString()}</div>
                <div>종가: ${label.close.toLocaleString()}</div>
                <div>TQQQ 평가금:
                    ${label.marketPrice.toLocaleString()}</div>
                <div>총평가금:
                    ${label.totalValue.toLocaleString()}({label.rate.toLocaleString()}%)</div>
            </div>
        </>}
    </div>
}

export default ChartMain;
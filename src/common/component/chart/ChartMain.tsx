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

const ChartMain = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const root = useChartContext()
    const [mousePosData, setMousePosData] = useState<{x: number, y: number, index: number, price: number} | null>(null);
    useEffect(() => {
        const {current: canvas} = ref;
        if (!canvas) return;


        const wrapper = canvas.parentElement;
        if (!wrapper) return;

        // get the context for the canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const chartCtrl = new ChartController(root, ctx, {log: true});

        new TimeGrid(chartCtrl, {unit: 'year'});
        new XTick(chartCtrl);
        new Candle(chartCtrl, {
            riseBoxColor :"rgba(203,104,105,0.47)",
            riseWickColor: "rgba(229,26,28,0.45)",
            fallBoxColor :"rgba(15,124,196,0.44)",
            fallWickColor: "rgba(33,140,211,0.42)",
        });

        const subCtrl = new SubController(chartCtrl, {log: false});

        const startAsset = 5000
        const firstCount = Math.floor(startAsset / root.data[0].close);
        const firstValue = firstCount * root.data[0].close;
        const firstPool = startAsset - firstValue;
        const cycleDeposit = 250;

        const firstWeek = Math.floor(Util.getWeek(root.data[0].date) / 2);
        let lastWeek = 0
        let lastVR: IVRHistory = {
            week: lastWeek,
            savedPool: 0,
            costBasis: root.data[0].close,
            usablePool: firstPool,
            stockCount: firstCount,
            targetValue: firstValue
        }

        const vrHistory: IVRHistory[] = root.data.map((v, i) => {
            const week = Math.floor(Util.getWeek(v.date) / 2) - firstWeek;
            const marketValue = v.close * lastVR.stockCount
            if (week !== lastWeek) {
                const totalPool = lastVR.savedPool + lastVR.usablePool;
                const gradient = 10 + Math.floor(week / 26);
                const newPool = Math.max(totalPool + cycleDeposit, 0);
                const nextValue = Math.max(lastVR.targetValue + totalPool / gradient + (marketValue - lastVR.targetValue) / (2 * Math.sqrt(gradient)) + cycleDeposit, 0);
                const newSavedPool = newPool * Math.min(0.25 + Math.floor(week / 13) * 0.05, 0.9);
                const newUsablePool = newPool - newSavedPool;

                lastWeek = week;
                lastVR = {
                    week: lastWeek,
                    stockCount: lastVR.stockCount,
                    targetValue: nextValue,
                    savedPool: newSavedPool,
                    usablePool: newUsablePool,
                    costBasis: lastVR.costBasis
                }
            }

            const bandRange = 0.15;

            const ceilingValue = lastVR.targetValue * (1 + bandRange);
            const bottomValue = lastVR.targetValue * (1 - bandRange);

            if (marketValue > ceilingValue) {
                const overpriced = marketValue - ceilingValue;
                const overpriceCount = Math.floor(overpriced / v.close);
                const sold = overpriceCount * v.close;

                lastVR.savedPool += sold;
                lastVR.stockCount -= overpriceCount;
            }

            if (marketValue < bottomValue) {
                const underpriced = Math.min(bottomValue - marketValue, lastVR.usablePool);
                const underpriceCount = Math.floor(underpriced / v.close);
                const bought = underpriceCount * v.close;
                lastVR.costBasis = (lastVR.costBasis * lastVR.stockCount + bought) / (lastVR.stockCount + underpriceCount)
                lastVR.stockCount += underpriceCount;
                lastVR.usablePool -= bought;
            }

            return {
                ...lastVR
            }
        })

        // 원금
        new Line(subCtrl, data => {
            const firstWeek = Math.floor(Util.getWeek(data[0].date) / 2);
            return data.map(v => {
                const week = Math.floor(Util.getWeek(v.date) / 2);
                return Math.max(startAsset + (week - firstWeek) * cycleDeposit, 0);
            })
        }, {stroke: 'black', square: true})

        // 주식
        new LineArea(subCtrl, (data) => {
            return data.map(({close}, i) => {
                const vr = vrHistory[i];
                return {top: vr.usablePool + vr.savedPool + vr.stockCount * close, bottom: vr.usablePool + vr.savedPool};
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
                return {top: vr.savedPool};
            })
        }, {topStroke: 'none', bottomStroke: 'none', fill: 'rgba(0,150,8,0.27)'})

        // 타겟 v
        new Line(subCtrl, () => vrHistory.map(v => v.targetValue + v.usablePool + v.savedPool), {stroke: '#ff0000', square: true})
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

        let moveThrottle = false;
        const handleMouseMove = (e: MouseEvent) => {
            if (moveThrottle) return;
            moveThrottle = true;
            const {x, y} = canvas.getBoundingClientRect();
            setMousePosData(subCtrl.getMousePosData({x: e.x - x, y: e.y - y}));
            requestAnimationFrame(() => moveThrottle = false)
        }

        canvas.addEventListener('mousemove', handleMouseMove)


        chartCtrl.refresh();
        return () => {
            window.removeEventListener('resize', refresh);
            canvas.removeEventListener('mousedown', mouseDownHandler)
            canvas.removeEventListener('wheel', wheelHandler)
            canvas.removeEventListener('mousemove', handleMouseMove)
            chartCtrl.destroy();
        }
    }, [root])


    return <div className={styles.wrapper}>
        <canvas ref={ref}/>
        {mousePosData && <>
        <div className={styles.xLine} style={{top: 0, left: mousePosData.x }}/>
            <div className={styles.yLine} style={{top: mousePosData.y, left: 0}}>
                <div>${Util.dropDecimal(mousePosData.price, 2).toLocaleString()}</div>
            </div>
        </>}
    </div>
}

export default ChartMain;
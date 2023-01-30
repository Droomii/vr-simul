import styles from "../../../App.module.scss";
import React, {useRef} from "react";
import useChartContext from "../../../context/useChartContext";
import IVRSettings from "../../../define/IVRSettings";

const ChartSettings = () => {
    const {state: {settings}, setSettings} = useChartContext();
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);
    const startAssetRef = useRef<HTMLInputElement>(null);
    const weekCycleRef = useRef<HTMLInputElement>(null);
    const cycleDepositRef = useRef<HTMLInputElement>(null);
    const gradientRef = useRef<HTMLInputElement>(null);
    const gradientWeekRef = useRef<HTMLInputElement>(null);
    const gradientIncreaseRef = useRef<HTMLInputElement>(null);
    const poolLimitRef = useRef<HTMLInputElement>(null);
    const poolWeekRef = useRef<HTMLInputElement>(null);
    const poolDecreaseRef = useRef<HTMLInputElement>(null);
    const poolMinLimitRef = useRef<HTMLInputElement>(null);


    const handleChangeStartDate = ({currentTarget: {value}}: { currentTarget: { value: string } }) => {
        settings.startDate = value;
    }

    const handleChangeEndDate = ({currentTarget: {value}}: { currentTarget: { value: string } }) => {
        settings.endDate = value;
    }

    const handleChangeInteger = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);
        if (isNaN(value)) {
            e.currentTarget.value = e.currentTarget.defaultValue;
            return;
        }

        const min = Number(e.currentTarget.min || -Number.MAX_VALUE);
        const max = Number(e.currentTarget.max || Number.MAX_VALUE);
        e.currentTarget.value = String(Math.max(Math.min(value, max), min));
    }

    const handleSubmit = () => {
        const weekCycleUnit = Number(weekCycleRef.current?.value);
        const startAsset = Number(startAssetRef.current?.value);
        const poolLimitWeek = Number(poolWeekRef.current?.value);
        const poolLimit = Number(poolLimitRef.current?.value);
        const poolDecrease = Number(poolDecreaseRef.current?.value);
        const poolMinLimit = Number(poolMinLimitRef.current?.value);
        const gradientWeek = Number(gradientWeekRef.current?.value);
        const gradientIncrease = Number(gradientIncreaseRef.current?.value);
        const cycleDeposit = Number(cycleDepositRef.current?.value);
        const settings: Partial<IVRSettings> = {
            startDate: startDateRef.current?.value,
            endDate: endDateRef.current?.value,
            weekCycleUnit,
            startAsset,
            getPoolLimit(week: number): number {
                return 1 - Math.min((100 - poolLimit) / 100 + Math.floor(week / poolLimitWeek) * (poolDecrease / 100), 1 - poolMinLimit / 100)
            },
            getGradient(week: number): number {
                return 10 + Math.floor(week / gradientWeek) * gradientIncrease;
            },
            getCycleDeposit(): number {
                return cycleDeposit;
            }
        }
        setSettings(settings)
    }

    return <div className={styles.controlWrap}>
        <div>시작: <input type={'date'} ref={startDateRef} defaultValue={settings.startDate}
                        onChange={handleChangeStartDate}/></div>
        <div>종료: <input type={'date'} ref={endDateRef} defaultValue={settings.endDate} onChange={handleChangeEndDate}/>
        </div>
        <div>시작 금액: $<input type={'number'} ref={startAssetRef} onBlur={handleChangeInteger} min={0}
                            defaultValue={settings.startAsset} style={{width: 50}} step={1}/></div>
        <div>리밸런싱 주기: <input type={'number'} ref={weekCycleRef} onBlur={handleChangeInteger} min={1}
                             defaultValue={settings.weekCycleUnit} style={{width: 50}} step={1}/>주
        </div>
        <div>투입/인출금: $<input type={'number'} ref={cycleDepositRef} onBlur={handleChangeInteger}
                             defaultValue={settings.getCycleDeposit(0)} style={{width: 50}} step={1}/></div>
        <div>시작 G: <input type={'number'} ref={gradientRef} min={1} onBlur={handleChangeInteger}
                          defaultValue={settings.getGradient(0)} style={{width: 50}} step={1}/>
            <br/><span>└ <input type={'number'} ref={gradientWeekRef} min={1} onBlur={handleChangeInteger}
                                defaultValue={52} style={{width: 40}} step={1}/>주마다 </span>
            <span><input type={'number'} ref={gradientIncreaseRef} min={0} onBlur={handleChangeInteger}
                         defaultValue={1} style={{width: 40}} step={1}/> 증가 </span></div>
        <div>Pool 한도: <input type={'number'} ref={poolLimitRef} min={1} onBlur={handleChangeInteger}
                             defaultValue={settings.getPoolLimit(0) * 100} max={100} style={{width: 50}} step={1}/>%
            <br/><span>└ <input type={'number'} ref={poolWeekRef} min={1} onBlur={handleChangeInteger}
                                defaultValue={26} style={{width: 40}} step={1}/>주마다 </span>
            <span><input type={'number'} ref={poolDecreaseRef} min={0} max={100} onBlur={handleChangeInteger}
                         defaultValue={5} style={{width: 40}} step={1}/>% 감소 </span>

            <br/><span>└ 최소 <input type={'number'} ref={poolMinLimitRef} min={0} max={100} onBlur={handleChangeInteger}
                                   defaultValue={10} style={{width: 40}} step={1}/>%</span>
        </div>

        <button type={'button'} onClick={handleSubmit}>적용</button>
    </div>
}

export default ChartSettings;
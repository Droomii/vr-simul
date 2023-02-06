import styles from "../../../App.module.scss";
import React, {useRef, useState} from "react";
import useChartContext from "../../../context/useChartContext";
import IVRSettings from "../../../define/IVRSettings";

const ChartSettings = () => {
    const {state: {settings}, setSettings} = useChartContext();
    const [expand, setExpand] = useState(true);
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);
    const advancedRadioRef = useRef<HTMLInputElement>(null);
    const startStockRef = useRef<HTMLInputElement>(null);
    const startPoolRef = useRef<HTMLInputElement>(null);
    const weekCycleRef = useRef<HTMLInputElement>(null);
    const depositRadioRef = useRef<HTMLInputElement>(null);
    const cycleDepositRef = useRef<HTMLInputElement>(null);
    const gradientRef = useRef<HTMLInputElement>(null);
    const gradientWeekRef = useRef<HTMLInputElement>(null);
    const gradientIncreaseRef = useRef<HTMLInputElement>(null);
    const poolLimitRef = useRef<HTMLInputElement>(null);
    const poolWeekRef = useRef<HTMLInputElement>(null);
    const poolDecreaseRef = useRef<HTMLInputElement>(null);
    const poolMinLimitRef = useRef<HTMLInputElement>(null);
    const bandRef = useRef<HTMLInputElement>(null);


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
        const startStock = Number(startStockRef.current?.value);
        const startPool = Number(startPoolRef.current?.value);
        const poolLimitWeek = Number(poolWeekRef.current?.value);
        const poolLimit = Number(poolLimitRef.current?.value);
        const poolDecrease = Number(poolDecreaseRef.current?.value);
        const poolMinLimit = Number(poolMinLimitRef.current?.value);
        const gradient = Number(gradientRef.current?.value);
        const gradientWeek = Number(gradientWeekRef.current?.value);
        const gradientIncrease = Number(gradientIncreaseRef.current?.value);
        const isAdvancedFormula = !!advancedRadioRef.current?.checked;
        const cycleDeposit = Number(cycleDepositRef.current?.value) * (depositRadioRef.current?.checked ? 1 : -1);
        const band = Number(bandRef.current?.value)

        const settings: Partial<IVRSettings> = {
            startDate: startDateRef.current?.value,
            endDate: endDateRef.current?.value,
            weekCycleUnit,
            startStock,
            startPool,
            isAdvancedFormula,
            band,
            getPoolLimit(week: number): number {
                return 1 - Math.min((100 - poolLimit) / 100 + Math.floor(week / poolLimitWeek) * (poolDecrease / 100), 1 - poolMinLimit / 100)
            },
            getGradient(week: number): number {
                return gradient + Math.floor(week / gradientWeek) * gradientIncrease;
            },
            getCycleDeposit(): number {
                return cycleDeposit;
            }
        }
        setSettings(settings)
    }

    return <div className={styles.controlWrap} style={expand ? {bottom: 0} : undefined}>
        <div className={styles.thumb} onClick={() => setExpand(v => !v)}>{expand ? '▽' : '△'} 설정</div>
        <div className={styles.controlContainer}>
        <div>기간: <input type={'date'} ref={startDateRef} defaultValue={settings.startDate}
                        onChange={handleChangeStartDate}/> ~ <input type={'date'} ref={endDateRef} defaultValue={settings.endDate} onChange={handleChangeEndDate}/>
            <label htmlFor={'basicFormula'}><input  id={'basicFormula'} type={'radio'} value={'basic'} name={'formula'} />기본공식</label>
            <label htmlFor={'advancedFormula'}><input ref={advancedRadioRef} id={'advancedFormula'} type={'radio'} value={'advancedFormula'} name={'formula'} defaultChecked={true}/>실력공식</label>
        </div>
        <div><span>시작 TQQQ 액수: $<input type={'number'} ref={startStockRef} onBlur={handleChangeInteger} min={0}
                            defaultValue={settings.startStock} style={{width: 100}} step={1}/>,</span>
        시작 Pool: $<input type={'number'} ref={startPoolRef} onBlur={handleChangeInteger} min={0}
                                 defaultValue={settings.startPool} style={{width: 100}} step={1}/></div>
        <div>리밸런싱 주기: <input type={'number'} ref={weekCycleRef} onBlur={handleChangeInteger} min={1}
                             defaultValue={settings.weekCycleUnit} style={{width: 50}} step={1}/>주
        </div>
        <div>최소/최대 밴드: ±<input type={'number'} ref={bandRef} onBlur={handleChangeInteger} min={0}
                             defaultValue={settings.band} style={{width: 50}} step={1}/>%
        </div>
        <div>적립/인출금: $<input type={'number'} ref={cycleDepositRef} min={0} onBlur={handleChangeInteger}
                             defaultValue={settings.getCycleDeposit(0)} style={{width: 80}} step={1}/>
            <label htmlFor={'deposit'}><input ref={depositRadioRef} id={'deposit'} type={'radio'} value={'deposit'} name={'deposit'} defaultChecked={true}/>적립</label>
            <label htmlFor={'withdraw'}><input id={'withdraw'} type={'radio'} value={'withdraw'} name={'deposit'}/>인출</label> (0 = 거치식)
        </div>
        <div>시작 G: <input type={'number'} ref={gradientRef} min={1} onBlur={handleChangeInteger}
                          defaultValue={settings.getGradient(0)} style={{width: 50}} step={1}/>
            <br/><span> (<input type={'number'} ref={gradientWeekRef} min={1} onBlur={handleChangeInteger}
                                defaultValue={52} style={{width: 40}} step={1}/>주마다 </span>
            <span><input type={'number'} ref={gradientIncreaseRef} min={0} onBlur={handleChangeInteger}
                         defaultValue={1} style={{width: 40}} step={1}/> 증가)</span></div>
        <div><span>Pool 한도: <input type={'number'} ref={poolLimitRef} min={1} onBlur={handleChangeInteger}
                                   defaultValue={settings.getPoolLimit(0) * 100} max={100} style={{width: 50}} step={1}/>%</span>
            (<span><input type={'number'} ref={poolWeekRef} min={1} onBlur={handleChangeInteger}
                                defaultValue={26} style={{width: 40}} step={1}/>주마다 </span>
            <span><input type={'number'} ref={poolDecreaseRef} min={0} max={100} onBlur={handleChangeInteger}
                         defaultValue={5} style={{width: 40}} step={1}/>% 감소, 최소 <input type={'number'} ref={poolMinLimitRef} min={0} max={100} onBlur={handleChangeInteger}
                                   defaultValue={10} style={{width: 40}} step={1}/>%)</span>
        </div>
        <div>
        <button type={'button'} onClick={handleSubmit}>적용</button>
        </div>
        </div>
    </div>
}

export default ChartSettings;
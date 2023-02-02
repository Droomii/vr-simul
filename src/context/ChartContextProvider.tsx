import {createContext, PropsWithChildren, useState} from "react";
import ChartRoot from "../common/component/chart/elements/ChartRoot";
import IVRSettings from "../define/IVRSettings";

interface IContext {
    state: {
        root: ChartRoot;
        settings: IVRSettings;
    },
    setSettings: (settings: Partial<IVRSettings>) => void;
}

export const ChartContext = createContext<IContext | null>(null);
const defaultValue: IContext = {
    state: {
        root: new ChartRoot(),
        settings: {
            startDate: '2000-01-01',
            endDate: new Date().toISOString().substring(0, 10),
            startStock: 5000,
            startPool: 0,
            weekCycleUnit: 2,
            getCycleDeposit() {
                return 250
            },
            getGradient(week) {
                return 10 + Math.floor(week / 52);
            },
            getPoolLimit(week) {
                return 1 - Math.min(0.25 + Math.floor(week / 26) * 0.05, 0.9)
            }
        }
    }, setSettings: () => {
    }
}

const ChartContextProvider = ({children}: PropsWithChildren) => {
    const [state, setState] = useState(defaultValue);
    const setSettings = (settings: Partial<IVRSettings>) => {
        setState({state: {...state.state, settings: {...state.state.settings, ...settings}}, setSettings})
    }

    return <ChartContext.Provider value={{...state, setSettings}}>
        {children}
    </ChartContext.Provider>
}

export default ChartContextProvider;
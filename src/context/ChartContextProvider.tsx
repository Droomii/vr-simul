import {createContext, PropsWithChildren} from "react";
import ChartRoot from "../common/component/chart/elements/ChartRoot";
import IVRSettings from "../define/IVRSettings";

interface IContext {
    root: ChartRoot;
    settings: IVRSettings;
}

export const ChartContext = createContext<IContext | null>(null);
const defaultValue: IContext = {
    root: new ChartRoot(),
    settings: {
        startAsset: 5000,
        weekCycleUnit: 2,
        getCycleDeposit() {
            return 250
        },
        getGradient(week) {
            return 10 + Math.floor(week / (52 / this.weekCycleUnit));
        },
        getPoolLimit(week) {
            return Math.min(0.25 + Math.floor(week / (52 / this.weekCycleUnit)) * 0.05, 0.9)
        }
    }
}

const ChartContextProvider = ({children}: PropsWithChildren) => {

    return <ChartContext.Provider value={defaultValue}>
        {children}
    </ChartContext.Provider>
}

export default ChartContextProvider;
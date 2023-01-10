import {createContext, PropsWithChildren, useContext} from "react";
import ChartRoot from "../common/component/chart/elements/ChartRoot";

export const ChartContext = createContext<ChartRoot | null>(null);
const chartRoot = new ChartRoot();

const ChartContextProvider = ({children}: PropsWithChildren) => {

    return <ChartContext.Provider value={chartRoot}>
        {children}
    </ChartContext.Provider>
}

export default ChartContextProvider;
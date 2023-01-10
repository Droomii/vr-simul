import {ChartContext} from "./ChartContextProvider";
import {useContext} from "react";

const useChartContext = () => {
    const root = useContext(ChartContext);
    if (!root) throw 'nonono';
    return root;
}

export default useChartContext;
import React, {useState} from 'react';
import './App.css';
import ChartMain from "./common/component/chart/ChartMain";
import ChartRSI from "./common/component/chart/ChartRSI";
import styles from "./App.module.scss";
import ChartRoot from "./common/component/chart/elements/ChartRoot";

function App() {
    const [chartRoot] = useState(new ChartRoot())

    return (
        <div className="App">
            <div className={styles.chartWrap}>
                <div className={styles.chartMain}>
                    <ChartMain root={chartRoot}/>
                </div>
                <div className={styles.chartRSI}>
                    <ChartRSI root={chartRoot}/>
                </div>
            </div>
            <div className={styles.controlWrap}>
                컨토롤
            </div>
        </div>
    );
}

export default App;

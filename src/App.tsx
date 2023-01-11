import React from 'react';
import './App.css';
import ChartMain from "./common/component/chart/ChartMain";
import styles from "./App.module.scss";
import ChartContextProvider from "./context/ChartContextProvider";

function App() {
    return (
        <div className="App">
            <ChartContextProvider>
                <div className={styles.chartWrap}>
                    <div className={styles.chartMain}>
                        <ChartMain/>
                    </div>
                </div>
                <div className={styles.controlWrap}>
                    컨토롤
                </div>
            </ChartContextProvider>
        </div>
    );
}

export default App;

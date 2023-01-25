import React from 'react';
import './App.css';
import ChartMain from "./common/component/chart/ChartMain";
import styles from "./App.module.scss";
import ChartContextProvider from "./context/ChartContextProvider";
import ChartSettings from "./common/component/settings/ChartSettings";

function App() {
    return (
        <div className="App">
            <ChartContextProvider>
                <div className={styles.chartWrap}>
                    <div className={styles.chartMain}>
                        <ChartMain/>
                    </div>
                </div>
                <ChartSettings/>
            </ChartContextProvider>
        </div>
    );
}

export default App;

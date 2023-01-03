import React from 'react';
import './App.css';
import ChartMain from "./common/component/chart/ChartMain";
import ChartRSI from "./common/component/chart/ChartRSI";
import styles from "./App.module.scss";
function App() {
  return (
    <div className="App">
        <div className={styles.chartMain}>
            <ChartMain/>
        </div>
        <div className={styles.chartRSI}>
        <ChartRSI/>
        </div>
    </div>
  );
}

export default App;

interface IVRSettings {
    startDate: string;
    endDate: string;
    startAsset: number;
    weekCycleUnit: number;
    getCycleDeposit(week: number): number;
    getGradient(this: IVRSettings, week: number): number;
    getPoolLimit(this: IVRSettings, week: number): number;
}

export default IVRSettings;
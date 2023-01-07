import ChartController from "./ChartController";

interface ConstructorOptions {
    debug?: string;
    normalize?: boolean
}

class SubController extends ChartController {
    constructor(
        protected readonly controller: ChartController, options?: ConstructorOptions) {
        super(controller.root, controller.ctx, options);
        this.controller.register(this);
        this._isNormalize = options?.normalize ?? false;
    }
}

export default SubController
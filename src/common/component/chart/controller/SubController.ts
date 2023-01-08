import ChartController from "./ChartController";

interface ConstructorOptions {
    debug?: string;
    log?: boolean;
    isSub?: boolean;
}

class SubController extends ChartController {
    readonly independentRange = true;

    constructor(
        protected readonly controller: ChartController, options?: ConstructorOptions) {
        super(controller.root, controller.ctx, {...options, isSub: true});
        this.controller.register(this);
    }
}

export default SubController
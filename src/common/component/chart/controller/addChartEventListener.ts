import ChartController from "./ChartController";

function addChartEventListener(ctrl: ChartController) {
  const {root, canvas} = ctrl;

  let isMouseDown = false;

  // mouse event handler
  const mouseDownHandler = (e: MouseEvent) => {
    isMouseDown = true;
    const handleChangeOffset = ctrl.getOffsetSetter();
    const startX = e.x;
    let movementX = 0;
    let lastX = 0;
    let isMoving = false;

    const moveDecay = () => {
      if (Math.abs(movementX) < 5) {
        movementX = 0;
      } else {
        movementX /= 1.2;
      }

      if (isMouseDown) {
        requestAnimationFrame(moveDecay);
      }
    }

    moveDecay();
    const moveHandler = (e: MouseEvent) => {
      if (isMoving) {
        return;
      }
      isMoving = true;
      const changed = handleChangeOffset(startX - e.x)
      movementX = (movementX + e.movementX);
      lastX = e.x;
      changed && root.refresh();
      requestAnimationFrame(() => {
        isMoving = false;
      })
    }

    canvas.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', () => {

      isMouseDown = false;
      canvas.removeEventListener('mousemove', moveHandler)
      let stop = false;
      window.addEventListener('mousedown', (e) => {
        ctrl.onMouseDown?.(ctrl.getMousePosData(e));
        // setMousePosData(null);
        stop = true;
      }, {once: true})

      const inertiaHandler = () => {
        if (Math.abs(movementX) >= 1 && !stop) {
          lastX += movementX
          stop = handleChangeOffset(startX - lastX + Math.floor(movementX), true)
          movementX += movementX > 0 ? -1 : 1;
          root.refresh()
          requestAnimationFrame(inertiaHandler)
        }
      }
      inertiaHandler()
    }, {once: true})
  }

  const wheelHandler = (e: WheelEvent) => {
    const oldZoom = ctrl.zoom
    ctrl.handleZoom(e.deltaY, e.x - canvas.getBoundingClientRect().left);
    if (ctrl.zoom !== oldZoom) {
      root.refresh();
    }
  }

  canvas.addEventListener('wheel', wheelHandler)

  canvas.addEventListener('mousedown', mouseDownHandler)

  window.addEventListener('resize', root.refresh);

  let moveThrottle = false;
  const mouseMoveHandler = (e: MouseEvent) => {
    if (moveThrottle) return;
    moveThrottle = true;
    ctrl.onMouseMove?.(ctrl.getMousePosData(e))
    requestAnimationFrame(() => moveThrottle = false)
  }

  const mouseOutHandler = (e: MouseEvent) => {
    ctrl.onMouseOut?.(ctrl.getMousePosData(e));
  }

  canvas.addEventListener('mousemove', mouseMoveHandler)
  canvas.addEventListener('mouseout', mouseOutHandler)

  return () => {
    window.removeEventListener('resize', root.refresh);
    canvas.removeEventListener('mousedown', mouseDownHandler)
    canvas.removeEventListener('wheel', wheelHandler)
    canvas.removeEventListener('mousemove', mouseMoveHandler)
    canvas.removeEventListener('mouseout', mouseOutHandler)
  }
}

export default addChartEventListener
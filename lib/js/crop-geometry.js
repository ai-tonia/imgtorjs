/**
 * Pure crop rectangle math (viewport coordinates). Used by imgtor crop plugin.
 * @param {object} p
 * @param {number} p.fromX
 * @param {number} p.fromY
 * @param {number} p.toX
 * @param {number} p.toY
 * @param {number} p.canvasWidth
 * @param {number} p.canvasHeight
 * @param {number} p.minWidth
 * @param {number} p.minHeight
 * @param {number | null} p.ratio
 * @param {boolean} p.isKeyCroping
 * @param {boolean} p.isKeyLeft
 * @param {boolean} p.isKeyUp
 * @returns {{ left: number, top: number, width: number, height: number }}
 */
export function computeCropRectFromDrag(p) {
  let isLeft = p.toX <= p.fromX;
  const isRight = !isLeft;
  let isUp = p.toY <= p.fromY;
  const isDown = !isUp;

  let leftX = Math.min(p.fromX, p.toX);
  let rightX = Math.max(p.fromX, p.toX);
  let topY = Math.min(p.fromY, p.toY);
  let bottomY = Math.max(p.fromY, p.toY);

  leftX = Math.max(0, leftX);
  rightX = Math.min(p.canvasWidth, rightX);
  topY = Math.max(0, topY);
  bottomY = Math.min(p.canvasHeight, bottomY);

  if (rightX - leftX < p.minWidth) {
    if (isRight) rightX = leftX + p.minWidth;
    else leftX = rightX - p.minWidth;
  }
  if (bottomY - topY < p.minHeight) {
    if (isDown) bottomY = topY + p.minHeight;
    else topY = bottomY - p.minHeight;
  }

  if (leftX < 0) {
    rightX += Math.abs(leftX);
    leftX = 0;
  }
  if (rightX > p.canvasWidth) {
    leftX -= rightX - p.canvasWidth;
    rightX = p.canvasWidth;
  }
  if (topY < 0) {
    bottomY += Math.abs(topY);
    topY = 0;
  }
  if (bottomY > p.canvasHeight) {
    topY -= bottomY - p.canvasHeight;
    bottomY = p.canvasHeight;
  }

  let width = rightX - leftX;
  let height = bottomY - topY;
  const currentRatio = width / height;

  if (p.ratio != null && +p.ratio !== currentRatio) {
    const ratio = +p.ratio;

    if (p.isKeyCroping) {
      isLeft = p.isKeyLeft;
      isUp = p.isKeyUp;
    }

    if (currentRatio < ratio) {
      const ratioWidth = height * ratio;
      if (isLeft) {
        leftX -= ratioWidth - width;
      }
      width = ratioWidth;
    } else if (currentRatio > ratio) {
      const ratioHeight = height / ((ratio * height) / width);
      if (isUp) {
        topY -= ratioHeight - height;
      }
      height = ratioHeight;
    }

    if (leftX < 0) {
      leftX = 0;
    }
    if (topY < 0) {
      topY = 0;
    }
    if (leftX + width > p.canvasWidth) {
      const maxWidth = p.canvasWidth - leftX;
      height = (maxWidth * height) / width;
      width = maxWidth;
      if (isUp) {
        topY = p.fromY - height;
      }
    }
    if (topY + height > p.canvasHeight) {
      const maxHeight = p.canvasHeight - topY;
      width = (width * maxHeight) / height;
      height = maxHeight;
      if (isLeft) {
        leftX = p.fromX - width;
      }
    }
  }

  return { left: leftX, top: topY, width, height };
}

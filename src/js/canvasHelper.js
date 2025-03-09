export function drawLine(ctx, sx, sy, ex, ey, width, stroke) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);

    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;

    ctx.stroke();
    ctx.closePath();
}

export function drawCircle(ctx, x, y, radius, fill) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.closePath();
}

export function drawCircleLeftHalf(ctx, x, y, radius, fill) {
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI / 2, 3 * Math.PI / 2, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.closePath();
}

export function drawCircleRightHalf(ctx, x, y, radius, fill) {
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.closePath();
}

export function drawRect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
}

export function drawText(ctx, x, y, text, font, color, baseline = 'middle', textAlign = 'center') {
    ctx.font = font;
    ctx.textBaseline = baseline;
    ctx.textAlign = textAlign;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

export function drawPixelText(ctx, x, y, text, color, baseline = 'middle', textAlign = 'center') {
    drawText(ctx, x, y, text, '5px "Pixel 3x5"', color, baseline, textAlign);
}

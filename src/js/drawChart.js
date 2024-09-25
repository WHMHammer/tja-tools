import { drawLine, drawCircle, drawRect, drawText, drawPixelText } from './canvasHelper';

//==============================================================================
// Drawing config and helpers

const CHART_PADDING_TOP = 64;
const CHART_PADDING_BOTTOM = 8;
const CHART_BG = '#cccccc';

const ROW_MARGIN_BOTTOM = 16;
const ROW_HEIGHT_INFO = 18;
const ROW_HEIGHT_NOTE = 32;
const ROW_HEIGHT = ROW_HEIGHT_INFO + ROW_HEIGHT_NOTE;
const ROW_OFFSET_NOTE_CENTER = ROW_HEIGHT_INFO + (ROW_HEIGHT_NOTE / 2);
const ROW_LEADING = 24;
const ROW_TRAILING = 24;

const BEAT_WIDTH = 48;

const NOTE_RADIUS = 9;

const GET_ROW_Y = row => CHART_PADDING_TOP + ((ROW_HEIGHT + ROW_MARGIN_BOTTOM) * row);
const GET_BEAT_X = beat => ROW_LEADING + (beat * BEAT_WIDTH);

//==============================================================================
// Notes

function getNoteCenter(row, beat) {
    return {
        x: GET_BEAT_X(beat),
        y: GET_ROW_Y(row) + ROW_OFFSET_NOTE_CENTER,
    };
}

function drawSmallNote(ctx, row, beat, color, drawInner = true) {
    const { x, y } = getNoteCenter(row, beat);

    drawCircle(ctx, x, y, NOTE_RADIUS, '#000');

    if (drawInner) {
        drawCircle(ctx, x, y, NOTE_RADIUS - 1, '#fff');
        drawCircle(ctx, x, y, NOTE_RADIUS - 2, color);
    }
    else {
        drawCircle(ctx, x, y, NOTE_RADIUS - 1, color);
    }
}

function drawBigNote(ctx, row, beat, color) {
    const { x, y } = getNoteCenter(row, beat);

    drawCircle(ctx, x, y, NOTE_RADIUS + 3, '#000');
    drawCircle(ctx, x, y, NOTE_RADIUS + 2, '#fff');
    drawCircle(ctx, x, y, NOTE_RADIUS, color);
}

//==============================================================================
// Long notes

function drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, color, type = 'body') {
    let { x: sx, y: sy } = getNoteCenter(sRow, sBeat);
    let { x: ex, y: ey } = getNoteCenter(eRow, eBeat);

    const isGogo = type === 'gogo';
    const isBig = type === 'bodyBig';

    const yDelta = isGogo ? ROW_OFFSET_NOTE_CENTER : (NOTE_RADIUS + (isBig ? 3 : 0));
    sy -= yDelta;
    ey -= yDelta;

    const h = isGogo ? ROW_HEIGHT_INFO : (NOTE_RADIUS * 2 + (isBig ? 6 : 0));

    if (sRow === eRow) {
        const w = ex - sx;

        if (isGogo) {
            drawRect(ctx, sx, sy, w, h, color);
        }
        else {
            drawRect(ctx, sx, sy, w, h, '#000');
            drawRect(ctx, sx, sy + 1, w, h - 2, '#fff');
            drawRect(ctx, sx, sy + 2, w, h - 4, color);
        }
    }
    else {
        // start to end-of-row
        const endOfStartRow = rows[sRow].totalBeat,
            sw = GET_BEAT_X(endOfStartRow) - sx + ROW_TRAILING;

        if (isGogo) {
            drawRect(ctx, sx, sy, sw, h, color);
        }
        else {
            drawRect(ctx, sx, sy, sw, h, '#000');
            drawRect(ctx, sx, sy + 1, sw, h - 2, '#fff');
            drawRect(ctx, sx, sy + 2, sw, h - 4, color);
        }

        // full rows
        for (let r = sRow + 1; r < eRow; r++) {
            let ry = GET_ROW_Y(r);
            let rw = GET_BEAT_X(rows[r].totalBeat) + ROW_TRAILING;

            if (isGogo) {
                drawRect(ctx, 0, ry, rw, h, color);
            }
            else {
                ry += ROW_OFFSET_NOTE_CENTER - NOTE_RADIUS - (isBig ? 3 : 0)
                drawRect(ctx, 0, ry, rw, h, '#000');
                drawRect(ctx, 0, ry + 1, rw, h - 2, '#fff');
                drawRect(ctx, 0, ry + 2, rw, h - 4, color);
            }
        }

        // start-of-row to end
        const ew = GET_BEAT_X(eBeat);

        if (isGogo) {
            drawRect(ctx, 0, ey, ew, h, color);
        }
        else {
            drawRect(ctx, 0, ey, ew, h, '#000');
            drawRect(ctx, 0, ey + 1, ew, h - 2, '#fff');
            drawRect(ctx, 0, ey + 2, ew, h - 4, color);
        }
    }
}

function drawRendaSmall(ctx, rows, sRow, sBeat, eRow, eBeat) {
    drawSmallNote(ctx, sRow, sBeat, '#fe4');
    drawSmallNote(ctx, eRow, eBeat, '#fe4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fe4', 'body');
}

function drawRendaBig(ctx, rows, sRow, sBeat, eRow, eBeat) {
    drawBigNote(ctx, sRow, sBeat, '#fe4');
    drawBigNote(ctx, eRow, eBeat, '#fe4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fe4', 'bodyBig');
}

function drawBalloon(ctx, rows, sRow, sBeat, eRow, eBeat, count) {
    drawSmallNote(ctx, eRow, eBeat, '#fb4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fb4', 'body');
    drawSmallNote(ctx, sRow, sBeat, '#fb4', false);

    const { x, y } = getNoteCenter(sRow, sBeat);
    drawPixelText(ctx, x, y + 0.5, count.toString(), '#000');
}

function drawFuse(ctx, rows, sRow, sBeat, eRow, eBeat, count) {
    drawSmallNote(ctx, eRow, eBeat, '#640aad');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#640aad', 'body');
    drawSmallNote(ctx, sRow, sBeat, '#a4f', false);

    const { x, y } = getNoteCenter(sRow, sBeat);
    drawPixelText(ctx, x, y + 0.5, count.toString(), '#fcc');
}

//==============================================================================
// Main drawing function

export default function (chart, courseId) {
    const course = chart.courses[courseId];

    // Useful values
    const ttRowBeat = course.headers.ttRowBeat;

    //============================================================================
    // 1. Calculate canvas size, split measures into rows

    const rows = [];
    let rowTemp = [], rowBeat = 0;

    for (let midx = 0; midx < course.measures.length; midx++) {
        const measure = course.measures[midx];
        const measureBeat = measure.length[0] / measure.length[1] * 4;

        if (ttRowBeat < rowBeat + measureBeat || measure.properties.ttBreak) {
            rows.push({ beats: rowBeat, measures: rowTemp });
            rowTemp = [];
            rowBeat = 0;
        }

        rowTemp.push(measure);
        rowBeat += measureBeat;
    }

    if (rowTemp.length)
        rows.push({ beats: rowBeat, measures: rowTemp });

    const canvasWidth = ROW_LEADING + (BEAT_WIDTH * ttRowBeat) + ROW_TRAILING;
    const canvasHeight = CHART_PADDING_TOP + ((ROW_HEIGHT + ROW_MARGIN_BOTTOM) * rows.length) + CHART_PADDING_BOTTOM;

    const $canvas = document.createElement('canvas');
    $canvas.width = canvasWidth;
    $canvas.height = canvasHeight;

    // Add canvas element temporarily for small font rendering
    // Ref: https://bugs.chromium.org/p/chromium/issues/detail?id=826129
    document.body.appendChild($canvas);

    const ctx = $canvas.getContext('2d');

    try {
        //============================================================================
        // 2. Background, rows, informations

        drawRect(ctx, 0, 0, canvasWidth, canvasHeight, CHART_BG);

        for (let ridx = 0; ridx < rows.length; ridx++) {
            const row = rows[ridx];
            const totalBeat = row.beats, measures = row.measures;
            row.totalBeat = totalBeat;

            const rowWidth = ROW_LEADING + (BEAT_WIDTH * totalBeat) + ROW_TRAILING;

            const y = GET_ROW_Y(ridx);

            drawRect(ctx, 0, y + ROW_HEIGHT_INFO, rowWidth, ROW_HEIGHT_NOTE, '#000');
            drawRect(ctx, 0, y + ROW_HEIGHT_INFO + 2, rowWidth, ROW_HEIGHT_NOTE - 4, '#fff');
            drawRect(ctx, 0, y + ROW_HEIGHT_INFO + 4, rowWidth, ROW_HEIGHT_NOTE - 8, '#999');
        }

        drawText(ctx, 8, 8, chart.headers.title, 'bold 28px sans-serif', '#000', 'top', 'left');

        const difficulty = ['Easy', 'Normal', 'Hard', 'Oni', 'Edit'];
        const levelMax = [5, 7, 8, 10, 10];
        const difficultyText = (
            difficulty[course.course] + ' ' +
            '★'.repeat(course.headers.level) +
            '☆'.repeat(Math.max(levelMax[course.course] - course.headers.level, 0))
        );

        drawText(ctx, 8, 40, difficultyText, 'bold 20px sans-serif', '#000', 'top', 'left');

        //============================================================================
        // 3. Go-go time, measure grid, events

        let gogoStart = false;
        let measureNumber = 1;

        for (let ridx = 0; ridx < rows.length; ridx++) {
            const row = rows[ridx], measures = row.measures;
            let beat = 0;

            for (let midx = 0; midx < measures.length; midx++) {
                const measure = measures[midx];
                const mBeat = measure.length[0] / measure.length[1] * 4;

                measure.rowBeat = beat;

                // Go-go time
                for (let i = 0; i < measure.events.length; i++) {
                    const event = measure.events[i];
                    const eBeat = beat + (mBeat / (measure.data.length || 1) * event.position);

                    if (event.name === 'gogoStart' && !gogoStart) {
                        gogoStart = [ridx, eBeat];
                    }
                    else if (event.name === 'gogoEnd' && gogoStart) {
                        drawLong(ctx, rows, gogoStart[0], gogoStart[1], ridx, eBeat, '#fbb', 'gogo');
                        gogoStart = false;
                    }
                }

                beat += mBeat;
            }
        }

        for (let ridx = 0; ridx < rows.length; ridx++) {
            const row = rows[ridx], measures = row.measures;
            let beat = 0;

            const y = GET_ROW_Y(ridx);

            for (let midx = 0; midx < measures.length; midx++) {
                const mx = GET_BEAT_X(beat);
                const measure = measures[midx];
                const mBeat = measure.length[0] / measure.length[1] * 4;

                // Sub grid
                const ny = y + ROW_HEIGHT_INFO;

                for (let i = 1; i < measure.length[0] * 2; i++) {
                    const subBeat = i / measure.length[1] * 2;
                    const subx = GET_BEAT_X(beat + subBeat);
                    const style = '#fff' + (i % 2 ? '4' : '8');

                    drawLine(ctx, subx, ny, subx, ny + ROW_HEIGHT_NOTE, 2, style);
                }

                // Events
                for (let i = 0; i < measure.events.length; i++) {
                    const event = measure.events[i];
                    const eBeat = mBeat / (measure.data.length || 1) * event.position;
                    const ex = GET_BEAT_X(beat + eBeat);

                    if (event.name === 'scroll') {
                        drawLine(ctx, ex, y, ex, y + ROW_HEIGHT, 2, '#444');
                        drawPixelText(ctx, ex + 2, y + ROW_HEIGHT_INFO - 13, 'HS ' + event.value.toString(), '#f00', 'bottom', 'left');
                    }
                    else if (event.name === 'bpm') {
                        drawLine(ctx, ex, y, ex, y + ROW_HEIGHT, 2, '#444');
                        drawPixelText(ctx, ex + 2, y + ROW_HEIGHT_INFO - 7, 'BPM ' + event.value.toString(), '#00f', 'bottom', 'left');
                    }
                }

                // Measure lines, number
                drawLine(ctx, mx, y, mx, y + ROW_HEIGHT, 2, '#fff');
                drawPixelText(ctx, mx + 2, y + ROW_HEIGHT_INFO - 1, measureNumber.toString(), '#000', 'bottom', 'left');
                measureNumber += 1;

                beat += mBeat;

                // Draw last measure line
                if (midx + 1 === measures.length) {
                    const mx2 = GET_BEAT_X(beat);
                    drawLine(ctx, mx2, y, mx2, y + ROW_HEIGHT, 2, '#fff');
                }
            }
        }

        //============================================================================
        // 4. Notes

        // Pre-scan balloon

        let balloonIdx = 0, imoStart = false;
        for (let ridx = 0; ridx < rows.length; ridx++) {
            const measures = rows[ridx].measures;

            for (let midx = 0; midx < measures.length; midx++) {
                const measure = measures[midx];

                for (let didx = measure.data.length; didx >= 0; didx--) {
                    const note = measure.data.charAt(didx);
                    if (note === '7' || note === 'D') {
                        balloonIdx += 1;
                    }
                    else if (note === '9' && !imoStart) {
                        imoStart = 1;
                        balloonIdx += 1;
                    }
                    else if (note === '8' && imoStart) {
                        imoStart = false;
                    }
                }
            }
        }

        if (course.headers.balloon.length < balloonIdx) {
            throw new Error('BALLOON count mismatch');
        }

        // Draw

        let longEnd = false, imo = false;

        for (let ridx = rows.length - 1; ridx >= 0; ridx--) {
            const row = rows[ridx], measures = row.measures;
            let beat = 0;

            for (let midx = measures.length - 1; midx >= 0; midx--) {
                const measure = measures[midx], mBeat = measure.length[0] / measure.length[1] * 4;

                for (let didx = measure.data.length; didx >= 0; didx--) {
                    const note = measure.data.charAt(didx);
                    const nBeat = measure.rowBeat + (mBeat / measure.data.length * didx);

                    if (note !== '0' && note !== '9' && imo) {
                        const border = imo[0];
                        const start = imo[imo.length - 1];

                        const balloonCount = course.headers.balloon[balloonIdx - 1];
                        drawBalloon(ctx, rows, start[0], start[1], longEnd[0], longEnd[1], balloonCount);
                        balloonIdx -= 1;
                        longEnd = false;
                        imo = false;
                    }

                    switch (note) {
                        case '1':
                            drawSmallNote(ctx, ridx, nBeat, '#f33');
                            break;

                        case '2':
                            drawSmallNote(ctx, ridx, nBeat, '#5cf');
                            break;

                        case '3':
                        case 'A':
                            drawBigNote(ctx, ridx, nBeat, '#f33');
                            break;

                        case '4':
                        case 'B':
                            drawBigNote(ctx, ridx, nBeat, '#5cf');
                            break;

                        case '5':
                            drawRendaSmall(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1]);
                            longEnd = false;
                            break;

                        case '6':
                            drawRendaBig(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1]);
                            longEnd = false;
                            break;

                        case '7':
                            const balloonCount = course.headers.balloon[balloonIdx - 1];

                            drawBalloon(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], balloonCount);
                            balloonIdx -= 1;
                            longEnd = false;
                            break;

                        case '8':
                            longEnd = [ridx, nBeat];
                            break;

                        case '9':
                            if (!imo) imo = [];
                            imo.push([ridx, nBeat]);
                            break;

                        case 'C':
                            drawSmallNote(ctx, ridx, nBeat, '#000');
                            break;

                        case 'D':
                            const fuseCount = course.headers.balloon[balloonIdx - 1];
    
                            drawFuse(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], fuseCount);
                            balloonIdx -= 1;
                            longEnd = false;
                            break;

                        case 'F':
                            drawSmallNote(ctx, ridx, nBeat, '#ddd');
                            break;

                        case 'G':
                            drawBigNote(ctx, ridx, nBeat, '#f3f');
                            break;
                    }
                }
            }
        }

        document.body.removeChild($canvas);
        return $canvas;
    } catch (e) {
        document.body.removeChild($canvas);
        throw e;
    }
}

import { drawLine, drawCircle, drawRect, drawText, drawPixelText } from './canvasHelper';
import { isRollSymbol, isBalloonSymbol } from './analyseChart'

//==============================================================================
// Drawing config and helpers

const CHART_PADDING_TOP = 112;
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

function drawBigNote(ctx, row, beat, color, drawInner = true) {
    const { x, y } = getNoteCenter(row, beat);

    drawCircle(ctx, x, y, NOTE_RADIUS + 3, '#000');

    if (drawInner) {
        drawCircle(ctx, x, y, NOTE_RADIUS + 2, '#fff');
        drawCircle(ctx, x, y, NOTE_RADIUS, color);
    }
    else {
        drawCircle(ctx, x, y, NOTE_RADIUS + 2, color);
    }
}

//==============================================================================
// Long notes

// anchored at top-left
function drawLongSegGogo(ctx, x, y, w, color) {
    const h = ROW_HEIGHT_INFO;
    drawRect(ctx, x, y, w, h, color);
}

// anchored at center
function drawLongSegNote(ctx, x, y, w, rBorder, rOuter, rInner, color) {
    drawRect(ctx, x, y - rBorder, w, rBorder * 2, '#000');
    drawRect(ctx, x, y - rOuter, w, rOuter * 2, '#fff');
    drawRect(ctx, x, y - rInner, w, rInner * 2, color);
}

function drawLongSegSmallNote(ctx, x, y, w, color) {
    drawLongSegNote(ctx, x, y, w, NOTE_RADIUS, NOTE_RADIUS - 1, NOTE_RADIUS - 2, color);
}

function drawLongSegBigNote(ctx, x, y, w, color) {
    drawLongSegNote(ctx, x, y, w, NOTE_RADIUS + 3, NOTE_RADIUS + 2, NOTE_RADIUS, color);
}

function drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, color, type = 'body') {
    let { x: sx, y: sy } = getNoteCenter(sRow, sBeat);
    let { x: ex, y: ey } = getNoteCenter(eRow, eBeat);

    const isGogo = type === 'gogo';
    const isBig = type === 'bodyBig';

    if (isGogo) {
        const yDelta = ROW_OFFSET_NOTE_CENTER;
        sy -= yDelta;
        ey -= yDelta;
    }

    const draw = isGogo ? drawLongSegGogo :
        isBig ? drawLongSegBigNote : drawLongSegSmallNote;

    if (sRow === eRow) {
        const w = ex - sx;
        draw(ctx, sx, sy, w, color);
    }
    else {
        // start to end-of-row
        const endOfStartRow = rows[sRow].totalBeat,
            sw = GET_BEAT_X(endOfStartRow) - sx + ROW_TRAILING;
        draw(ctx, sx, sy, sw, color);

        // full rows
        for (let r = sRow + 1; r < eRow; r++) {
            let ry = GET_ROW_Y(r) + (isGogo ? 0 : ROW_OFFSET_NOTE_CENTER);
            let rw = GET_BEAT_X(rows[r].totalBeat) + ROW_TRAILING;
            draw(ctx, 0, ry, rw, color);
        }

        // start-of-row to end
        const ew = GET_BEAT_X(eBeat);
        draw(ctx, 0, ey, ew, color);
    }
}

function drawRendaSmall(ctx, rows, sRow, sBeat, eRow, eBeat, omitEnd) {
    drawSmallNote(ctx, sRow, sBeat, '#fe4');
    if (!omitEnd)
        drawSmallNote(ctx, eRow, eBeat, '#fe4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fe4', 'body');
}

function drawRendaBig(ctx, rows, sRow, sBeat, eRow, eBeat, omitEnd) {
    drawBigNote(ctx, sRow, sBeat, '#fe4');
    if (!omitEnd)
        drawBigNote(ctx, eRow, eBeat, '#fe4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fe4', 'bodyBig');
}

function drawBalloon(ctx, rows, sRow, sBeat, eRow, eBeat, omitEnd, count) {
    if (!omitEnd)
        drawSmallNote(ctx, eRow, eBeat, '#fb4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fb4', 'body');
    drawSmallNote(ctx, sRow, sBeat, '#fb4', false);

    const { x, y } = getNoteCenter(sRow, sBeat);
    drawPixelText(ctx, x, y + 0.5, count.toString(), '#000');
}

function drawBalloonEx(ctx, rows, sRow, sBeat, eRow, eBeat, omitEnd, count) {
    if (!omitEnd)
        drawBigNote(ctx, eRow, eBeat, '#fb4');
    drawLong(ctx, rows, sRow, sBeat, eRow, eBeat, '#fb4', 'bodyBig');
    drawBigNote(ctx, sRow, sBeat, '#fb4', false);

    const { x, y } = getNoteCenter(sRow, sBeat);
    drawPixelText(ctx, x, y + 0.5, count.toString(), '#000');
}

function drawFuse(ctx, rows, sRow, sBeat, eRow, eBeat, omitEnd, count) {
    if (!omitEnd)
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
        drawText(ctx, 8, 40, chart.headers.subtitle, 'bold 20px sans-serif', '#000', 'top', 'left');
        if (course.headers.maker !== null || chart.headers.maker !== null)
            drawText(ctx, 8, 64, `Charter: ${(course.headers.maker !== null) ? course.headers.maker : chart.headers.maker}`, 'bold 20px sans-serif', '#000', 'top', 'left');

        const difficulty = ['Easy', 'Normal', 'Hard', 'Oni', 'Edit'];
        const levelMax = [5, 7, 8, 10, 10];
        const difficultyText = (
            difficulty[course.course] + ' ' +
            '★'.repeat(course.headers.level) +
            '☆'.repeat(Math.max(levelMax[course.course] - course.headers.level, 0)) +
            ` Lv.${course.headers.level}`
        );

        // 40
        drawText(ctx, 8, 88, difficultyText, 'bold 20px sans-serif', '#000', 'top', 'left');

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

        let barlineOn = true;
        for (let ridx = 0; ridx < rows.length; ridx++) {
            const row = rows[ridx], measures = row.measures;
            let beat = 0;

            const y = GET_ROW_Y(ridx);

            for (let midx = 0; midx < measures.length; midx++) {
                const mx = GET_BEAT_X(beat);
                const measure = measures[midx];
                const mBeat = measure.length[0] / measure.length[1] * 4;

                let branchStart = false;
                // Pre-scan measure-initial events
                for (let i = 0; i < measure.events.length; i++) {
                    const event = measure.events[i];
                    if (event.position > 0) {
                        break;
                    }
                    if (event.name === 'branchStart') {
                        branchStart = true;
                    }
                }

                // Sub grid (including the hidden bar line)
                const ny = y + ROW_HEIGHT_INFO;

                for (let i = 0; i < measure.length[0] * 2; i++) {
                    const subBeat = i / measure.length[1] * 2;
                    const subx = GET_BEAT_X(beat + subBeat);
                    const style = ((i == 0 && branchStart) ? '#fe0' : '#fff') + (i % 2 ? '4' : '8');

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
                    else if (event.name === 'barlineOff') {
                        barlineOn = false;
                    }
                    else if (event.name === 'barlineOn') {
                        barlineOn = true;
                    }
                }

                // Measure lines, number
                if (barlineOn) {
                    drawLine(ctx, mx, y, mx, y + ROW_HEIGHT, 2, branchStart ? '#fe0' : '#fff');
                }
                drawPixelText(ctx, mx + 2, y + ROW_HEIGHT_INFO - 1, measureNumber.toString(), '#000', 'bottom', 'left');
                measureNumber += 1;

                beat += mBeat;

                // Draw the last-measure-ending line
                if (midx + 1 === measures.length) {
                    const mx2 = GET_BEAT_X(beat);
                    // treat the chart-final last-measure-ending line as hidden
                    if (barlineOn && ridx + 1 !== rows.length) {
                        drawLine(ctx, mx2, y, mx2, y + ROW_HEIGHT, 2, '#fff');
                    }
                    else {
                        drawLine(ctx, mx2, ny, mx2, ny + ROW_HEIGHT_NOTE, 2, '#fff8');
                    }
                }
            }
        }

        //============================================================================
        // 4. Notes

        // Pre-scan roll & balloon (forward scanning)

        let balloonIdx = 0;
        const rmdToBalloonCount = {};
        let rmdLastRoll = null;
        const rmdToRollEndRmd = {};
        for (let ridx = 0; ridx < rows.length; ridx++) {
            const mdToBalloonCount = rmdToBalloonCount[ridx] = {};
            const mdToRollEndRmd = rmdToRollEndRmd[ridx] = {};
            const measures = rows[ridx].measures;

            for (let midx = 0; midx < measures.length; midx++) {
                const dToBalloonCount = mdToBalloonCount[midx] = {};
                const dToRollEndRmdx = mdToRollEndRmd[midx] = {};
                const measure = measures[midx];

                for (let didx = 0; didx < measure.data.length; didx++) {
                    const note = measure.data.charAt(didx);
                    if (isRollSymbol(note)) {
                        if (rmdLastRoll !== null)
                            continue;
                        rmdLastRoll = [ridx, midx, didx];

                        if (isBalloonSymbol(note)) {
                            dToBalloonCount[didx] = course.headers.balloon[balloonIdx++];
                        }
                    } else if (note !== '0' && rmdLastRoll !== null) {
                        const ridxR = rmdLastRoll[0], midxR = rmdLastRoll[1], didxR = rmdLastRoll[2];
                        rmdToRollEndRmd[ridxR][midxR][didxR] = [ridx, midx, didx, note];
                        rmdLastRoll = null;
                    }
                }
            }
        }

        // Handle unended roll at chart end
        if (rmdLastRoll !== null) {
            const ridxR = rmdLastRoll[0], midxR = rmdLastRoll[1], didxR = rmdLastRoll[2];
            // Hack: draw the "unended" end below the image bottom so that it is invisible
            rmdToRollEndRmd[ridxR][midxR][didxR] = [rows.length, 0, 0, '#END'];
            rmdLastRoll = null;
        }

        // Draw (backward scanning)

        for (let ridx = rows.length - 1; ridx >= 0; ridx--) {
            const mdToBalloonCount = rmdToBalloonCount[ridx];
            const mdToRollEndRmd = rmdToRollEndRmd[ridx];
            const row = rows[ridx], measures = row.measures;
            let beat = 0;

            for (let midx = measures.length - 1; midx >= 0; midx--) {
                const dToBalloonCount = mdToBalloonCount[midx];
                const dToRollEndRmd = mdToRollEndRmd[midx];
                const measure = measures[midx], mBeat = measure.length[0] / measure.length[1] * 4;

                for (let didx = measure.data.length; didx >= 0; didx--) {
                    const note = measure.data.charAt(didx);
                    const nBeat = measure.rowBeat + (mBeat / measure.data.length * didx);

                    let longEnd = null;
                    let balloonCount = 0;

                    // look up the pre-scanning results for roll & balloon
                    if (isRollSymbol(note)) {
                        const rollEndRmd = dToRollEndRmd[didx];
                        if (rollEndRmd === undefined)
                            continue;

                        const ridxE = rollEndRmd[0], midxE = rollEndRmd[1], didxE = rollEndRmd[2], noteE = rollEndRmd[3];
                        const omitE = (noteE !== '8'); // omit forced roll ends for clarity
                        if (ridxE < rows.length) {
                            const measureE = rows[ridxE].measures[midxE];
                            const mBeatE = measureE.length[0] / measureE.length[1] * 4;
                            const nBeatE = measureE.rowBeat + (mBeatE / measureE.data.length * didxE);
                            longEnd = [ridxE, nBeatE, omitE];
                        } else {
                            longEnd = [ridxE, 0, omitE];
                        }

                        if (isBalloonSymbol(note)) {
                            balloonCount = dToBalloonCount[didx];
                            if (balloonCount === undefined)
                                balloonCount = 5;
                        }
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
                            drawRendaSmall(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2]);
                            break;

                        case '6':
                            drawRendaBig(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2]);
                            break;

                        case '7':
                            drawBalloon(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount);
                            break;

                        case '9':
                            drawBalloonEx(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount);
                            break;

                        case 'C':
                            drawSmallNote(ctx, ridx, nBeat, '#000');
                            break;

                        case 'D':
                            drawFuse(ctx, rows, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount);
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

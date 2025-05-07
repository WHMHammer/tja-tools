import { drawLine, drawCircle, drawCircleRightHalf, drawRect, drawText, drawPixelText, drawSprite, drawImageText, initSprites } from './canvasHelper';
import { isRollSymbol, isBalloonSymbol } from './analyseChart';
import { toFixedZero } from './main';
import { callFontSetting, getUraSymbol } from './font/font';

//==============================================================================
// Drawing config and helpers

const CHART_PADDING_TOP = 110;
const CHART_PADDING_BOTTOM = -14;
const CHART_BG = '#cccccc';

const ROW_MARGIN_BOTTOM = 14;
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
let rowDeltas = [];
const branchTypes = ['N','E','M'];

function sumNums(array, offset = -1) {
	let result = 0;
	if (offset === -1) {
		offset = array.length;
	}
	
	for (let i = 0; i < array.length; i++) {
		if (i === offset) {
			break;
		}
		result += array[i];
	}
	
	return result;
}

export function compareArray(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}

//==============================================================================
// Notes

function getNoteCenter(row, beat) {
    return {
        x: GET_BEAT_X(beat),
        y: GET_ROW_Y(row) + ROW_OFFSET_NOTE_CENTER + sumNums(rowDeltas, row),
    };
}

function drawSmallNote(ctx, x, y, color, drawInner = true, side = 'all') {
    const draw = (side === 'left') ? drawCircleLeftHalf
        : (side === 'right') ? drawCircleRightHalf
        : drawCircle;

    draw(ctx, x, y, NOTE_RADIUS, '#2e2e2e');

    if (drawInner) {
        draw(ctx, x, y, NOTE_RADIUS - 1, '#fff');
        draw(ctx, x, y, NOTE_RADIUS - 2, color);
    }
    else {
        draw(ctx, x, y, NOTE_RADIUS - 1, color);
    }
}

function drawNoteSprite(ctx, row, yDelta, beat, type) {
	const { x, y } = getNoteCenter(row, beat);
	if (type === 'fuse')
		drawSmallNote(ctx, x, y + yDelta, '#a4f', false);
	else if (type === 'fuseEnd')
		drawSmallNote(ctx, x, y + yDelta, '#640aad', true, 'right');
	else
		drawSprite(ctx, x - 12, y - 12 + yDelta, type, 'notes');
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
	
	const startOffset = sBeat === 0 ? 24 : 0;
	
    if (sRow === eRow) {
        const w = ex - sx;

        if (isGogo) {
            drawRect(ctx, sx - startOffset, sy, w + startOffset, h, color);
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
            drawRect(ctx, sx - startOffset, sy, sw + startOffset, h, color);
        }
        else {
            drawRect(ctx, sx, sy, sw - 24, h, '#000');
            drawRect(ctx, sx, sy + 1, sw - 24, h - 2, '#fff');
            drawRect(ctx, sx, sy + 2, sw - 24, h - 4, color);
        }

        // full rows
        for (let r = sRow + 1; r < eRow; r++) {
            let ry = GET_ROW_Y(r) + sumNums(rowDeltas, r);
            let rw = GET_BEAT_X(rows[r].totalBeat) + ROW_TRAILING;

            if (isGogo) {
                drawRect(ctx, 0, ry, rw, h, color);
            }
            else {
                ry += ROW_OFFSET_NOTE_CENTER - NOTE_RADIUS - (isBig ? 3 : 0)
                drawRect(ctx, 24, ry, rw - 48, h, '#000');
                drawRect(ctx, 24, ry + 1, rw - 48, h - 2, '#fff');
                drawRect(ctx, 24, ry + 2, rw - 48, h - 4, color);
            }
        }

        // start-of-row to end
        let ew = GET_BEAT_X(eBeat);
		if (isNaN(eBeat)) {
			ew = GET_BEAT_X(rows[eRow].totalBeat) + ROW_TRAILING;
		}

        if (isGogo) {
			const fixedew = eBeat === 0 ? 0 : ew;
            drawRect(ctx, 0, ey, fixedew, h, color);
        }
        else {
            drawRect(ctx, 24, ey, ew - 24, h, '#000');
            drawRect(ctx, 24, ey + 1, ew - 24, h - 2, '#fff');
            drawRect(ctx, 24, ey + 2, ew - 24, h - 4, color);
        }
    }
}

function drawLongSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, type) {
    let { x: sx, y: sy } = getNoteCenter(sRow, sBeat);
    let { x: ex, y: ey } = getNoteCenter(eRow, eBeat);
	sy += (rows[sRow].branch.indexOf(bt) * 24);
	if (eRow != undefined) {
		ey += (rows[eRow].branch.indexOf(bt) * 24);
	}
	else {
		ey += (rows[rows.length - 1].branch.indexOf(bt) * 24);
	}
	
    const isGogo = false;
    const isBig = false;

    const yDelta = 12;
    sy -= yDelta;
    ey -= yDelta;

    const h = 0;

    if (sRow === eRow) {
        const w = ex - sx;

        if (isGogo) {
            drawRect(ctx, sx, sy, w, h, color);
        }
        else {
			drawRectSprite(ctx, sx, sy, w, type)
        }
    }
    else {
        // start to end-of-row
        const endOfStartRow = rows[sRow].totalBeat,
            sw = GET_BEAT_X(endOfStartRow) - sx + ROW_TRAILING;

        if (isGogo) {
			const startOffset = sBeat === 0 ? 24 : 0;
            drawRect(ctx, sx - startOffset, sy, sw + startOffset, h, color);
        }
        else {
			drawRectSprite(ctx, sx, sy, sw - 24, type)
        }

        // full rows
        for (let r = sRow + 1; r < eRow; r++) {
            let ry;
			if (r != undefined) {
				ry = GET_ROW_Y(r) + sumNums(rowDeltas, r) + (rows[r].branch.indexOf(bt) * 24);
			}
			else {
				ry = GET_ROW_Y(r) + sumNums(rowDeltas, r) + (rows[rows.length - 1].branch.indexOf(bt) * 24);
			}
            let rw = GET_BEAT_X(rows[r].totalBeat) + ROW_TRAILING;

            if (isGogo) {
                drawRect(ctx, 0, ry, rw, h, color);
            }
            else {
                ry += ROW_OFFSET_NOTE_CENTER - yDelta;
				drawRectSprite(ctx, 24, ry, rw - 48, type);
            }
        }

        // start-of-row to end
        let ew = GET_BEAT_X(eBeat);
		if (isNaN(eBeat)) {
			ew = GET_BEAT_X(rows[eRow].totalBeat);
		}

        if (isGogo) {
			const fixedew = eBeat === 0 ? 0 : ew;
            drawRect(ctx, 0, ey, fixedew, h, color);
        }
        else {
			drawRectSprite(ctx, 24, ey, ew - 24, type)
        }
    }
}

function drawRectSprite(ctx, x, y, w, type) {
	if (type === 'fuseMiddle') {
		y = y + 12 - NOTE_RADIUS;
		drawRect(ctx, x, y, w, 2 * NOTE_RADIUS, '#000');
		drawRect(ctx, x, y + 1, w, 2 * (NOTE_RADIUS - 1), '#fff');
		drawRect(ctx, x, y + 2, w, 2 * (NOTE_RADIUS - 2), '#640aad');
	} else {
		for (let i = 0; i < w; i++) {
			drawSprite(ctx, x + i, y, type, 'notes');
		}
	}
}

function drawRendaSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, omitEnd, type) {
	if (eRow != undefined && !omitEnd) {
		drawNoteSprite(ctx, eRow, rows[eRow].branch.indexOf(bt) * 24, eBeat, type + 'End');
	}
	let feRow = eRow;
	let feBeat = eBeat;
	if (eRow == undefined) {
		feRow = rows.length - 1;
		feBeat = rows[rows.length - 1].totalBeat;
	}
	drawLongSprite(ctx, rows, bt, sRow, sBeat, feRow, feBeat, type + 'Middle');
	drawNoteSprite(ctx, sRow, rows[sRow].branch.indexOf(bt) * 24, sBeat, type + 'Start');
}

function drawBalloonSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, omitEnd, count, imo = false, spSymbol = 'kusudama') {
	let symbol = 'balloon';
	if (imo) {
		if (spSymbol === 'denden') {
			symbol = 'denden';
		}
		else if (spSymbol === 'potato') {
			symbol = 'potato';
		}
		else if (spSymbol === 'suzudon') {
			symbol = 'suzudon';
		}
		else {
			symbol = 'kusudama';
		}
	}
	
	if (eRow != undefined && !omitEnd) {
		drawNoteSprite(ctx, eRow, rows[eRow].branch.indexOf(bt) * 24, eBeat, 'spRollEnd');
	}
	drawLongSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, 'spRollMiddle');
	drawNoteSprite(ctx, sRow, rows[sRow].branch.indexOf(bt) * 24, sBeat, 'spRollStart');
	drawNoteSprite(ctx, sRow, rows[sRow].branch.indexOf(bt) * 24, sBeat, symbol);
	
	const { x, y } = getNoteCenter(sRow, sBeat);
	const xDelta = Math.floor((count.toString().length * 6) / 2) - 3
	drawImageText(ctx, x - 3 - xDelta, y - 3 + (rows[sRow].branch.indexOf(bt) * 24), count.toString(), 'num');
}

function drawFuseSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, omitEnd, count) {
	if (eRow != undefined && !omitEnd) {
		drawNoteSprite(ctx, eRow, rows[eRow].branch.indexOf(bt) * 24, eBeat, 'fuseEnd');
	}
	drawLongSprite(ctx, rows, bt, sRow, sBeat, eRow, eBeat, 'fuseMiddle');
	drawNoteSprite(ctx, sRow, rows[sRow].branch.indexOf(bt) * 24, sBeat, 'fuse');

	const { x, y } = getNoteCenter(sRow, sBeat);
	const xDelta = Math.floor((count.toString().length * 6) / 2) - 3
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
	let preDataNum = 0;
	let preBranch = [];
	rowDeltas = [];
	let moveLineTemp = 0;

    for (let midx = 0; midx < course.measures.length; midx++) {
        const measure = course.measures[midx];
        const measureBeat = measure.length[0] / measure.length[1] * 4;

		let rowBranch = [];
		for (let bt of branchTypes) {
			if (measure.data[bt] != null) {
				rowBranch.push(bt);
			}
		}

		if (measure.properties.moveLine != undefined && !isNaN(measure.properties.moveLine)) {
			moveLineTemp = measure.properties.moveLine;
		}

        if (ttRowBeat < rowBeat + measureBeat || measure.properties.ttBreak || (midx > 0 && !compareArray(preBranch, rowBranch))) {
            rows.push({ beats: rowBeat, measures: rowTemp, dataNum: preDataNum, branch: preBranch, moveLine: moveLineTemp});
            rowTemp = [];
            rowBeat = 0;
        }

        rowTemp.push(measure);
        rowBeat += measureBeat;
		preDataNum = measure.dataNum;
		preBranch = rowBranch;
    }

    if (rowTemp.length)
        rows.push({ beats: rowBeat, measures: rowTemp, dataNum: preDataNum, branch: preBranch, moveLine: moveLineTemp });

	for (let ridx = 0; ridx < rows.length; ridx++) {
		rowDeltas.push((rows[ridx].dataNum - 1) * 24);
	}

    const canvasWidth = ROW_LEADING + (BEAT_WIDTH * ttRowBeat) + ROW_TRAILING;
    const canvasHeight = CHART_PADDING_TOP + ((ROW_HEIGHT + ROW_MARGIN_BOTTOM) * rows.length) + CHART_PADDING_BOTTOM + sumNums(rowDeltas);

    const $canvas = document.createElement('canvas');
    $canvas.width = canvasWidth;
    $canvas.height = canvasHeight;

    // Add canvas element temporarily for small font rendering
    // Ref: https://bugs.chromium.org/p/chromium/issues/detail?id=826129
    //document.body.appendChild($canvas);

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

            const y = GET_ROW_Y(ridx) + sumNums(rowDeltas, ridx);

			let rowOffset = 0;
			const rowColor1 = {'N':'#d4d4d4','E':'#c9dede','M':'#dec9c9'};
			const rowColor2 = {'N':'#aaaaaa','E':'#94bfbf','M':'#bf9494'};
			const rowColor3 = {'N':'#808080','E':'#609f9f','M':'#9f6060'};
            drawRect(ctx, 0, y + ROW_HEIGHT_INFO, rowWidth, 2, '#000');
            drawRect(ctx, 0, y + ROW_HEIGHT_INFO + 2, rowWidth, 2, '#fff');
			drawRect(ctx, 0, y + ROW_HEIGHT_INFO + 4, rowWidth, 1, rowColor1[row.branch[0]]);
            drawRect(ctx, 0, y + ROW_HEIGHT_INFO + 5, rowWidth, 1, rowColor2[row.branch[0]]);
			rowOffset += 6;
			
			switch (row.dataNum) {
				case 1:
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 12, rowColor3[row.branch[0]]);
					rowOffset += ROW_HEIGHT_NOTE - 12;
					break;
				case 2:
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 10, rowColor3[row.branch[0]]);
					rowOffset += ROW_HEIGHT_NOTE - 10;
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 10, rowColor3[row.branch[1]]);
					rowOffset += ROW_HEIGHT_NOTE - 10;
					break;
				case 3:
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 10, rowColor3[row.branch[0]]);
					rowOffset += ROW_HEIGHT_NOTE - 10;
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 8, rowColor3[row.branch[1]]);
					rowOffset += ROW_HEIGHT_NOTE - 8;
					drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, ROW_HEIGHT_NOTE - 10, rowColor3[row.branch[2]]);
					rowOffset += ROW_HEIGHT_NOTE - 10;
					break;
			}
			
			drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset, rowWidth, 1, rowColor2[row.branch[row.branch.length - 1]]);
			drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset + 1, rowWidth, 1, rowColor1[row.branch[row.branch.length - 1]]);
			drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset + 2, rowWidth, 2, '#fff');
			drawRect(ctx, 0, y + ROW_HEIGHT_INFO + rowOffset + 4, rowWidth, 2, '#000');
        }
		
		let uraSymbols = getUraSymbol(chart.headers.font.toLowerCase());
		let titleUraSymbol = uraSymbols.title;
		let levelUraSymbol = uraSymbols.level;
		
		const fixedTitle = (course.headers.course === 4 && chart.headers.levelUra != 1) ? chart.headers.title + titleUraSymbol : chart.headers.title;
		
		const difficulty = ['かんたん', 'ふつう', 'むずかしい', 'おに', 'おに' + (chart.headers.levelUra === 1 ? levelUraSymbol : '')];
        const levelMax = [5, 7, 8, 10, 10];
        const difficultyText = (
            difficulty[course.headers.course] + ' ' +
            '★'.repeat(course.headers.level) +
            '☆'.repeat(Math.max(levelMax[course.headers.course] - course.headers.level, 0)) +
            ` Lv.${course.headers.level}`
        );
		
		let titleTextColor = '#000';
		if (chart.headers.titleColor === 1 || chart.headers.titleColor === 2) {
			if (chart.headers.genre === 'J-POP' || chart.headers.genre === 'ポップス') {
				titleTextColor = chart.headers.titleColor === 2 ? '#49d5eb' : '#005057';
			}
			else if (chart.headers.genre === 'キッズ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#fdc000' : '#a53200';
			}
			else if (chart.headers.genre === 'アニメ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#ffad33' : '#a73b00';
			}
			else if (chart.headers.genre === 'アニメ2') {
				titleTextColor = chart.headers.titleColor === 2 ? '#fe90d2' : '#9b1863';
			}
			else if (chart.headers.genre === 'ボーカロイド™楽曲' || chart.headers.genre === 'ボーカロイド™' || chart.headers.genre === 'ボーカロイド' || chart.headers.genre === 'ボーカロイド楽曲' || chart.headers.genre === 'ボカロ楽曲' || chart.headers.genre === 'ボカロ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#cbcfde' : '#263449';
			}
			else if (chart.headers.genre === 'ゲームミュージック' || chart.headers.genre === 'ゲーミュ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#cc8aeb' : '#4e1d76';
			}
			else if (chart.headers.genre === 'バラエティ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#0acc2a' : '#144f14';
			}
			else if (chart.headers.genre === 'クラシック') {
				titleTextColor = chart.headers.titleColor === 2 ? '#ded523' : '#65432a';
			}
			else if (chart.headers.genre === 'ナムコオリジナル' || chart.headers.genre === 'ナムオリ') {
				titleTextColor = chart.headers.titleColor === 2 ? '#ff7028' : '#961f00';
			}
		}
		
		let levelTextColor = '#000';
		const diffColors = ['#f22706', '#92c400', '#0090e8', '#ce00a2', '#5a3cdc'];
		switch (chart.headers.levelColor) {
			case 1:
				levelTextColor = diffColors[course.headers.course];
				if (course.headers.course === 4) {
					levelTextColor = diffColors[3];
				}
				break;
			case 2:
				levelTextColor = diffColors[course.headers.course];
				break;
		}
		
		let fontSetting = callFontSetting(chart.headers.font.toLowerCase());
		
		drawText(ctx, fontSetting.x1, fontSetting.y1, fixedTitle, fontSetting.titleText, titleTextColor, 'top', 'left', fontSetting.stroke1);
		drawText(ctx, fontSetting.x2, fontSetting.y2, chart.headers.subtitle, fontSetting.subTitleText, titleTextColor, 'top', 'left', fontSetting.stroke1);
		if (course.headers.maker !== null || chart.headers.maker !== null)
			drawText(ctx, fontSetting.x1, fontSetting.y2 + (fontSetting.y2 - 2 * fontSetting.y1), `Charter: ${(course.headers.maker !== null) ? course.headers.maker : chart.headers.maker}`, fontSetting.subTitleText, levelTextColor, 'top', 'left', fontSetting.stroke2);
		drawText(ctx, fontSetting.x2, fontSetting.y2 + 2 * (fontSetting.y2 - 2 * fontSetting.y1), difficultyText, fontSetting.subTitleText, levelTextColor, 'top', 'left', fontSetting.stroke2);
		
        //============================================================================
        // 3. Go-go time, measure grid, events

        let gogoStart = false;
        let measureNumber = 1;
		let barline = true;
		let barlineTemp;
		let moveEvent = 0;
		let moveEventTemp;
		let branchStartTemp = false;
		let avoidText = false;

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
                    const eBeat = beat + (mBeat / (measure.data[row.branch[0]].length || 1) * event.position);

                    if (event.name === 'gogoStart' && !gogoStart) {
                        gogoStart = [ridx, eBeat];
                    }
                    else if (event.name === 'gogoEnd' && gogoStart) {
                        drawLong(ctx, rows, gogoStart[0], gogoStart[1], ridx, eBeat, '#ffc0c0', 'gogo');
                        gogoStart = false;
                    }
                }

                beat += mBeat;
            }
			
			if (ridx == rows.length - 1 && gogoStart) {
				drawLong(ctx, rows, gogoStart[0], gogoStart[1], ridx, beat + 0.5, '#ffc0c0', 'gogo');
			}
        }

        for (let ridx = 0; ridx < rows.length; ridx++) {
            const row = rows[ridx], measures = row.measures;
            let beat = 0;
			let eventCover = [];

            const y = GET_ROW_Y(ridx) + sumNums(rowDeltas, ridx);

            for (let midx = 0; midx < measures.length; midx++) {
                const mx = GET_BEAT_X(beat);
                const measure = measures[midx];
                const mBeat = measure.length[0] / measure.length[1] * 4;
				let firstScrollCount = 0;

                // Sub grid
                const ny = y + ROW_HEIGHT_INFO;

                for (let i = 0; i < measure.length[0] * 2 + 1; i++) {
                    const subBeat = i / measure.length[1] * 2;
                    const subx = GET_BEAT_X(beat + subBeat);
                    const style = '#fff' + (i % 2 ? '4' : '8');

                    drawLine(ctx, subx, ny, subx, ny + ROW_HEIGHT_NOTE + rowDeltas[ridx], 2, style);
                }

				// Events Pre
				barlineTemp = barline;
				moveEventTemp = moveEvent;
				branchStartTemp = false;
				for (let i = 0; i < measure.events.length; i++) {
					const event = measure.events[i];
                    if (event.name === 'barlineon') {
						barline = true;
						if (event.position === 0) {
							barlineTemp = true;
						}
					}
					else if (event.name === 'barlineoff') {
						barline = false;
						if (event.position === 0) {
							barlineTemp = false;
						}
					}
					else if (event.name === 'moveEvent') {
						if (event.position === 0) {
							moveEventTemp = isNaN(event.value) ? moveEvent : event.value;
						}
					}
					else if (event.name === 'branchStart') {
						if (event.position === 0) {
							branchStartTemp = true;
						}
					}
                }

                // Events
                for (let i = 0; i < measure.events.length; i++) {
                    const event = measure.events[i];
                    const eBeat = mBeat / (measure.data[row.branch[0]].length || 1) * event.position;
                    const ex = GET_BEAT_X(beat + eBeat);

                    if (event.name === 'scroll') {
						let scrollsTemp = [];
						
						for (let b of branchTypes) {
							if (event.value[b] === null) {
								continue;
							}
							let duplicate = false;
							for (let j = 0; j < scrollsTemp.length; j++) {
								if (event.value[b] === scrollsTemp[j].value) {
									scrollsTemp[j].branch.push(b);
									duplicate = true;
									break;
								}
							}
							if (!duplicate) {
								scrollsTemp.push({value:event.value[b], branch:[]});
								scrollsTemp[scrollsTemp.length - 1].branch.push(b);
							}
						}
						
						if (barlineTemp || event.position > 0) {
							drawLine(ctx, ex, y + moveEvent - ((scrollsTemp.length - 1) * 6), ex, y + ROW_HEIGHT + rowDeltas[ridx], 2, '#444', eventCover, avoidText);
						}
                        //drawPixelText(ctx, ex + 2, y + ROW_HEIGHT_INFO - 13, 'HS ' + toFixedZero(event.value.toFixed(2)), '#f00', 'bottom', 'left');
						
						let scrollCount = 0;
						for (let sTemp of scrollsTemp.reverse()) {
							let scrollText = '';
							
							if (scrollsTemp.length != 1 || sTemp.branch.length != measure.dataNum) {
								for (let stb of sTemp.branch) {
									if (stb === 'N') {
										scrollText += '普';
									}
									else if (stb === 'E') {
										scrollText += '玄';
									}
									else if (stb === 'M') {
										scrollText += '達';
									}
								}
							}

							scrollText += 'HS' + toFixedZero(parseFloat(sTemp.value).toFixed(2));
							drawImageText(ctx, ex, y + ROW_HEIGHT_INFO - 18 + moveEvent - (scrollCount * 6), scrollText, 'hs');
							eventCover.push({
								stx:ex + 1, sty:y + ROW_HEIGHT_INFO - 18 + moveEvent - (scrollCount * 6),
								enx:ex + (6 * scrollText.length) - 1, eny:y + ROW_HEIGHT_INFO - 18 + moveEvent - (scrollCount * 6) + 5,
							});
							scrollCount++;
							if (event.position === 0) {
								firstScrollCount++;
							}
						}
                    }
                    else if (event.name === 'bpm') {
						if (barlineTemp || event.position > 0) {
							drawLine(ctx, ex, y + moveEvent, ex, y + ROW_HEIGHT + rowDeltas[ridx], 2, '#444', eventCover, avoidText);
						}
                        //drawPixelText(ctx, ex + 2, y + ROW_HEIGHT_INFO - 7, 'BPM ' + toFixedZero(event.value.toFixed(2)), '#00f', 'bottom', 'left');
						
						let bpmText = 'BPM' + toFixedZero(parseFloat(event.value).toFixed(2));
						drawImageText(ctx, ex, y + ROW_HEIGHT_INFO - 12 + moveEvent, bpmText, 'bpm');
						eventCover.push({
							stx:ex + 1, sty:y + ROW_HEIGHT_INFO - 12 + moveEvent,
							enx:ex + (6 * bpmText.length) - 1, eny:y + ROW_HEIGHT_INFO - 12 + moveEvent + 5,
						});
                    }
					else if (event.name === 'moveEvent') {
						moveEvent = isNaN(event.value) ? moveEvent : event.value;
					}
					else if (event.name === 'countChange') {
						measureNumber = isNaN(event.value) ? measureNumber : event.value;
					}
					else if (event.name === 'avoidtexton') {
						avoidText = true;
					}
					else if (event.name === 'avoidtextoff') {
						avoidText = false;
					}
                }

                // Measure lines, number
				const firstLineColor = branchStartTemp ? '#ffe400' : '#fff';
				if (firstScrollCount === 0) {
					firstScrollCount++;
				}
				if (barlineTemp) {
					drawLine(ctx, mx, y + moveEventTemp - ((firstScrollCount - 1) * 6), mx, y + ROW_HEIGHT + rowDeltas[ridx], 2, firstLineColor, eventCover, avoidText);
				}
				else if (branchStartTemp) {
					drawLine(ctx, mx, y + moveEventTemp - ((firstScrollCount - 1) * 6), mx, y + ROW_HEIGHT_INFO, 2, firstLineColor, eventCover, avoidText);
				}
                //drawPixelText(ctx, mx + 2, y + ROW_HEIGHT_INFO - 1, measureNumber.toString(), '#000', 'bottom', 'left');
				drawImageText(ctx, mx, y + ROW_HEIGHT_INFO - 6, measureNumber.toString(), 'num');
                measureNumber += 1;

                beat += mBeat;

                // Draw last measure line
				barlineTemp = barline;
				if (ridx === rows.length - 1 && midx === measures.length - 1) {
					barlineTemp = false;
				}
				else if (midx === measures.length - 1) {
					const measureTemp = rows[ridx + 1].measures[0];
					for (let i = 0; i < measureTemp.events.length; i++) {
						const event = measureTemp.events[i];
						if (event.name === 'barlineon') {
							if (event.position === 0) {
								barlineTemp = true;
							}
						}
						else if (event.name === 'barlineoff') {
							if (event.position === 0) {
								barlineTemp = false;
							}
						}
					}
				}
				else {
					for (let i = 0; i < measures[midx + 1].events.length; i++) {
						const event = measures[midx + 1].events[i];
						if (event.name === 'barlineon') {
							if (event.position === 0) {
								barlineTemp = true;
							}
						}
						else if (event.name === 'barlineoff') {
							if (event.position === 0) {
								barlineTemp = false;
							}
						}
					}
				}
				
				if (barlineTemp) {
					if (midx + 1 === measures.length) {
						const mx2 = GET_BEAT_X(beat);
						drawLine(ctx, mx2, y, mx2, y + ROW_HEIGHT + rowDeltas[ridx], 2, '#fff', eventCover, avoidText);
					}
				}
                
            }
        }

        //============================================================================
        // 4. Notes

		for (let bt of branchTypes) {
			// Pre-scan roll & balloon (forward scanning)

			let balloonIdx = 0;
			const rmdToBalloonCount = {};
			let rmdLastRoll = null;
			const rmdToRollEndRmd = {};
			for (let ridx = 0; ridx < rows.length; ridx++) {
				const mdToBalloonCount = rmdToBalloonCount[ridx] = {};
				const mdToRollEndRmd = rmdToRollEndRmd[ridx] = {};
				const measures = rows[ridx].measures;
				if (!rows[ridx].branch.includes(bt)) {
					continue;
				}

				for (let midx = 0; midx < measures.length; midx++) {
					const dToBalloonCount = mdToBalloonCount[midx] = {};
					const dToRollEndRmdx = mdToRollEndRmd[midx] = {};
					const measure = measures[midx];

					for (let didx = 0; didx < measure.data[bt].length; didx++) {
						const note = measure.data[bt].charAt(didx);
						if (isRollSymbol(note)) {
							if (rmdLastRoll !== null)
								continue;
							rmdLastRoll = [ridx, midx, didx];

							if (isBalloonSymbol(note)) {
								dToBalloonCount[didx] = course.headers.balloon[bt][balloonIdx++];
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
				rmdToRollEndRmd[ridxR][midxR][didxR] = [undefined, 0, 0, '#END'];
				rmdLastRoll = null;
			}

			// Draw (backward scanning)

			for (let ridx = rows.length - 1; ridx >= 0; ridx--) {
				const mdToBalloonCount = rmdToBalloonCount[ridx];
				const mdToRollEndRmd = rmdToRollEndRmd[ridx];
				const row = rows[ridx], measures = row.measures;
				let beat = 0;
				if (!row.branch.includes(bt)) {
					continue
				}
				const rowYDelta = row.branch.indexOf(bt) * 24;

				for (let midx = measures.length - 1; midx >= 0; midx--) {
					const dToBalloonCount = mdToBalloonCount[midx];
					const dToRollEndRmd = mdToRollEndRmd[midx];
					const measure = measures[midx], mBeat = measure.lengthNotes[0] / measure.lengthNotes[1] * 4;

					for (let didx = measure.data[bt].length; didx >= 0; didx--) {
						const note = measure.data[bt].charAt(didx);
						const nBeat = measure.rowBeat + (mBeat / measure.data[bt].length * didx);

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
								const mBeatE = measureE.lengthNotes[0] / measureE.lengthNotes[1] * 4;
								const nBeatE = measureE.rowBeat + (mBeatE / measureE.data[bt].length * didxE);
								if (ridxE > 0 && nBeatE === 0) {
									longEnd = [ridxE - 1, rows[ridxE - 1].beats, omitE];
								}
								else {
									longEnd = [ridxE, nBeatE, omitE];
								}
							} else {
								longEnd = [ridxE, 0, omitE];
							}

							if (isBalloonSymbol(note)) {
								balloonCount = dToBalloonCount[didx];
							}
						}

						switch (note) {
							case '1':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'don');
								break;

							case '2':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'kat');
								break;

							case '3':
							case 'A':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'bigDon');
								break;

							case '4':
							case 'B':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'bigKat');
								break;

							case '5':
								drawRendaSprite(ctx, rows, bt, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], 'roll');
								break;

							case '6':
								drawRendaSprite(ctx, rows, bt, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], 'bigRoll');
								break;

							case '7':
								drawBalloonSprite(ctx, rows, bt, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount);
								break;

							case '9':
								drawBalloonSprite(ctx, rows, bt, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount, true, chart.headers.spRoll);
								break;

							case 'C':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'bomb');
								break;

							case 'D':
								drawFuseSprite(ctx, rows, bt, ridx, nBeat, longEnd[0], longEnd[1], longEnd[2], balloonCount);
								break;
 
							case 'F':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'adlib');
								break;

							case 'G':
								drawNoteSprite(ctx, ridx, rowYDelta, nBeat, 'purple');
								break;
						}
					}
				}
			}
		}

        //document.body.removeChild($canvas);
        return $canvas;
    } catch (e) {
        //document.body.removeChild($canvas);
        throw e;
    }
}

export async function initUsedSprite() {
	await initSprites();
}
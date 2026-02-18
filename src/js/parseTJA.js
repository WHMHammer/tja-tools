import { arrayLCM, addZero } from './common';
import { difficultyTypeToString } from './i18n';

function parseCourseValue(courseValue) {
    switch (courseValue.toLowerCase()) {
        case 'easy': case '0':
            return 0;

        case 'normal': case '1':
            return 1;

        case 'hard': case '2':
            return 2;

        case 'oni': case '3':
            return 3;

        case 'edit': case 'ura': case '4':
            return 4;
    }
    return null;
}

function parseStyleValue(styleValue) {
    const intValue = parseInt(styleValue, 10);
    if (!isNaN(intValue) && intValue >= 1) {
        return intValue;
    }
    switch (styleValue.toLowerCase()) {
        case 'single':
            return 1;

        case 'couple': case 'double':
            return 2;
    }
    return null;
}

function noteSymbolToNoteType(noteSymbol) {
    switch (noteSymbol) {
        case '0':
            return 'blank';

        case '1':
            return 'don';

        case '2':
            return 'kat';

        case '3':
        case 'A':
            return 'donBig';

        case '4':
        case 'B':
            return 'katBig';

        case '5':
            return 'renda';

        case '6':
            return 'rendaBig';

        case '7':
            return 'balloon';

        case '8':
            return 'end';

        case '9':
            return 'balloonEx';

        case 'C':
            return 'mine';

        case 'D':
            return 'fuse';

        case 'F':
            return 'adlib';

        case 'G':
            return 'kadon';
    }
    return noteSymbol.match(/[0-9A-Z]/) ? 'unknown' : null;
}

function noteSymbolToHandType(noteSymbol) {
    switch (noteSymbol) {
        case 'A':
        case 'B':
            return 'handBig';
    }
    return null;
}

export function isRollType(noteType) {
    switch (noteType) {
        case 'renda':
        case 'rendaBig':
        case 'balloon':
        case 'balloonEx':
        case 'fuse':
        case 'hakushu': // H: bongo clap applause
        case 'rendaLeft': // I: bongo yellow/left roll
            return true;

        default:
            return false;
    }
}

export function isBalloonType(noteType) {
    switch (noteType) {
        case 'balloon':
        case 'balloonEx':
        case 'fuse':
            return true;

        default:
            return false;
    }
}

function getNotes(data, rollStates, balloon, midx, currentBranch) {
    const notes = [];
    data = data.replaceAll(/\s+/g, '');
    notes.nDivisions = data.length || 1;
    for (let d = 0, dSkip = 0; d < data.length; ++d) {
        const ch = data.charAt(d);

        let note = {
            symbol: ch,
            type: noteSymbolToNoteType(ch),
            handType: noteSymbolToHandType(ch),
            position: d - dSkip,
        };
        if (note.type === null) {
            // TODO: emit unrecognized note symbol (ignored) warning
            --notes.nDivisions;
            ++dSkip;
            continue;
        }
        if (note.type === 'unknown') {
            // TODO: emit unknown note type warning
        }

        if (isRollType(note.type)) {
            if (rollStates.roll[currentBranch] !== null)
                continue;
            rollStates.roll[currentBranch] = {note: note, midx: midx, didx: notes.length};

            if (isBalloonType(note.type)) {
                const balloonBranch = (balloon.type === 0) ? 'all' : currentBranch;
                note.count = balloon[balloonBranch][rollStates.balloonOffset[balloonBranch]++];
                if (note.count === undefined)
                    note.count = 0;
            }
        } else if (note.type !== 'blank' && rollStates.roll[currentBranch] !== null) {
            let noteEnd = {
                symbol: (note.type === 'end') ? ch : null,
                type: (note.type === 'end') ? 'end' : 'endForced',
                position: d - dSkip,
                start: rollStates.roll[currentBranch],
            };
            rollStates.roll[currentBranch].note.end = {note: noteEnd, midx: midx, didx: notes.length};
            notes.push(noteEnd);
            rollStates.roll[currentBranch] = null;
        }

        if (note.type !== 'blank' && note.type !== 'end')
            notes.push(note);
    }
    return notes;
}

function parseLine(line) {
    const HEADER_GLOBAL = [
        'TITLE',
        'SUBTITLE',
        'BPM',
        'WAVE',
        'OFFSET',
        'DEMOSTART',
        'GENRE',
        'MAKER',
		'FONT',
		'SPROLL',
		'LEVELCOLOR',
		'LEVELURA',
		'TITLECOLOR',
    ];

    const HEADER_COURSE = [
        'COURSE',
        'STYLE',
        'LEVEL',
        'BALLOON',
		'BALLOONNOR',
		'BALLOONEXP',
		'BALLOONMAS',
        'SCOREINIT',
        'SCOREDIFF',
        'NOTESDESIGNER0',
        'NOTESDESIGNER1',
        'NOTESDESIGNER2',
        'NOTESDESIGNER3',
        'NOTESDESIGNER4',
        'TTROWBEAT',
    ];

    const COMMAND = [
        'START',
        'END',
        'GOGOSTART',
        'GOGOEND',
        'MEASURE',
        'SCROLL',
        'BPMCHANGE',
        'DELAY',
        'BRANCHSTART',
        'BRANCHEND',
        'SECTION',
        'N',
        'E',
        'M',
        'LEVELHOLD',
        'BMSCROLL',
        'HBSCROLL',
        'BARLINEOFF',
        'BARLINEON',

        'TTBREAK',
		'NEWLINE',
		'MOVEEVENT',
		'COUNTCHANGE',
		'AVOIDTEXTOFF',
		'AVOIDTEXTON',
		'MOVELINE',
    ];

    let match;

    // comment
    line = line.trimStart();
    function trimComment(str) {
        return str.replace(/\/\/.*/, '').trim();
    }
    if (trimComment(line) === "")
        return null;

    // header
    if (match = line.match(/^(\.?[A-Z0-9_]+):(.*)/i)) { // . for simulator-exclusive headers, _ for i18n headers
        const nameUpper = match[1].toUpperCase();
        const value = match[2];

        return {
            type: 'header',
            scope: HEADER_COURSE.includes(nameUpper) ? 'course' : 'global',
            name: nameUpper,
            value: trimComment(value),
            valueRaw: value, // for TITLE:, SUBTITLE:, etc., in TaikoJiro
        };
    }
    // command
    else if (match = line.match(/^#([A-Z]+)\s?(.*)/i)) { // missing space is recognized in TaikoJiro
        const nameUpper = match[1].toUpperCase();
        const value = match[2];

        return {
            type: 'command',
            name: nameUpper,
            value: trimComment(value),
            valueRaw: value, // for #LYRIC, etc.
        };
    }
    // data
    else if (line.match(/^[0-9A-Z,]/)) { // loose pattern to prevent dropping note data with unknown note symbols
        return {
            type: 'data',
            data: trimComment(line),
        };
    }

    return {
        type: 'unknown',
        value: line,
    };
}

function getCourse(tjaHeaders, lines) {
    const defaultCourseHeaders = tjaHeaders.courseHeaders[undefined];
    const latestCourseHeaders = tjaHeaders.latestCourseHeaders;
    let courseHeaders = tjaHeaders.courseHeaders[latestCourseHeaders.course];
    const headers = {};

    function setHeaderValue(header, value) {
        latestCourseHeaders[header] = courseHeaders[header] = headers[header] = value;
    }

    function setHeaderBalloon(branch, value) {
        if (headers.balloon === undefined)
            headers.balloon = {'N': [], 'E': [], 'M': [], all: [], type: 0};
        headers.balloon[branch] = value;
        switch (branch) {
            case 'N': case 'E': case 'M':
                headers.balloon.type = 1;
        }
    }

    function deepCopyBalloonData(data) {
        const res = {...data};
        for (let branch of ['N', 'E', 'M', 'all']) {
            res[branch] = [...res[branch]];
        }
        return res;
    }

    function initBalloonHeader() {
        if (headers.balloon !== undefined) {
            latestCourseHeaders.balloon = courseHeaders.balloon = deepCopyBalloonData(headers.balloon);
            return;
        }
        if (courseHeaders.balloon !== undefined) {
            headers.balloon = deepCopyBalloonData(courseHeaders.balloon);
            return;
        }
        if (latestCourseHeaders.balloon !== undefined) {
            // TODO: warn apparent cross-course header fallback
            // No cross-course header fallbacks
        }
        headers.balloon = deepCopyBalloonData(defaultCourseHeaders.balloon);
    }

    const measures = [];

    // Process lines
    let hasStarted = false;
    let measureProperties = {}, measureData = '', measureEvents = [];
    let currentBranch = 'N';
    let targetBranch = 'N';
    let flagLevelhold = false;
	let branching = false;
	let midxBranchPoint = 0;
	let nBranchMeasures = 0;
	let nBranchMeasuresMax = 0;
	let rollStates = {
		balloonOffset: {N: 0, E: 0, M: 0, all: 0},
		roll: {N: null, E: null, M: null},
	};

    function addEventAt(measure, name, value) {
        measure.events.push({
            name: name,
            position: measureData.length,
            value: value,
            branch: currentBranch,
            branching: branching,
        });
    }

    function getMeasure(midx) {
        while (midx >= measures.length) {
            let measure = {
                length: null,
                lengthNotes: null,
                properties: {},
                data: {N: null, E: null, M: null},
                events: [],
                nDivisions: 1,
                dataBranches: [],
                branching: branching,
            };
            measures.push(measure);
        }
        return measures[midx];
    }

    function pushMeasure() {
        let midx = midxBranchPoint + nBranchMeasures++;
        getMeasure(midx).data[currentBranch] = getNotes(measureData, rollStates, headers.balloon, midx, currentBranch);
        measureData = '';
    }

    for (const line of lines) {
		let balloons;
        if (line.type === 'header') {
            switch (line.name) {
                case 'COURSE':
                    const course = parseCourseValue(line.value);
                    if (course !== null) {
                        // switch parsed course
                        if (tjaHeaders.courseHeaders[course] === undefined) {
                            courseHeaders = tjaHeaders.courseHeaders[course] = {};
                        }
                        setHeaderValue('course', course);
                    }
                    break;

                case 'STYLE':
                    const style = parseStyleValue(line.value);
                    if (style !== null) {
                        setHeaderValue('style', style);
                    }
                    break;

                case 'LEVEL':
                    if (line.value !== null)
                        setHeaderValue('level', line.value);
                    break;

                case 'BALLOON':
                    if (hasStarted) {
                        // TODO: warn post-#START BALLOON commands
                        break;
                    }
                    balloons = line.value
                        .split(/[^0-9]/)
                        .filter(b => b !== '')
                        .map(b => parseInt(b, 10));
                    setHeaderBalloon('all', balloons);
                    break;

				case 'BALLOONNOR':
					if (hasStarted) {
						// TODO: warn post-#START BALLOON commands
						break;
					}
                    balloons = line.value
                        .split(/[^0-9]/)
                        .filter(b => b !== '')
                        .map(b => parseInt(b, 10));
                    setHeaderBalloon('N', balloons);
                    break;

				case 'BALLOONEXP':
					if (hasStarted) {
						// TODO: warn post-#START BALLOON commands
						break;
					}
                    balloons = line.value
                        .split(/[^0-9]/)
                        .filter(b => b !== '')
                        .map(b => parseInt(b, 10));
                    setHeaderBalloon('E', balloons);
                    break;

				case 'BALLOONMAS':
					if (hasStarted) {
						// TODO: warn post-#START BALLOON commands
						break;
					}
                    balloons = line.value
                        .split(/[^0-9]/)
                        .filter(b => b !== '')
                        .map(b => parseInt(b, 10));
                    setHeaderBalloon('M', balloons);
                    break;

                case 'SCOREINIT':
					let inits = line.value
                        .split(/[^0-9]/)
                        .filter(b => b !== '')
                        .map(b => parseInt(b, 10));

                    setHeaderValue('scoreInit', (inits.length >= 1) ? inits[0] : 0);
                    setHeaderValue('scoreShin', (inits.length >= 2) ? inits[1] : null);
                    //headers.scoreInit = parseInt(line.value, 10);
                    break;

                case 'SCOREDIFF':
                    setHeaderValue('scoreDiff', (line.value !== '') ? parseInt(line.value, 10) : 0);
                    break;

                case 'NOTESDESIGNER0':
                case 'NOTESDESIGNER1':
                case 'NOTESDESIGNER2':
                case 'NOTESDESIGNER3':
                case 'NOTESDESIGNER4':
                    setHeaderValue('maker', line.valueRaw); // TODO: emit warning when value !== valueRaw
                    break;

                case 'TTROWBEAT':
                    const ttRowBeat = parseFloat(line.value);
                    if (ttRowBeat >= 1)
                        setHeaderValue('ttRowBeat', ttRowBeat);
                    break;

            }
        }
        else if (line.type === 'command') {
            if (!hasStarted && line.name !== 'END') {
                hasStarted = true;
                initBalloonHeader();
            }
            let currentMeasure = getMeasure(midxBranchPoint + nBranchMeasures);
            function addEvent(name, value) {
                addEventAt(currentMeasure, name, value);
            }
            switch (line.name) {
                case 'BRANCHSTART':
					/*
                    if (flagLevelhold) {
                        break;
                    }
                    let values = line.value.split(',');
                    if (values[0] === 'r') {
                        if (values.length >= 3) targetBranch = 'M';
                        else if (values.length === 2) targetBranch = 'E';
                        else targetBranch = 'N';
                    }
                    else if (values[0] === 'p') {
                        if (values.length >= 3 && parseFloat(values[2]) <= 100) targetBranch = 'M';
                        else if (values.length >= 2 && parseFloat(values[1]) <= 100) targetBranch = 'E';
                        else targetBranch = 'N';
                    }
					*/
					branching = true;
					currentBranch = 'N';
					if (nBranchMeasures > nBranchMeasuresMax)
						nBranchMeasuresMax = nBranchMeasures;
					midxBranchPoint = midxBranchPoint + nBranchMeasuresMax;
					nBranchMeasuresMax = nBranchMeasures = 0;

					currentMeasure = getMeasure(midxBranchPoint);
                    addEvent('branchStart');
                    break;

                case 'BRANCHEND':
                    branching = false;
                    currentBranch = 'N';
					if (nBranchMeasures > nBranchMeasuresMax)
						nBranchMeasuresMax = nBranchMeasures;
					midxBranchPoint = midxBranchPoint + nBranchMeasuresMax;
					nBranchMeasuresMax = nBranchMeasures = 0;

					currentMeasure = getMeasure(midxBranchPoint);
					addEvent('branchEnd');
                    break;

                case 'N':
                case 'E':
                case 'M':
                    currentBranch = line.name;
					if (branching) {
						if (nBranchMeasures > nBranchMeasuresMax)
							nBranchMeasuresMax = nBranchMeasures;
						nBranchMeasures = 0;
						currentMeasure = getMeasure(midxBranchPoint);
					}
                    break;

                case 'START':
                    let matchStartPlayer = line.value.match(/P(\d+)/);
                    if (matchStartPlayer) {
                        let startPlayer = parseInt(matchStartPlayer[1], 10);
                        if (startPlayer > 0) {
                            headers.startPlayer = startPlayer; // not a header but stored as such
                        }
                    }
                    break;

                case 'END':
                    hasStarted = false;
                    break;

                default:
                    switch (line.name) {
                        case 'MEASURE':
							let divs = line.value.replace(/,$/, '').split(',');
							if (divs.length === 0 || divs.length > 2)
								break;

							let div = divs[0].split('/').map(s => s.trim());
							if (!(div.length === 2 && div[0] && !isNaN(div[0]) && div[1] && !isNaN(div[1])))
								break;
							let measureDividend = parseFloat(div[0], 10);
							let measureDivisor = parseFloat(div[1], 10);
							if (!isFinite(measureDividend / measureDivisor))
								break;

							let measureDividendNotes;
							let measureDivisorNotes;
							if (divs[1] === undefined) {
								measureDividendNotes = measureDividend;
								measureDivisorNotes = measureDivisor;
							} else {
								let divNote = divs[1].split('/').map(s => s.trim());
								if (!(divNote.length === 2 && divNote[0] && !isNaN(divNote[0]) && divNote[1] && !isNaN(divNote[1])))
									break;
								measureDividendNotes = parseFloat(divNote[0], 10);
								measureDivisorNotes = parseFloat(divNote[1], 10);
								if (!isFinite(measureDividendNotes / measureDivisorNotes))
									break;
							}

							currentMeasure.length = [measureDividend, measureDivisor];
							currentMeasure.lengthNotes = [measureDividendNotes, measureDivisorNotes];
                            break;

                        case 'GOGOSTART':
                            addEvent('gogoStart');
                            break;

                        case 'GOGOEND':
                            addEvent('gogoEnd');
                            break;

                        case 'BARLINEON':
                            addEvent('barlineon');
                            break;

                        case 'BARLINEOFF':
                            addEvent('barlineoff');
                            break;

                        case 'SCROLL':
                            addEvent('scroll', line.value);
                            break;

                        case 'BPMCHANGE':
                            addEvent('bpm', line.value);
                            break;

						case 'MOVEEVENT':
                            addEvent('moveEvent', parseInt(line.value));
                            break;

						case 'COUNTCHANGE':
                            addEvent('countChange', parseInt(line.value));
                            break;

                        case 'AVOIDTEXTON':
                            addEvent('avoidtexton');
                            break;

                        case 'AVOIDTEXTOFF':
                            addEvent('avoidtextoff');
                            break;

						case 'DELAY':
                            addEvent('delay', parseFloat(line.value));
                            break;

						case 'SECTION':
                            addEvent('section');
                            break;

						case 'MOVELINE':
                            addEvent('moveLine', parseInt(line.value));
                            break;

                        case 'TTBREAK':
						case 'NEWLINE':
                            addEvent('ttBreak');
                            break;

						/*
                        case 'LEVELHOLD':
                            flagLevelhold = true;
						*/
                    }
            }
        }
        //else if (line.type === 'data' && currentBranch === targetBranch) {
		else if (line.type === 'data') {
            if (!hasStarted) {
                hasStarted = true;
                initBalloonHeader();
            }
            let data = line.data;
            let measures = data.split(',');
            for (let i = 0; i < measures.length - 1; ++i) {
                measureData += measures[i];
                pushMeasure();
            }
            measureData += measures[measures.length - 1];
        }
    }

    // handle notes past the last `,`
    if (measureData) {
        pushMeasure();
    }

    for (let bt of ['N', 'E', 'M']) {
        if (rollStates.roll[bt] !== null) {
            // TODO: warn unended roll
        }
    }

    if (measures.length) {
        // Make first BPM event
        let firstBPMEventFound = false;

        for (let i = 0; i < measures[0].events.length; i++) {
            const evt = measures[0].events[i];

            if (evt.name === 'bpm' && evt.position === 0) {
                firstBPMEventFound = true;
                break;
            }
        }

        if (!firstBPMEventFound) {
            measures[0].events.unshift({
                name: 'bpm',
                position: 0,
                value: tjaHeaders.bpm,
            });
        }
    }

	// After
	for (let i = 0; i < measures.length; i++) {
		// Calculate MEASURE progressively in case some measures were skipped
		if (measures[i].length === null)
			measures[i].length = (i > 0) ? measures[i - 1].length : [4, 4];
		if (measures[i].lengthNotes === null)
			measures[i].lengthNotes = (i > 0) ? measures[i - 1].lengthNotes : [4, 4];

		// Add Zero
		let lengths = [];
		const branchs = ['N','E','M'];

		for (let b of branchs) {
			if (measures[i].data[b] != null) {
				lengths.push(measures[i].data[b].nDivisions);
				measures[i].dataBranches.push(b);
			}
		}

		const fixedMax = measures[i].nDivisions = arrayLCM(lengths);

		for (let j = 0; j < measures[i].events.length; j++) {
			if (measures[i].data[measures[i].events[j].branch] != null) {
				const rate = fixedMax / measures[i].data[measures[i].events[j].branch].nDivisions;
				measures[i].events[j].position = measures[i].events[j].position * rate;
			}
		}

		for (let b of branchs) {
			if (measures[i].data[b] != null) {
				addZero(measures[i].data[b], fixedMax);
			}
		}

		// Merge HS Event + build row layout property
		measures[i].properties.ttBreaks = [];
		measures[i].properties.moveLines = [];
		let canDelete = [];
		let posToScroll = {};
		for (let j = 0; j < measures[i].events.length; j++) {
			const event = measures[i].events[j];
			if (event.name === 'scroll') {
				let value = event.value;
				let lastScroll = posToScroll[event.position];
				if (lastScroll === undefined) {
					lastScroll = posToScroll[event.position] = event;
					event.value = {};
					for (const bt of measures[i].dataBranches) {
						event.value[bt] = null;
					}
				}
				else {
					canDelete.push(j);
				}
				for (const bt of (event.branching ? [event.branch] : measures[i].dataBranches)) {
					lastScroll.value[bt] = value;
				}
			} else if (event.name === 'ttBreak') {
				measures[i].properties.ttBreaks.push(event);
			} else if (event.name === 'moveLine') {
				measures[i].properties.moveLines.push(event);
			}
		}
		measures[i].properties.ttBreaks.sort((a, b) => a.position - b.position);
		measures[i].properties.moveLines.sort((a, b) => a.position - b.position);

		for (let cd of canDelete.reverse()) {
			measures[i].events.splice(cd, 1);
		}

		// Recalculate branching state
		for (const pos in posToScroll) {
			const event = posToScroll[pos];
			let value = undefined;
			event.branching = false;
			for (const bt in event.value) {
				if (value !== undefined && event.value[bt] !== value) {
					event.branching = true;
					break;
				}
				value = event.value[bt];
			}
		}
	}

    // handle events past the last `,` without notes
    if (measures.length !== 0) {
        const measure = measures[measures.length - 1];
        if (measure.dataBranches.length === 0) {
            if (measure.events.length === 0) { // no events; can simply remove
                measures.pop();
            } else if (measures.length > 1) { // move to the back of the previous measure
                measures.pop();
                const lastMeasure = measures[measures.length - 1];
                for (let event of measure.events) {
                    event.position = lastMeasure.nDivisions;
                    lastMeasure.events.push(event);
                }
            } else { // add blank measure data
                measure.data['N'] = getNotes(''); // other arguments unused
            }
        }
    }

    // Output
    //console.log(measures[measures.length - 1])

    if (!hasStarted) {
        initBalloonHeader();
    }

    // handle header value fallbacks
    for (let header in defaultCourseHeaders) {
        if (header === 'balloon') {
            continue;
        }
        if (headers[header] !== undefined) {
            continue;
        }
        if (courseHeaders[header] !== undefined) {
            headers[header] = courseHeaders[header];
            continue;
        }
        if (latestCourseHeaders[header] !== undefined) {
            // TODO: warn apparent cross-course header fallback
            // No cross-course header fallbacks
        }
        headers[header] = defaultCourseHeaders[header];
    }

    return { headers, measures };
}

export default function parseTJA(tja) {
    // Split by lines
    const lines = tja.split(/(\r\n|\r|\n)/)
        .map(line => line.trim());

    const headers = {
        // global-fineness headers
        title: '',
        subtitle: '',
        bpm: 120,
        wave: '',
        offset: 0,
        demoStart: 0,
        genre: '',
        maker: null,
		font: 'donscore',
		spRoll: 'kusudama',
		levelColor: 0,
		levelUra: 0,
		titleColor: 0,

        // local-fineness headers
        courseHeaders: [],
        latestCourseHeaders: {},
    };

    // for initial parsed course-fineness headers
    headers.courseHeaders[undefined] = {
        course: 3,
        style: 1,
        startPlayer: 1,
        level: 0,
        balloon: {'N':[],'E':[],'M':[], all: [], type: 0},
        scoreInit: 0,
        scoreDiff: 0,
		scoreShin: null,
        maker: null,
        ttRowBeat: 16,
    };

    const courses = [];

    // Line by line
    let idx;
    let courseLines = [];

    // parse states
    let hasStarted = false;
    let hasData = false;

    function pushCourse() {
        if (courseLines.length) {
            if (!hasStarted) {
                // TODO: emit straying-#END warning
            }
            hasStarted = false;

            // process anyway to update global headers
            const course = getCourse(headers, courseLines);

            if (hasData) {
                hasData = false;
                courses.push(course);
            }
            courseLines = [];
        }
    }


    for (idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const parsed = parseLine(line);
        if (parsed === null)
            continue;

        if (parsed.type === 'header' && parsed.scope === 'global') {
            switch (parsed.name) {
                case 'TITLE':
                    headers.title = parsed.valueRaw; // TODO: emit warning when value !== valueRaw
                    break;

                case 'SUBTITLE':
                    headers.subtitle = parsed.valueRaw.replace(/^(\+\+|--)/, ''); // TODO: emit warning when value !== valueRaw
                    break;

                case 'BPM':
                    headers.bpm = parsed.value;
                    break;

                case 'WAVE':
                    headers.wave = parsed.value;
                    break;

                case 'OFFSET':
                    headers.offset = parseFloat(parsed.value);
                    break;

                case 'DEMOSTART':
                    headers.demoStart = parseFloat(parsed.value);
                    break;

                case 'GENRE':
                    headers.genre = parsed.valueRaw; // TODO: emit warning when value !== valueRaw
                    break;

                case 'MAKER':
                    headers.maker = parsed.valueRaw; // TODO: emit warning when value !== valueRaw
                    break;

				case 'FONT':
                    headers.font = parsed.value;
                    break;

				case 'SPROLL':
                    headers.spRoll = parsed.value.toLowerCase();
                    break;

				case 'LEVELCOLOR':
                    headers.levelColor = parseInt(parsed.value, 10);
					if (isNaN(headers.levelColor)) {
						headers.levelColor = 0;
					}
                    break;

				case 'LEVELURA':
                    headers.levelUra = parseInt(parsed.value, 10);
					if (isNaN(headers.levelUra)) {
						headers.levelUra = 0;
					}
                    break;

				case 'TITLECOLOR':
                    headers.titleColor = parseInt(parsed.value, 10);
					if (isNaN(headers.titleColor)) {
						headers.titleColor = 0;
					}
                    break;
            }
        }
        else if (parsed.type === 'header' && parsed.scope === 'course') {
            if ((parsed.name === 'COURSE' || parsed.name === 'STYLE') && hasStarted) {
                // TODO: emit missing-#END warning
                pushCourse();
                hasStarted = false;
            }
            courseLines.push(parsed);
        }
        else if (parsed.type === 'command') {
            if (parsed.name === 'START') {
                hasStarted = true;
            }
            courseLines.push(parsed);

            if (parsed.name === 'END') {
                pushCourse();
            }
        }
        else if (parsed.type === 'data') {
            if (!hasStarted) {
                if (!parsed.data.match(/^[0-9]/)) // likely an incomplete header
                    continue; // TODO: emit incomplete header warning
                // TODO: emit missing-#START warning
                hasStarted = true;
            }
            courseLines.push(parsed);
            hasData = true;
        }
    }

    pushCourse();

    // Return
	console.log(courses);
    return { headers, courses };
}

export function getCourseLines(tja, chart, courseId) {
	let result = [];
	const course = chart.courses[courseId];
	const courseTarget = course.headers.course;
	const styleTarget = course.headers.style;

	let courseValue = undefined;
	let styleValues = [];
	styleValues[undefined] = 1;

	const getWriteHeader = () => (courseValue === undefined || courseValue === courseTarget);
	const getWriteData = () => (
		((courseValue !== undefined) ? courseValue : 3) === courseTarget
		&& styleValues[courseValue] === styleTarget
	);

	let writeHeader = getWriteHeader();
	let writeData = getWriteHeader();

	const lines = tja.split(/(\r\n|\r|\n)/);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		const parsed = parseLine(line);
		if (parsed === null)
			continue;

		if (parsed.type === 'header' && parsed.scope === 'global') {
			result.push(line);
		}
		else if (parsed.type === 'header' && parsed.scope === 'course') {
			if (parsed.name === 'COURSE') {
				let value = parseCourseValue(parsed.value);
				if (value !== null) {
					courseValue = value;
					if (styleValues[courseValue] === undefined)
						styleValues[courseValue] = styleValues[undefined];
					writeHeader = getWriteHeader();
					writeData = getWriteData();
				}
			}
			else if (parsed.name === 'STYLE') {
				let value = parseStyleValue(parsed.value);
				if (value !== null) {
					styleValues[courseValue] = value;
					writeData = getWriteData();
				}
			}
			if (writeHeader)
				result.push(line);
		}
		else if (parsed.type === 'command') {
			if (writeData)
				result.push(line);
        }
		else if (parsed.type === 'data') {
			if (writeData)
				result.push(line);
        }
	}

	return result.join('\n');
}

export function getEnabledBranch(chart, courseId) {
	const branchTypes = ['N','E','M'];
	let result = [];
	const course = chart.courses[courseId];
	if (course === undefined)
		return result;

	for (let bt of branchTypes) {
		let enabled = false;
		for (let m of course.measures) {
			if (m.branching && m.data[bt] != null) {
				result.push(bt);
				break;
			}
		}
	}

	return result;
}

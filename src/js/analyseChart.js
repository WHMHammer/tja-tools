import { bsearchLeftmost } from './common';

function pulseToTime(events, objects) {
    let bpm = 120;
    let passedBeat = 0, passedTime = 0;
    let eidx = 0, oidx = 0;

    let times = [];

    while (oidx < objects.length) {
        let event = events[eidx], obj = objects[oidx];

        while (event && event.absBeat <= obj.absBeat) {
            if (event.type === 'delay') {
                passedTime += event.value;
            }
            if (event.type === 'bpm') {
                let beat = event.beat - passedBeat;
                let time = 60 / bpm * beat;

                passedBeat += beat;
                passedTime += time;
                bpm = parseFloat(event.value);
            }

            eidx++;
            event = events[eidx];
        }

        let beat = obj.beat - passedBeat;
        let time = 60 / bpm * beat;
        times.push(passedTime + time);

        passedBeat += beat;
        passedTime += time;
        oidx++;
    }

    return times;
}

function convertToTimed(course, branchType) {
    const events = [], notes = [];
    let beat = 0, absBeat = 0, balloon = 0, roll = false, midxToNoteIdx = [];

	// Get Branch Data
	let newData = [];
	const branchTypes = ['N','E','M'];
	let allBalloon = {'N':{},'E':{},'M':{}};

	for (let i = 0; i < course.measures.length; i++) {
		let selected = branchType;
		let selData = '';
		const measure = course.measures[i];

		switch (branchType) {
			case 'N':
				if (measure.data['N'] != null) {
					selected = 'N';
					selData = measure.data['N'];
				}
				else if (measure.data['E'] != null) {
					selected = 'E';
					selData = measure.data['E'];
				}
				else if (measure.data['M'] != null) {
					selected = 'M';
					selData = measure.data['M'];
				}
				break;
			case 'E':
				if (measure.data['E'] != null) {
					selected = 'E';
					selData = measure.data['E'];
				}
				else if (measure.data['N'] != null) {
					selected = 'N';
					selData = measure.data['N'];
				}
				else if (measure.data['M'] != null) {
					selected = 'M';
					selData = measure.data['M'];
				}
				break;
			case 'M':
				if (measure.data['M'] != null) {
					selected = 'M';
					selData = measure.data['M'];
				}
				else if (measure.data['E'] != null) {
					selected = 'E';
					selData = measure.data['E'];
				}
				else if (measure.data['N'] != null) {
					selected = 'N';
					selData = measure.data['N'];
				}
				break;
		}
		newData.push(selData);
	}

	// Analyze Events
    for (let m = 0; m < course.measures.length; m++) {
        const measure = course.measures[m];
        const length = measure.length[0] / measure.length[1] * 4;

        for (let e = 0; e < measure.events.length; e++) {
            const event = measure.events[e];
            const eBeat = length / measure.nDivisions * event.position;

            switch (event.name) {
                case 'bpm':
                case 'delay':
                case 'gogoStart':
                case 'gogoEnd':
                    events.push({
                        type: event.name,
                        value: event.value,
                        beat: beat + eBeat,
                        absBeat: absBeat + Math.abs(eBeat),
                    });
                    break;
                default:
                    break;
            }
        }

		// Analyze Notes
        midxToNoteIdx[m] = notes.length;
        for (let d = 0; d < newData[m].length; d++) {
            const note = newData[m][d];
            const nBeat = length / newData[m].nDivisions * note.position;

            if (note.type) {
                notes.push({
                    type: note.type,
                    count: note.count,
                    end: note.end,
                    beat: beat + nBeat,
                    absBeat: absBeat + Math.abs(nBeat),
                });
            }
        }

        beat += length;
        absBeat += Math.abs(length);
    }

    const times = pulseToTime(events, notes.map(n => ({beat: n.beat, absBeat: n.absBeat})));
    times.forEach((t, idx) => { notes[idx].time = t; });

    return { headers: course.headers, events, notes, midxToNoteIdx };
}

function getStatistics(course) {
    // total combo, don-kat ratio, average notes per second
    // renda length, balloon speed
    // potential score, score equations, recommended score variables

    const notes = [0, 0, 0, 0, 0], rendas = [], rendaExtends = [], balloons = [];
    let adlibs = 0, mines = 0;
    let start = 0, end = 0, combo = 0;
	let rendaGroup = 0;
    let scCurEventIdx = 0, scCurEvent = course.events[scCurEventIdx];
    let scGogo = false;
    let scNotes = [[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]];
    let scBalloon = [0, 0], scBalloonPop = [0, 0];
    let scPotential = 0;

    const typeNote = ['don', 'kat', 'donBig', 'katBig', 'kadon'];

    for (let i = 0; i < course.notes.length; i++) {
        const note = course.notes[i];

        if (scCurEvent && scCurEvent.beat <= note.beat) {
            do {
                if (scCurEvent.type === 'gogoStart') scGogo = true;
                else if (scCurEvent.type === 'gogoEnd') scGogo = false;

                scCurEventIdx += 1;
                scCurEvent = course.events[scCurEventIdx];
            } while (scCurEvent && scCurEvent.beat <= note.beat);
        }

        const v1 = typeNote.indexOf(note.type);
        const isBig = note.type.endsWith('Big')
        if (v1 !== -1) {
            if (i === 0) start = note.time;
            end = note.time;

            notes[v1] += 1;
            combo += 1;

            const scRange = (combo < 10 ? 0 : (combo < 30 ? 1 : (combo < 50 ? 2 : (combo < 100 ? 3 : 4))));
            scNotes[Number(isBig)][Number(scGogo)][Number(scRange)] += 1;

            let noteScoreBase = (
                course.headers.scoreInit +
                (course.headers.scoreDiff * (combo < 10 ? 0 : (combo < 30 ? 1 : (combo < 50 ? 2 : (combo < 100 ? 4 : 8)))))
            );

            let noteScore = Math.floor(noteScoreBase / 10) * 10;
            if (scGogo) noteScore = Math.floor(noteScore * 1.2 / 10) * 10;
            if (isBig) noteScore *= 2;

            scPotential += noteScore;

            // console.log(i, combo, noteScoreBase, scGogo, big, noteScore, noteScore, scPotential);

            continue;
        }

        if (note.type === 'renda' || note.type === 'rendaBig') {
            if (note.end !== undefined) {
                const noteEnd = course.notes[course.midxToNoteIdx[note.end.midx] + note.end.didx];
                const rendaLength = noteEnd.time - note.time;
                rendas.push(rendaLength);

				if (rendaExtends.length > 0) {
					if (rendaExtends[rendaExtends.length - 1].isBigRenda != isBig ||
						rendaExtends[rendaExtends.length - 1].isGoGoRenda != scGogo ||
						rendas[rendaExtends.length - 1].toFixed(3) != rendaLength.toFixed(3)) {
						rendaGroup += 1;
					}
				}
				rendaExtends.push({
					isBigRenda: isBig,
					isGoGoRenda: scGogo,
					rendaGroup: rendaGroup
				});
            }
            continue;
        }
        else if (note.type === 'balloon' || note.type === 'balloonEx' || note.type === 'fuse') {
            if (note.end !== undefined) {
                const noteEnd = course.notes[course.midxToNoteIdx[note.end.midx] + note.end.didx];
                const balloonLength = noteEnd.time - note.time;
                const balloonSpeed = note.count / balloonLength;
                balloons.push([balloonLength, note.count, note.type, scGogo]);

                if (balloonSpeed <= 60) {
                    scBalloon[Number(scGogo)] += note.count - 1;
                    scBalloonPop[Number(scGogo)] += 1;
                }
            }
            continue;
        }
        else if (note.type === 'end' || note.type === 'endForced') {
            // do nothing
        }
        else if (note.type === 'adlib') {
            adlibs++;
        }
        else if (note.type === 'mine') {
            mines++;
        }
    }

    return {
        totalCombo: combo,
        notes: notes,
        length: end - start,
        rendas: rendas,
		rendaExtends: rendaExtends,
        balloons: balloons,
        score: {
            score: scPotential,
            notes: scNotes,
            balloon: scBalloon,
            balloonPop: scBalloonPop,
        },
        adlibs: adlibs,
        mines: mines,
    };
}

function getGraph(course) {
    const data = [];
    let datum = { don: 0, kat: 0, kadon: 0 }, max = 0;

    const length = ((course.notes.length !== 0) ? course.notes[course.notes.length - 1].time : 0),
        dataCount = Math.max(1, Math.min(100, Math.ceil(length))),
        timeframe = Math.max(1, length / dataCount);

    const typeNote = ['don', 'kat', 'donBig', 'katBig', 'kadon'];

    for (let i = 0; i < course.notes.length; i++) {
        const note = course.notes[i];

        const v1 = typeNote.indexOf(note.type);
        if (v1 !== -1) {
            while ((data.length + 1) * timeframe <= note.time) {
                const density = (datum.don + datum.kat + datum.kadon) / timeframe;
                if (max < density) max = density;

                data.push(datum);
                datum = { don: 0, kat: 0, kadon: 0 };
            }

            if (note.type === 'don' || note.type === 'donBig') datum.don += 1;
            else if (note.type === 'kat' || note.type === 'katBig') datum.kat += 1;
            else if (note.type === 'kadon') datum.kadon += 1;
        }
    }

    while (data.length < dataCount) {
        data.push(datum);
        datum = { don: 0, kat: 0, kadon: 0 };
    }

    return { timeframe, max, data };
}

export default function (chart, courseId, branchType) {
    const course = chart.courses[courseId];
    const converted = convertToTimed(course, branchType);

    const statistics = getStatistics(converted);
    const graph = getGraph(converted);

    return { statistics, graph };
}

export function calculateScore(stats, course, scoreInit, scoreDiff, gogoFloor, scoreSystem, shinuchi=false) {
	const autoAC16 = [6.0,7.5,10.0,15.0];

	const drop1 = n => Math.floor(n / 10) * 10;
	const multipliers = [0, 1, 2, 4, 8];
	const rollAC15 = 1.0 / 15.0;
	const rollAC16 = 1.0 / autoAC16[Math.min(Math.max(0, course.headers.course), autoAC16.length - 1)];
	const rollScore = [[100,200],[120,240]];

	switch (scoreSystem + shinuchi) {
		case 'AC15' + false:
		case 'AC16' + false: {
			let noteScores = multipliers.map(m => drop1(scoreInit + scoreDiff * m));
			let noteScores2 = multipliers.map(m => (scoreInit + scoreDiff * m));
			let noteScoresBig = multipliers.map(m => drop1(scoreInit + scoreDiff * m) * 2);

			let noteGogoScores;
			let noteGogoScoresBig;
			if (gogoFloor === 'AC15') {
				noteGogoScores = noteScores.map(s => drop1(s * 1.2));
				noteGogoScoresBig = noteScores.map(s => drop1(s * 1.2) * 2);
			}
			else {
				noteGogoScores = noteScores2.map(s => drop1(s * 1.2));
				noteGogoScoresBig = noteScores2.map(s => drop1(s * 1.2) * 2);
			}

			let scoreBasic = (
				noteScores.map((s, i) => stats.score.notes[0][0][i] * s).reduce((p, c) => p + c, 0) +
				noteGogoScores.map((s, i) => stats.score.notes[0][1][i] * s).reduce((p, c) => p + c, 0) +
				noteScoresBig.map((s, i) => stats.score.notes[1][0][i] * s).reduce((p, c) => p + c, 0) +
				noteGogoScoresBig.map((s, i) => stats.score.notes[1][1][i] * s).reduce((p, c) => p + c, 0) +
				stats.score.balloon[0] * 300 +
				stats.score.balloon[1] * 360 +
				stats.score.balloonPop[0] * 5000 +
				stats.score.balloonPop[1] * 6000 +
				Math.floor(stats.totalCombo / 100) * 10000
			);

			let scoreRoll = 0;
			for (let i = 0; i < stats.rendas.length; i++) {
				scoreRoll += Math.ceil(stats.rendas[i] / rollAC15)
				* rollScore[Number(stats.rendaExtends[i].isGoGoRenda)][Number(stats.rendaExtends[i].isBigRenda)];
			}
			return [scoreBasic, scoreRoll]
		}
		case 'AC15' + true: {
			let scoreBasic = ((stats.totalCombo + (stats.notes[2] + stats.notes[3])) * scoreInit) +
				(stats.score.balloon[0] * 300) +
				(stats.score.balloon[1] * 300) +
				(stats.score.balloonPop[0] * 5000) +
				(stats.score.balloonPop[1] * 5000);

			let scoreRoll = 0;
			for (let i = 0; i < stats.rendas.length; i++) {
				scoreRoll += Math.ceil(stats.rendas[i] / rollAC15)
				* rollScore[0][Number(stats.rendaExtends[i].isBigRenda)];
			}
			return [scoreBasic, scoreRoll]
		}
		case 'AC16' + true: {
			let scoreBasic = (stats.totalCombo * scoreInit) +
							(stats.score.balloon[0] * 100) +
							(stats.score.balloon[1] * 100) +
							(stats.score.balloonPop[0] * 100) +
							(stats.score.balloonPop[1] * 100);

			let scoreRoll = 0;
			for (let i = 0; i < stats.rendas.length; i++) {
				scoreRoll += Math.ceil(stats.rendas[i] / rollAC16) * 100;
			}
			return [scoreBasic, scoreRoll]
		}
	}
	return [0, 0]
}

export function predictScore(stats, course, gogoFloor, scoreSystem) {
	const tenjo = [
		[30,32,34,36,38],
		[40,45,50,55,60,65,70],
		[55,60,65,70,75,80,85,90],
		[70,75,80,85,90,95,100,105,110,120],
	]
	let tempDiff = Math.min(Math.max(course.headers.course, 0), tenjo.length - 1)
	let tempLevel = Math.min(Math.max(Math.floor(course.headers.level), 1), tenjo[tempDiff].length);

	//AC15
	const scoreGoal = tenjo[tempDiff][tempLevel - 1] * 10000;
	const diffTemp = 2 * bsearchLeftmost(v => {
		let diffTemp = 2 * v;
		let scoreDiff = Math.ceil(diffTemp / 4);
		let scoreInit = Math.floor(diffTemp / 10) * 10;
		let result = calculateScore(stats, course, scoreInit, scoreDiff, gogoFloor, 'AC15', false)
		let scoreTemp = result[0] + result[1]
		//console.log('通常：'+scoreInit+','+scoreDiff+'=>'+scoreTemp);
		return scoreTemp
	}, Math.ceil(scoreGoal / 2), scoreGoal)
	const scoreDiff = Math.ceil(diffTemp / 4);
	const scoreInit = Math.floor(diffTemp / 10) * 10;

	//Shinuchi
	const scoreShin = 10 * bsearchLeftmost(v => {
		let scoreShin = 10 * v
		let result = calculateScore(stats, course, scoreShin, 0, gogoFloor, 'AC15', true)
		let scoreTemp = result[0] + result[1]
		//console.log('真打：'+scoreShin+'=>'+scoreTemp);
		return scoreTemp;
	}, Math.ceil(1000000 / 10), 1000000)

	//AC16
	const scoreNiji = 10 * bsearchLeftmost(v => {
		let scoreNiji = 10 * v;
		let result = calculateScore(stats, course, scoreNiji, 0, gogoFloor, 'AC16', true)
		let scoreTemp = result[0] + result[1]
		//console.log('虹色：'+scoreNiji+'=>'+scoreTemp);
		return scoreTemp;
	}, Math.ceil(1000000 / 10), 1000000)

	//Shiage
	if (scoreSystem === 'CS')
		return [scoreInit, scoreDiff, scoreShin];
	// if (scoreSystem === 'AC16Old')
	return [scoreInit, scoreDiff, scoreNiji];
}

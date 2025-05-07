function pulseToTime(events, objects) {
    let bpm = 120;
    let passedBeat = 0, passedTime = 0;
    let eidx = 0, oidx = 0;

    let times = [];

    while (oidx < objects.length) {
        let event = events[eidx], objBeat = objects[oidx];

        while (event && event.beat <= objBeat) {
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

        let beat = objBeat - passedBeat;
        let time = 60 / bpm * beat;
        times.push(passedTime + time);

        passedBeat += beat;
        passedTime += time;
        oidx++;
    }

    return times;
}

export function isRollSymbol(sym) {
    switch (sym) {
        case '5':
        case '6':
        case '7':
        case '9':
        case 'D':
        case 'H':
        case 'I':
            return true;

        default:
            return false;
    }
}

export function isBalloonSymbol(sym) {
    switch (sym) {
        case '7':
        case '9':
        case 'D':
            return true;

        default:
            return false;
    }
}

function convertToTimed(course, branchType) {
    const events = [], notes = [];
    let beat = 0, balloon = 0, roll = false;
	
	// Get Branch Data
	let newData = [];
	let newBalloon = [];
	const branchTypes = ['N','E','M'];
	let allBalloon = {'N':{},'E':{},'M':{}};
	for (let bt of branchTypes) {
		let tempCount = 0;
		for (let i = 0; i < course.measures.length; i++) {
			if (course.measures[i].data[bt] === null) {
				continue;
			}
			let tempBalloon = {};
			for (let j = 0; j < course.measures[i].data[bt].length; j++) {
				const ch = course.measures[i].data[bt].charAt(j);
				if (isBalloonSymbol(ch)) {
					tempBalloon[j.toString()] = course.headers.balloon[bt][tempCount++];
				}
			}
			allBalloon[bt][i.toString()] = tempBalloon;
		}
	}
	
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
		
		for (let j = 0; j < selData.length; j++) {
			const ch = selData.charAt(j);
			if (isBalloonSymbol(ch)) {
				newBalloon.push(allBalloon[selected][i.toString()][j.toString()]);
			}
		}
		newData.push(selData);
	}
	
	// Analyze Events
    for (let m = 0; m < course.measures.length; m++) {
        const measure = course.measures[m];
        const length = measure.length[0] / measure.length[1] * 4;

        for (let e = 0; e < measure.events.length; e++) {
            const event = measure.events[e];
            const eBeat = length / (measure.data['N'].length || 1) * event.position;

            if (event.name === 'bpm') {
                events.push({
                    type: 'bpm',
                    value: event.value,
                    beat: beat + eBeat,
                });
            }
            else if (event.name === 'gogoStart') {
                events.push({
                    type: 'gogoStart',
                    beat: beat + eBeat,
                });
            }
            else if (event.name === 'gogoEnd') {
                events.push({
                    type: 'gogoEnd',
                    beat: beat + eBeat,
                });
            }
        }
		
		// Analyze Notes
        for (let d = 0; d < newData[m].length; d++) {
            const ch = newData[m].charAt(d);
            const nBeat = length / newData[m].length * d;

            let note = { type: '', beat: beat + nBeat };

            if (isRollSymbol(ch)) {
                if (roll)
                    continue;
                roll = true;

                if (isBalloonSymbol(ch)) {
                    note.count = newBalloon[balloon++];
                }
            } else if (ch !== '0' && roll) {
                let noteEnd = { type: (ch == '8') ? 'end' : 'endForced', beat: beat + nBeat };
                notes.push(noteEnd);
                roll = false;
            }

            switch (ch) {
                case '1':
                    note.type = 'don';
                    break;

                case '2':
                    note.type = 'kat';
                    break;

                case '3':
                case 'A':
                    note.type = 'donBig';
                    break;

                case '4':
                case 'B':
                    note.type = 'katBig';
                    break;

                case '5':
                    note.type = 'renda';
                    break;

                case '6':
                    note.type = 'rendaBig';
                    break;

                case '7':
                    note.type = 'balloon';
                    break;

                case '9':
                    note.type = 'balloonEx';
                    break;

                 case 'C':
                     note.type = 'mine';
                     break;

                 case 'D':
                     note.type = 'fuse';
                     break;

                 case 'F':
                     note.type = 'adlib';
                     break;

                 case 'G':
                     note.type = 'kadon';
                     break;
            }

            if (note.type) notes.push(note);
        }

        beat += length;
    }

    const times = pulseToTime(events, notes.map(n => n.beat));
    times.forEach((t, idx) => { notes[idx].time = t; });

    return { headers: course.headers, events, notes };
}

function getStatistics(course) {
    // total combo, don-kat ratio, average notes per second
    // renda length, balloon speed
    // potential score, score equations, recommended score variables

    const notes = [0, 0, 0, 0, 0], rendas = [], rendaExtends = [], balloons = [];
    let adlibs = 0, mines = 0;
    let start = 0, end = 0, combo = 0;
    let rendaStart = false, rendaStartTime = 0, balloonStart = false, balloonStartTime = 0, balloonCount = 0, balloonGogo = 0, balloonType = "balloon";
	let isBigRenda = false, isGoGoRenda = false, rendaGroup = 0;
    let scCurEventIdx = 0, scCurEvent = course.events[scCurEventIdx];
    let scGogo = 0;
    let scNotes = [[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]];
    let scBalloon = [0, 0], scBalloonPop = [0, 0];
    let scPotential = 0;

    const typeNote = ['don', 'kat', 'donBig', 'katBig', 'kadon'];

    for (let i = 0; i < course.notes.length; i++) {
        const note = course.notes[i];

        if (scCurEvent && scCurEvent.beat <= note.beat) {
            do {
                if (scCurEvent.type === 'gogoStart') scGogo = 1;
                else if (scCurEvent.type === 'gogoEnd') scGogo = 0;

                scCurEventIdx += 1;
                scCurEvent = course.events[scCurEventIdx];
            } while (scCurEvent && scCurEvent.beat <= note.beat);
        }

        const v1 = typeNote.indexOf(note.type);
        if (v1 !== -1) {
            if (i === 0) start = note.time;
            end = note.time;

            notes[v1] += 1;
            combo += 1;

            const big = v1 === 2 || v1 === 3 || v1 === 4;
            const scRange = (combo < 10 ? 0 : (combo < 30 ? 1 : (combo < 50 ? 2 : (combo < 100 ? 3 : 4))));
            scNotes[big ? 1 : 0][scGogo][scRange] += 1;

            let noteScoreBase = (
                course.headers.scoreInit +
                (course.headers.scoreDiff * (combo < 10 ? 0 : (combo < 30 ? 1 : (combo < 50 ? 2 : (combo < 100 ? 4 : 8)))))
            );

            let noteScore = Math.floor(noteScoreBase / 10) * 10;
            if (scGogo) noteScore = Math.floor(noteScore * 1.2 / 10) * 10;
            if (big) noteScore *= 2;

            scPotential += noteScore;

            // console.log(i, combo, noteScoreBase, scGogo, big, noteScore, noteScore, scPotential);

            continue;
        }

        if (note.type === 'renda' || note.type === 'rendaBig') {
            rendaStartTime = note.time;
			rendaStart = true;
			isBigRenda = note.type === 'rendaBig' ? 1 : 0;
			isGoGoRenda = scGogo;
            continue;
        }
        else if (note.type === 'balloon' || note.type === 'balloonEx' || note.type === 'fuse') {
            balloonStartTime = note.time;
			balloonStart = true;
            balloonCount = note.count;
            balloonGogo = scGogo;
            balloonType = note.type;

            continue;
        }
        else if (note.type === 'end' || note.type === 'endForced') {
            if (rendaStart) {
                rendas.push(note.time - rendaStartTime);
				
				if (rendaExtends.length > 0) {
					if (rendaExtends[rendaExtends.length - 1].isBigRenda != isBigRenda ||
						rendaExtends[rendaExtends.length - 1].isGoGoRenda != isGoGoRenda ||
						rendas[rendaExtends.length - 1].toFixed(3) != (note.time - rendaStartTime).toFixed(3)) {
						rendaGroup += 1;
					}
				}
				rendaExtends.push({
					isBigRenda: isBigRenda,
					isGoGoRenda: isGoGoRenda,
					rendaGroup: rendaGroup
				});
                rendaStart = false;
            }
            else if (balloonStart) {
                const balloonLength = note.time - balloonStartTime;
                const balloonSpeed = balloonCount / balloonLength;
                balloons.push([balloonLength, balloonCount, balloonType, balloonGogo]);
                balloonStart = false;

                if (balloonSpeed <= 60) {
                    scBalloon[balloonGogo] += balloonCount - 1;
                    scBalloonPop[balloonGogo] += 1;
                }
            }
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

    const dataCount = 100,
        length = course.notes[course.notes.length - 1].time,
        timeframe = length / dataCount;

    const typeNote = ['don', 'kat', 'donBig', 'katBig', 'kadon'];

    for (let i = 0; i < course.notes.length; i++) {
        const note = course.notes[i];

        const v1 = typeNote.indexOf(note.type);
        if (v1 !== -1) {
            while ((data.length + 1) * timeframe <= note.time) {
                const sum = datum.don + datum.kat + datum.kadon;
                if (max < sum) max = sum;

                data.push(datum);
                datum = { don: 0, kat: 0, kadon: 0 };
            }

            if (note.type === 'don' || note.type === 'donBig') datum.don += 1;
            else if (note.type === 'kat' || note.type === 'katBig') datum.kat += 1;
            else if (note.type === 'kadon') datum.kadon += 1;
        }
    }

    while (data.length < dataCount)
        data.push({ don: 0, kat: 0, kadon: 0 });

    return { timeframe, max, data };
}

export default function (chart, courseId, branchType) {
    const course = chart.courses[courseId];
    const converted = convertToTimed(course, branchType);

    const statistics = getStatistics(converted);
    const graph = getGraph(converted);

    return { statistics, graph };
}

export function predictScore(stats, course, gogoFloor, scoreSystem) {
	let diffTemp = 0;
	let scoreInit = 0;
	let scoreDiff = 0;
	let scoreShin = 0;
	let scoreNiji = 0;
	let scoreGoal = 0;
	let scoreTemp = 0;
	const tenjo = [
		[30,32,34,36,38],
		[40,45,50,55,60,65,70],
		[55,60,65,70,75,80,85,90],
		[70,75,80,85,90,95,100,105,110,120],
		[70,75,80,85,90,95,100,105,110,120]
	]
	const levelMax = [5,7,8,10,10];
	const autoAC16 = [6.0,7.5,10.0,15.0,15.0];
	let tempLevel = course.headers.level;
	if (tempLevel > levelMax[course.headers.course]){
		tempLevel = levelMax[course.headers.course];
	}
	const drop1 = n => Math.floor(n / 10) * 10;
	const multipliers = [0, 1, 2, 4, 8];
	let noteScores;
	let noteScores2;
	let noteScoresBig;
	let noteGogoScores;
	let noteGogoScoresBig;
	const rollAC15 = 1.0 / 15.0;
	const rollAC16 = 1.0 / autoAC16[course.headers.course];
	const rollScore = [[100,200],[120,240]];
	
	//AC15
	scoreGoal = tenjo[course.headers.course][tempLevel - 1] * 10000;
	while (scoreTemp < scoreGoal){
		diffTemp++;
		scoreDiff = Math.ceil(diffTemp / 4);
		if (diffTemp % 10 == 0)
			scoreInit += 10;
		
		noteScores = multipliers.map(m => drop1(scoreInit + scoreDiff * m));
		noteScores2 = multipliers.map(m => (scoreInit + scoreDiff * m));
		noteScoresBig = multipliers.map(m => drop1(scoreInit + scoreDiff * m) * 2);
		
		if (gogoFloor === 'AC15') {
			noteGogoScores = noteScores.map(s => drop1(s * 1.2));
			noteGogoScoresBig = noteScores.map(s => drop1(s * 1.2) * 2);
		}
		else {
			noteGogoScores = noteScores2.map(s => drop1(s * 1.2));
			noteGogoScoresBig = noteScores2.map(s => drop1(s * 1.2) * 2);
		}
		
		scoreTemp = (
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
		
		for (let i = 0; i < stats.rendas.length; i++) {
			scoreTemp += Math.ceil(stats.rendas[i] / rollAC15)
			* rollScore[stats.rendaExtends[i].isGoGoRenda][stats.rendaExtends[i].isBigRenda];
		}
		//console.log('通常：'+scoreInit+','+scoreDiff+'=>'+scoreTemp);
	}
	
	//Shinuchi
	scoreTemp = 0;
	while (scoreTemp < 1000000){
		scoreShin += 10;
		
		scoreTemp = ((stats.totalCombo + (stats.notes[2] + stats.notes[3])) * scoreShin) +
						 (stats.score.balloon[0] * 300) +
						 (stats.score.balloon[1] * 300) +
						 (stats.score.balloonPop[0] * 5000) +
						 (stats.score.balloonPop[1] * 5000);
		
		for (let i = 0; i < stats.rendas.length; i++) {
			scoreTemp += Math.ceil(stats.rendas[i] / rollAC15)
			* rollScore[0][stats.rendaExtends[i].isBigRenda];
		}
		//console.log('真打：'+scoreShin+'=>'+scoreTemp);
	}
	
	//AC16
	scoreTemp = 0;
	while (scoreTemp < 1000000){
		scoreNiji += 10;
		
		scoreTemp = (stats.totalCombo * scoreNiji) +
						(stats.score.balloon[0] * 100) +
						(stats.score.balloon[1] * 100) +
						(stats.score.balloonPop[0] * 100) +
						(stats.score.balloonPop[1] * 100);
		
		for (let i = 0; i < stats.rendas.length; i++) {
			scoreTemp += Math.ceil(stats.rendas[i] / rollAC16) * 100;
		}
		//console.log('虹色：'+scoreNiji+'=>'+scoreTemp);
	}
	
	//Shiage
	if (scoreSystem === 'CS'){
		return [scoreInit, scoreDiff, scoreShin];
	}
	else if (scoreSystem === 'AC16Old'){
		return [scoreInit, scoreDiff, scoreNiji];
	}
	else {
		return [scoreNiji, 0, 1000];
	}
}
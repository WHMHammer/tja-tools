import {
    Buffer
} from 'buffer';

import $ from 'umbrellajs';
import * as d3 from 'd3';

import downloadjs from 'downloadjs';
import html2canvas from 'html2canvas';

import chardet from 'chardet';
import iconv from 'iconv-lite';

import parseTJA, { difficultyTypeToString } from './parseTJA';
import {
    getCourseLines,
    getEnabledBranch
} from './parseTJA';
import drawChart from './drawChart';
import {
    initUsedSprite
} from './drawChart';
import analyseChart from './analyseChart';
import {
    predictScore
} from './analyseChart';
import {
    embedText,
    optimizePNG
} from './embedChart';
import {
    convertToDonscore
} from './donscore';

import {
    loadAllFonts
} from './font/font';

import '../css/style.scss';
import '../css/font/Pixel-3x5.css';

//==============================================================================

const $charsetUtf8 = $('#charset-utf-8').first();
const $charsetShiftjis = $('#charset-shift-jis').first();
const $charsetGb18030 = $('#charset-gb18030').first();
const $editorLive = $('#editor-live').first();
const $autoScrollToBottom = $('#auto-scroll-to-bottom').first();
const $embedDonscore = $('#embed-donscore').first();
const $editorProcess = $('.editor-process');
const $input = $('.area-editor .input');
const $errors = $('.area-errors .errors');
const $rendaHead = $('.renda-head');

let selectedLocale = 'en';
let tjaParsed = null;
let selectedDifficulty = '';
let selectedBranch = 'N';
let selectedPage = 'preview';
let selectedScoreSystem = 'CS';
let selectedGogoFloor = 'AC15';
let selectedCalcMode = 'fromFile';

const downloadNewUniqueId = async () => {
    if (!tjaParsed === null) {
        alert("Please select a chart");
        return;
    }

    const s1 = tjaParsed.headers.title;
    const s2 = tjaParsed.headers.subtitle;
    const randId = (s1+s2).replace(/[^a-zA-Z0-9]/g, '').split('').map(c => Math.random() < 0.5 ? c.toLowerCase() : c.toUpperCase()).join('');
    const uniqueId = {
        "id": randId,
        "url": "",
    };

    downloadjs(JSON.stringify(uniqueId), `uniqueId.json`, 'application/json');

};

const downloadStatisticsAsImage = async () => {
    if (!tjaParsed === null || selectedDifficulty === "") {
        alert("Please select a chart and difficulty");
        return;
    }

    const statsEl = document.querySelector('.area-pages');
    if (!statsEl) return;

    const copiedstatsEl = statsEl.cloneNode(true);
    copiedstatsEl.style.position = 'fixed';
    copiedstatsEl.style.right = '100%';
    copiedstatsEl.style.width = '100%';
    copiedstatsEl.style.height = 'auto';

    document.body.append(copiedstatsEl);

    const canvas = await html2canvas(copiedstatsEl);

    copiedstatsEl.remove();

    const dataURL = canvas.toDataURL('image/png');
    downloadjs(dataURL, `${tjaParsed.headers.title}.statistics.png`, 'image/png');
};

const downloadPreviewImage = async () => {
    if (!tjaParsed === null || selectedDifficulty === "") {
        alert("Please select a chart and difficulty");
        return;
    }

    const img = document.querySelector('#tja-preview');
    if (!img) return;

    const dataURL = img.src;
    downloadjs(dataURL, `${tjaParsed.headers.title}.preview.png`, 'image/png');
};


function displayErrors(message) {
    $errors.text(message);
}

function clearControlsDiffs() {
    $(`.controls-diff .button`).remove();
}

function addControlsDiff(difficultyId, headers) {
    let diffName = difficultyTypeToString(headers.course);
    if (headers.style > 1) {
        diffName += `-${headers.style}P (P${headers.startPlayer})`;
    }
    let element = `<span class="button btn-diff-${difficultyId} l10n" data-value='${difficultyId}'>${diffName}</span>`;

    $(`.controls-diff`).append(element);
    $(`.controls-diff`).append(' ');
}

function listenControlsDiffs() {
    $('.controls-diff .button').on('click', evt => {
        const diff = $(evt.currentTarget).data('value');

        selectedDifficulty = diff;

        const enabledBranch = getEnabledBranch(tjaParsed, selectedDifficulty);
        selectedBranch = enabledBranch[enabledBranch.length - 1];

        updateUI();
    });
}

function updateUI() {
    $('.controls-diff .button.is-active').removeClass('is-active');
    $(`.controls-diff .btn-diff-${selectedDifficulty}`).addClass('is-active');

    $('.controls-page .button.is-active').removeClass('is-active');
    $(`.controls-page .btn-page-${selectedPage}`).addClass('is-active');

    $('.area-pages .page').addClass('is-hidden');
    $(`.area-pages .page-${selectedPage}`).removeClass('is-hidden');

    if (selectedPage === 'preview' && selectedDifficulty !== '') showPreview();
    else hidePreview();

    if (selectedPage === 'statistics') showStatistics();

    $('.controls-branch .button.is-active').removeClass('is-active');
    $(`.controls-branch .btn-branch-${selectedBranch.toLowerCase()}`).addClass('is-active');
}

function processTJA() {
    try {
        tjaParsed = parseTJA($input.first().value);
        tjaParsed.courses.sort(function (a, b) {
            return (a.headers.course !== b.headers.course) ?
                a.headers.course - b.headers.course
                : (a.headers.style !== b.headers.style) ?
                a.headers.style - b.headers.style
                : a.headers.startPlayer - b.headers.startPlayer;
        });

        clearControlsDiffs();
        tjaParsed.courses.forEach(function (course, iDiff) {
            addControlsDiff(iDiff, course.headers);
        });
        listenControlsDiffs();

        displayErrors('No error');
    } catch (e) {
        console.error(e);
        displayErrors(e.message);
    }
}

function showPreview() {
    if (selectedDifficulty === '') return;

    $('#tja-preview').remove();

    try {
        const $canvas = drawChart(tjaParsed, selectedDifficulty);
        const $img = document.createElement('img');
        $img.id = 'tja-preview';
        const chartImg = optimizePNG($canvas);

        if ($embedDonscore.checked) {
            $img.src = embedText(chartImg, convertToDonscore(tjaParsed, selectedDifficulty));
        } else {
            $img.src = embedText(chartImg, getCourseLines($input.first().value, selectedDifficulty));
        }

        $('.page-preview').append($img);

        displayErrors('No error');
    } catch (e) {
        console.error(e);
        displayErrors(e.message);
    }
}

function hidePreview() {
    $('#tja-preview').remove();
}

function showStatistics() {
    if (selectedDifficulty === '') return;

    const enabledBranch = getEnabledBranch(tjaParsed, selectedDifficulty);

    $('.controls-branch .button').addClass('is-hidden');
    for (let branch of enabledBranch) {
        $(`.controls-branch .btn-branch-${branch.toLowerCase()}`).removeClass('is-hidden');
    }

    try {
        const data = analyseChart(tjaParsed, selectedDifficulty, selectedBranch);
        buildStatisticsPage(data);
    } catch (e) {
        console.error(e);
        displayErrors(e.message);
    }
}

export function toFixedZero(num) {
    let newNum = num;
    while (true) {
        if (newNum.charAt(newNum.length - 1) === '0') {
            newNum = newNum.slice(0, -1);
        } else if (newNum.charAt(newNum.length - 1) === '.') {
            newNum = newNum.slice(0, -1);
            break;
        } else {
            break;
        }
    }

    return newNum;
}

function buildStatisticsPage(data) {
    const {
        statistics: stats,
        graph
    } = data;

    // Statistics
    $('.stat-total-combo').text(stats.totalCombo);

    const course = tjaParsed.courses[selectedDifficulty];
    let {
        scoreInit,
        scoreDiff,
        scoreShin
    } = course.headers;
    if (selectedCalcMode === 'predict') {
        const predicted = predictScore(stats, course, selectedGogoFloor, selectedScoreSystem);
        scoreInit = predicted[0];
        scoreDiff = predicted[1];
        scoreShin = predicted[2];
    }

    $('.stat-level').text('★×' + course.headers.level);

    const drop1 = n => Math.floor(n / 10) * 10;
    const multipliers = [0, 1, 2, 4, 8];
    const noteScores = multipliers.map(m => drop1(scoreInit + scoreDiff * m));
    const noteScores2 = multipliers.map(m => (scoreInit + scoreDiff * m));
    const noteScoresShin = multipliers.map(m => scoreShin);
    const noteScoresBig = multipliers.map(m => drop1(scoreInit + scoreDiff * m) * 2);

    let noteGogoScores;
    let noteGogoScoresBig;
    if (selectedGogoFloor === 'AC15') {
        noteGogoScores = noteScores.map(s => drop1(s * 1.2));
        noteGogoScoresBig = noteScores.map(s => drop1(s * 1.2) * 2);
    } else {
        noteGogoScores = noteScores2.map(s => drop1(s * 1.2));
        noteGogoScoresBig = noteScores2.map(s => drop1(s * 1.2) * 2);
    }

    let statPotential;
    let statPotential2;
    if (selectedScoreSystem != 'AC16New') {
        statPotential = (
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
        if (scoreShin != null) {
            if (selectedScoreSystem === 'CS') {
                statPotential2 = ((stats.totalCombo + (stats.notes[2] + stats.notes[3])) * scoreShin) +
                    (stats.score.balloon[0] * 300) +
                    (stats.score.balloon[1] * 300) +
                    (stats.score.balloonPop[0] * 5000) +
                    (stats.score.balloonPop[1] * 5000);
            } else if (selectedScoreSystem === 'AC16Old') {
                statPotential2 = (stats.totalCombo * scoreShin) +
                    (stats.score.balloon[0] * 100) +
                    (stats.score.balloon[1] * 100) +
                    (stats.score.balloonPop[0] * 100) +
                    (stats.score.balloonPop[1] * 100);
            }
        }
    } else {
        statPotential = (stats.totalCombo * scoreInit) +
            (stats.score.balloon[0] * 100) +
            (stats.score.balloon[1] * 100) +
            (stats.score.balloonPop[0] * 100) +
            (stats.score.balloonPop[1] * 100);
    }

    const strPts = '<span lang="en"> Points</span><span lang="ja">点</span>';
    const strRolls = '<span lang="en">Drumrolls</span><span lang="ja">連打</span>';
    if (selectedScoreSystem != 'AC16New') {
        if (stats.rendas.length) $('.stat-max-score').html(`${scoreInit}${strPts}, ${scoreDiff}${strPts} => ${statPotential}${strPts} + ${strRolls}`);
        else $('.stat-max-score').html(`${scoreInit}${strPts}, ${scoreDiff}${strPts} => ${statPotential}${strPts}`);
        if (scoreShin != null) {
            if (stats.rendas.length) $('.stat-max-score2').html(`${scoreShin}${strPts} => ${statPotential2}${strPts} + ${strRolls}`);
            else $('.stat-max-score2').html(`${scoreShin}${strPts} => ${statPotential2}${strPts}`);
        } else {
            $('.stat-max-score2').text('');
        }
    } else {
        if (stats.rendas.length) $('.stat-max-score').html(`${scoreInit}${strPts} => ${statPotential}${strPts} + ${strRolls}`);
        else $('.stat-max-score').html(`${scoreInit}${strPts} => ${statPotential}${strPts}`);
        $('.stat-max-score2').text('');
    }

    let bpmMin = 0,
        bpmMax = 0,
        firstBpm = true;
    for (let i = 0; i < course.measures.length; i++) {
        for (let j = 0; j < course.measures[i].events.length; j++) {
            if (course.measures[i].events[j].name === 'bpm') {
                let curBpm = parseFloat(course.measures[i].events[j].value);

                if (firstBpm) {
                    bpmMin = curBpm;
                    bpmMax = curBpm;
                    firstBpm = false;
                } else {
                    if (bpmMin > curBpm) {
                        bpmMin = curBpm;
                    }
                    if (bpmMax < curBpm) {
                        bpmMax = curBpm;
                    }
                }
            }
        }
    }
    if (bpmMin.toFixed(2) != bpmMax.toFixed(2)) $('.stat-bpm').text(toFixedZero(bpmMin.toFixed(2)) + '-' + toFixedZero(bpmMax.toFixed(2)));
    else $('.stat-bpm').text(toFixedZero(bpmMax.toFixed(2)));

    $('.stat-don-small').text(stats.notes[0]);
    $('.stat-don-big').text(stats.notes[2]);
    $('.stat-kat-small').text(stats.notes[1]);
    $('.stat-kat-big').text(stats.notes[3]);

    const statDon = stats.notes[0] + stats.notes[2];
    const statKat = stats.notes[1] + stats.notes[3];
    const statKaDon = stats.notes[4];
    $('.stat-don').text(statDon);
    $('.stat-kat').text(statKat);
    $('.stat-kadon').text(stats.notes[4]);
    $('.stat-adlib').text(stats.adlibs);
    $('.stat-mine').text(stats.mines);

    const statDonRatio = (statDon / stats.totalCombo) * 100;
    const statKatRatio = (statKat / stats.totalCombo) * 100;
    const statKaDonRatio = (statKaDon / stats.totalCombo) * 100;
    $('.stat-don-ratio').text(statDonRatio.toFixed(2) + '%');
    $('.stat-kat-ratio').text(statKatRatio.toFixed(2) + '%');
    $('.stat-kadon-ratio').text(statKaDonRatio.toFixed(2) + '%');

    const strMin = '<span lang="en">m</span><span lang="ja">分</span>';
    const strSec = '<span lang="en">s</span><span lang="ja">秒</span>';
    $('.stat-density').text(((stats.totalCombo - 1) / stats.length).toFixed(2));
    $('.stat-length').text(stats.length.toFixed(2));
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}${strMin}${(seconds % 60).toFixed(2).padStart(5, '0')}${strSec}`;
    $('.stat-formatted-length').html(formatTime(stats.length));

    const markInGogo = (x => `<span class="is-in-gogo">${x}</span>`);
    const markBig = (x => `<span class="is-size-big">${x}</span>`);
    const markEx = (x => `<span class="is-size-ex">${x}</span>`);
    const markNone = (x => x);

    $('.stat-renda').html(stats.rendas
         .map((r, i) => (stats.rendaExtends[i].isGoGoRenda ? markInGogo : markNone)(
             (stats.rendaExtends[i].isBigRenda ? markBig : markNone)(
                 r.toFixed(3) + strSec)))
         .join(' + '));
    $('.stat-renda-total').html(stats.rendas.reduce((a, b) => a + b, 0).toFixed(3) + strSec);

    const strHits = '<span lang="en">hit(s)</span><span lang="ja">打</span>';
    const strHps = '<span lang="en">hit/s</span><span lang="ja">打/秒</span>';
    $('.stat-balloon').html(stats.balloons.map(b => (
        (b[3] ? markInGogo : markNone)(
            ((b[2] === 'balloonEx') ? markEx : markNone)(
                 `${b[1]}${strHits} / ${b[0].toFixed(3)}${strSec} = ${(b[1] / b[0]).toFixed(3)} ${strHps}${(b[2] === 'fuse') ? " [💣]" : ""}`))
    )).join('<br>'));

    // Graph
    const graphWidth = 600,
        graphHeight = 200;
    const x = d3.scaleBand().rangeRound([0, graphWidth]);
    const y = d3.scaleLinear().rangeRound([graphHeight, 0]);
    const yMax = Math.ceil(graph.max / 5) * 5;
    const yTickValues = [...Array(yMax / 5 + 1).keys()].map(i => i * 5);

    $('.stat-graph').empty();
    const graphSvg = d3
        .select('.stat-graph')
        .attr('width', graphWidth + 50).attr('height', graphHeight + 40)
        .append('g')
        .attr('transform', 'translate(30, 20)');

    const layers = d3.stack().keys(['kadon', 'don', 'kat'])(graph.data);

    x.domain(layers[0].map((d, idx) => idx));
    y.domain([0, Math.ceil(graph.max / 5) * 5]);

    const makeAxisY = () => d3.axisLeft(y).ticks(5).tickValues(yTickValues);

    graphSvg.append('g')
        .attr('class', 'grid')
        .call(makeAxisY().tickSize(-graphWidth).tickFormat(''));

    const layer = graphSvg
        .selectAll('.layer')
        .data(layers)
        .enter().append('g')
        .attr('class', 'layer')
        .style('fill', (d, i) => ['#f0f', '#f00', '#00f'][i]);

    layer
        .selectAll('rect')
        .data(d => d)
        .enter().append('rect')
        .attr('x', (d, idx) => x(idx))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth);

    graphSvg.append('g')
        .attr('class', 'axis-y')
        .call(makeAxisY());
}

function copyRendaText(rendas, rendaExtends) {
    let result = '',
        groupCount = 0,
        groupFirst = true;
    const groupMax = rendaExtends.reduce((a, b) => Math.max(a, b.rendaGroup), -1);

    for (let i = 0; i < rendas.length; i++) {
        if (rendaExtends[i].rendaGroup != groupCount) {
            groupCount += 1;
            groupFirst = true;
        }

        if (groupFirst) {
            if (rendaExtends[i].isBigRenda) {
                result += 'SIZE(16){';
            }

            if (rendaExtends[i].isGoGoRenda) {
                result += '\'\'';
            }

            result += '約' + rendas[i].toFixed(3) + '秒'

            if (rendaExtends[i].isGoGoRenda) {
                result += '\'\'';
            }

            if (rendaExtends[i].isBigRenda) {
                result += '}';
            }

            let groupNum = rendaExtends.reduce((a, b) => (b.rendaGroup === groupCount ? a + 1 : a), 0);
            if (groupNum > 1) {
                result += '×' + groupNum;
            }

            if (rendaExtends[i].rendaGroup != groupMax) {
                result += '－';
            }

            groupFirst = false;
        }
    }

    if (rendas.length > 1) {
        result += '： 合計約' + rendas.reduce((a, b) => a + b, 0).toFixed(3) + '秒';
    }

    if (result != '') {
        navigator.clipboard.writeText(result);
    }
}

//==============================================================================

$editorProcess.on('click', () => {
    processTJA();
    showPreview();
});

$rendaHead.on('click', () => {
    if (selectedDifficulty === '') return;

    const data = analyseChart(tjaParsed, selectedDifficulty, selectedBranch);
    const {
        statistics: stats,
        graph
    } = data;
    copyRendaText(stats.rendas, stats.rendaExtends);
});

$input.on('input', () => {
    if ($editorLive.checked) {
        processTJA();
        updateUI();

        if ($autoScrollToBottom.checked) {
            setTimeout(() => {
                let area_pages = document.getElementById('area-pages');
                area_pages.scrollTo(0, area_pages.scrollHeight);
            }, 100);
        }
    }
});

$input.on('dragover', e => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'cppy';
});

$input.on('drop', dropEvt => {
    dropEvt.stopPropagation();
    dropEvt.preventDefault();

    const file = dropEvt.dataTransfer.files[0];

    const reader = new FileReader();

    reader.onload = readerEvt => {
        const arrayBuffer = readerEvt.target.result;
        const uintArray = new Uint8Array(arrayBuffer);
        const buffer = Buffer.from(uintArray);

        let encoding;
        if ($charsetUtf8.checked) {
            encoding = 'UTF-8';
        } else if ($charsetShiftjis.checked) {
            encoding = 'Shift-JIS';
        } else if ($charsetGb18030.checked) {
            encoding = 'GB18030';
        } else {
            encoding = chardet.detect(buffer);
        }
        const content = iconv.decode(buffer, encoding);

        $input.first().value = content;
        selectedDifficulty = '';

        processTJA();
        updateUI();
    };

    reader.readAsArrayBuffer(file);
});

$('.controls-branch .button').on('click', evt => {
    const branch = $(evt.currentTarget).data('value');

    selectedBranch = branch;
    updateUI();
});

$('.controls-page .button').on('click', evt => {
    const page = $(evt.currentTarget).data('value');

    selectedPage = page;
    updateUI();
});

$('.controls-score-system .radio').on('click', evt => {
    const name = evt.currentTarget.name;
    const value = evt.currentTarget.value;

    if (name === 'scoreSystem') {
        selectedScoreSystem = value;
    } else if (name === 'gogoFloor') {
        selectedGogoFloor = value;
    } else if (name === 'calcMode') {
        selectedCalcMode = value;
    }

    updateUI();
});

$('.btn-download').on('click', evt => {
    if (selectedPage === 'preview') {
        downloadPreviewImage();
    }
    else {
        downloadStatisticsAsImage();
    }
});

$('.download-donscore .button').on('click', async evt => {
    if (selectedDifficulty === '') return;

    const fh = await window.showSaveFilePicker({
        types: [{
            description: 'Text File',
            accept: {
                'text/plain': ['.txt'],
            },
        }, ],
    });

    const writable = await fh.createWritable();
    const writeText = convertToDonscore(tjaParsed, selectedDifficulty);

    const sjisText = iconv.encode(writeText, 'shift_jis');
    await writable.write(sjisText);
    await writable.close();

});

window.onload = async function() {
    await initUsedSprite();
    await loadAllFonts();
}

$('.btn-unique').on('click', evt => {
    downloadNewUniqueId();
});

$('.controls-locale input[name=locale]').on('click', evt => {
    selectedLocale = $(evt.currentTarget).data('value');
    document.documentElement.setAttribute('lang', selectedLocale);
    updateUI();
});

//==============================================================================

if ($input.first().value) {
    processTJA();
}

updateUI();
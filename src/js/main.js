import {
    Buffer
} from 'buffer';

import $ from 'umbrellajs';
import * as d3 from 'd3';
import JSZip from 'jszip';

import downloadjs from 'downloadjs';
import html2canvas from 'html2canvas';

import chardet from 'chardet';
import iconv from 'iconv-lite';

import parseTJA from './parseTJA';
import { i18n, t, setLanguage, difficultyTypeToString } from './i18n';
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
    calculateScore,
    predictScore,
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

const $tjaFile = $("#tja-file").first();
const $charsetUtf8 = $('#charset-utf-8').first();
const $charsetShiftjis = $('#charset-shift-jis').first();
const $charsetGb18030 = $('#charset-gb18030').first();
const $editorLive = $('#editor-live').first();
const $autoScrollToBottom = $('#auto-scroll-to-bottom').first();
const $embedDonscore = $('#embed-donscore').first();
const $zipFileSelector = $('#zip-file-selector');
const $zipTjaSelect = $('#zip-tja-select');
const $loadZipTja = $('#load-zip-tja');
const $cancelZip = $('#cancel-zip');
const $editorProcess = $('.editor-process');
const $input = $('.area-editor .input');
const $errors = $('.area-errors .errors');
const $rendaHead = $('.renda-head');
const $previewImg = document.createElement('img');
let $previewCanvas = null;

let selectedLocale = 'en';
let tjaParsed = null;
let selectedDifficulty = '';
let selectedBranch = 'N';
let selectedPage = 'preview';
let selectedScoreSystem = 'CS';
let selectedGogoFloor = 'AC15';
let selectedCalcMode = 'fromFile';

const downloadNewUniqueId = async () => {
    if (tjaParsed === null) {
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

    downloadjs(JSON.stringify(uniqueId), `uniqueID.json`, 'application/json');

};

const downloadStatisticsAsImage = async () => {
    if (tjaParsed === null || selectedDifficulty === "") {
        alert("Please select a chart and difficulty");
        return;
    }
    if (tjaParsed.courses[selectedDifficulty] === undefined) {
        alert("Please select an existent difficulty");
        return;
    }

    const statsEl = document.querySelector('.area-pages');
    if (!statsEl) return;

    const copiedstatsEl = statsEl.cloneNode(true);
    copiedstatsEl.style.position = 'fixed';
    copiedstatsEl.style.right = '100%';
    copiedstatsEl.style.width = '650px';
    copiedstatsEl.style.height = 'auto';

    document.body.append(copiedstatsEl);

    const canvas = await html2canvas(copiedstatsEl, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
    });

    copiedstatsEl.remove();

    const dataURL = canvas.toDataURL('image/png');
    downloadjs(dataURL, `${tjaParsed.headers.title}.statistics.png`, 'image/png');
};

function embedChartNotation() {
    const chartImg = $previewImg.dataset.chartImg;
    if ($previewImg.dataset.embedMode === 'Donscore') {
        $previewImg.src = embedText(chartImg, convertToDonscore(tjaParsed, selectedDifficulty));
    } else {
        $previewImg.src = embedText(chartImg, getCourseLines($input.first().value, tjaParsed, selectedDifficulty));
    }
}

const downloadPreviewImage = async () => {
    if (tjaParsed === null || selectedDifficulty === "") {
        alert("Please select a chart and difficulty");
        return;
    }
    if (tjaParsed.courses[selectedDifficulty] === undefined) {
        alert("Please select an existent difficulty");
        return;
    }

    const dataURL = $previewImg.src;
    if (dataURL === '')
        return;
    if (($previewImg.dataset.embedMode === 'Donscore') !== $embedDonscore.checked) {
        $previewImg.dataset.embedMode = ($embedDonscore.checked ? 'Donscore' : 'TJA');
        displayErrors(`Re-embedding ${$previewImg.dataset.embedMode} notation...`);
        await new Promise(resolve => setTimeout(resolve, 0)); // update ui

        embedChartNotation();
    }
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
    let element = `<span class="button btn-diff-${difficultyId}" data-value='${difficultyId}'>${diffName}</span>`;

    $(`.controls-diff`).append(element);
    $(`.controls-diff`).append(' ');
}

function listenControlsDiffs() {
    $('.controls-diff .button').on('click', evt => {
        const diff = $(evt.currentTarget).data('value');

        selectedDifficulty = diff;

        const enabledBranch = getEnabledBranch(tjaParsed, selectedDifficulty);
        selectedBranch = enabledBranch[enabledBranch.length - 1] || 'N';

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

function loadFile(type, blob) {
    if (type === 'zip' || type === 'application/zip' || type === 'application/x-zip-compressed')
        loadZip(blob);
    else
        loadTJA(blob);
}

function loadTJA(file) {
    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = readerEvt => {
        loadTJAFromBuffer(readerEvt.target.result);
    };

    reader.readAsArrayBuffer(file);
}

function loadTJAFromBuffer(arrayBuffer) {
    const uintArray = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uintArray);

    let encoding;
    $('.charset-auto-detected').text('');
    if ($charsetUtf8.checked) {
        encoding = 'UTF-8';
    } else if ($charsetShiftjis.checked) {
        encoding = 'Shift-JIS';
    } else if ($charsetGb18030.checked) {
        encoding = 'GB18030';
    } else {
        encoding = chardet.detect(buffer);
        $('.charset-auto-detected').text(`: ${encoding}`);
    }
    const content = iconv.decode(buffer, encoding);

    $input.first().value = content;
    selectedDifficulty = '';

    processTJA();
    updateUI();
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

async function showPreview() {
    if (tjaParsed === null || tjaParsed.courses[selectedDifficulty] === undefined)
        return;

    $('#tja-preview').remove();
    $previewImg.src = '';

    try {
        const $canvas = $previewCanvas = drawChart(tjaParsed, selectedDifficulty);
        $canvas.id = 'tja-preview';
        $('.page-preview').append($canvas);

        $previewImg.dataset.embedMode = ($embedDonscore.checked ? 'Donscore' : 'TJA');
        displayErrors(`Embedding ${$previewImg.dataset.embedMode} notation...`);
        await new Promise(resolve => setTimeout(resolve, 0)); // update ui

        $previewImg.dataset.chartImg = optimizePNG($canvas);
        embedChartNotation();
    } catch (e) {
        console.error(e);
        displayErrors(e.message);
    }
}

function hidePreview() {
    $('#tja-preview').remove();
    $previewImg.src = '';
    $previewCanvas = null;
}

$previewImg.addEventListener('load', () => {
    $('#tja-preview').remove();

    $previewImg.id = 'tja-preview';
    $('.page-preview').append($previewImg);

    displayErrors('No error');
});

$previewImg.addEventListener('error', () => {
    if (!$previewImg.src || $previewImg.src === location.href)
        return;

    if ($previewCanvas !== null) {
        $('#tja-preview').remove();
        $previewCanvas.id = 'tja-preview';
        $('.page-preview').append($previewCanvas);
    }

    displayErrors(`Cannot show the image with ${$previewImg.dataset.embedMode} notation embedded. You can download it instead.`);
});

function showStatistics() {
    if (tjaParsed === null || tjaParsed.courses[selectedDifficulty] === undefined)
        return;

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
        $('.stat-scoreinit').text(scoreInit + ',' + scoreShin);
        $('.stat-scorediff').text(scoreDiff);
    } else {
        $('.stat-scoreinit').text('');
        $('.stat-scorediff').text('');
    }
    let scoreShinOrInit = scoreShin
    if (scoreShin === undefined || scoreShin === null)
        scoreShinOrInit = scoreInit

    $('.stat-level').text('★×' + course.headers.level);

    let statPotential;
    let statPotential2;
    statPotential = calculateScore(stats, course, scoreInit, scoreDiff, selectedGogoFloor, 'AC15', false)[0];
    if (selectedScoreSystem === 'CS') {
        statPotential2 = calculateScore(stats, course, scoreShinOrInit, 0, selectedGogoFloor, 'AC15', true)[0];
    } else if (selectedScoreSystem === 'AC16Old') {
        statPotential2 = calculateScore(stats, course, scoreShinOrInit, 0, selectedGogoFloor, 'AC16', true)[0];
    }

    const strPts = t('unit.points');
    const strRolls = t('stats.drumrolls');
    const strPlusRolls = (stats.rendas.length) ? ` + ${strRolls}` : '';
    $('.stat-max-score').html(`${scoreInit}${strPts}, ${scoreDiff}${strPts} => ${statPotential}${strPts}${strPlusRolls}`);
    $('.stat-max-score2').html(`${scoreShinOrInit}${strPts} => ${statPotential2}${strPts}${strPlusRolls}`);

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

    const strMin = t('unit.min');
    const strSec = t('unit.sec');
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

    const strHits = t('unit.hits');
    const strHps = t('unit.hps');
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
    const yMax = Math.max(1, Math.ceil(graph.max / 5)) * 5;
    const yTickValues = [...Array(yMax / 5 + 1).keys()].map(i => i * 5);

    $('.stat-graph').empty();
    const graphSvg = d3
        .select('.stat-graph')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr('viewBox', `0 0 ${graphWidth + 50} ${graphHeight + 40}`)
        .append('g')
        .attr('transform', 'translate(30, 20)');
    const graphContainer = $('.stat-graph-container').first();
    graphContainer.style.maxWidth = `${graphWidth + 50}px`;
    graphContainer.style.maxHeight = `${graphHeight + 40}px`;

    const layers = d3.stack().keys(['kadon', 'don', 'kat'])(graph.data);

    x.domain(layers[0].map((d, idx) => idx));
    y.domain([0, Math.max(1, Math.ceil(graph.max / 5)) * 5]);

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
        .attr('y', d => y(d[1] / graph.timeframe))
        .attr('height', d => y(d[0] / graph.timeframe) - y(d[1] / graph.timeframe))
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

const download_button = document.getElementById("download_button");
download_button.addEventListener('click', async () => {
    const txt = document.getElementById("textarea").value;
    const title = ((tjaParsed === null) ? null : tjaParsed.headers.title) || 'untitled';
    downloadjs(txt, `${title}.tja`, 'text/plain;charset=UTF-8');
});

const copy_button = document.getElementById("copy_button");
copy_button.addEventListener('click', async () => {
    try {
        // テキストをクリップボードに書き込む
        await navigator.clipboard.writeText(document.getElementById("textarea").value);
    } catch (err) {
        // コピーに失敗した場合
        console.error('Failed to copy text: ', err);
        alert(t('editor.copy.error'));
    }
});

$editorProcess.on('click', () => {
    processTJA();
    showPreview();
});

const editorLiveOnChange = () => {
    $editorProcess.each(e => e.disabled = $editorLive.checked);
};
editorLiveOnChange();
$editorLive.addEventListener('change', editorLiveOnChange);

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
    e.dataTransfer.dropEffect = 'copy';
});

$tjaFile.addEventListener('change', () => {
    loadFile($tjaFile.files[0].type, $tjaFile.files[0]);
});

$input.on('drop', dropEvt => {
    dropEvt.stopPropagation();
    dropEvt.preventDefault();
    const file = dropEvt.dataTransfer.files[0];
    loadFile(file.type, file);
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
    setLanguage(selectedLocale);
    updateUI();
});

// Listen for postMessage events from other websites
window.addEventListener('message', async (event) => {
    // Validate origin for security (optional - adjust as needed)
    // if (event.origin !== 'https://trusted-domain.com') {
    //     return;
    // }

    // caller: win.postMessage({ type: 'zip', blob: content }, '*');
    if (event.data && typeof event.data.type === 'string' && event.data.blob instanceof Blob)
        loadFile(event.data.type, event.data.blob);
});

async function loadZip(blob) {
    try {
        const result = await loadZipFromBlob(blob);

        if (result.tjaFiles.length === 0) {
            throw new Error('No TJA files found in the ZIP archive.');
        } else if (result.tjaFiles.length === 1) {
            // If only one TJA file, load it directly
            await loadTjaFileFromZip(result.zip, result.tjaFiles[0]);
        } else {
            // Show selection UI for multiple files
            showZipFileSelector(result.zip, result.tjaFiles);
        }
    } catch (error) {
        console.error('Error handling postMessage ZIP data:', error);
        alert('Error processing received ZIP data: ' + error.message);
    }
}

async function loadZipFromBlob(blob) {
    try {
        const zip = await JSZip.loadAsync(blob);
        const tjaFiles = [];

        zip.forEach((relPath, file) => {
            if (!file.dir && relPath.toLowerCase().endsWith(".tja"))
                tjaFiles.push(relPath);
        });

        return {zip: zip, tjaFiles: tjaFiles};
    } catch (e) {
        throw new Error('Failed to unzip: ' + e.message);
    }
}

function showZipFileSelector(zip, tjaFiles) {
    // Clear previous options
    $zipTjaSelect.first().innerHTML = '<option value="">-- Select a TJA file --</option>';

    // Add options for each TJA file
    tjaFiles.forEach((tjaFile, index) => {
        const option = document.createElement('option');
        option.value = tjaFile;
        option.textContent = tjaFile;
        $zipTjaSelect.first().appendChild(option);
    });

    // Show the selector
    $zipFileSelector.first().style.display = 'block';

    // ZIP file selector event handlers
    $loadZipTja.off('click');
    $loadZipTja.on('click', async evt => {
        const selectedFile = $zipTjaSelect.first().value;
        if (selectedFile === '') {
            alert('Please select a TJA file.');
            return;
        }

        await loadTjaFileFromZip(zip, selectedFile);
    });
}

function hideZipFileSelector() {
    $zipFileSelector.first().style.display = 'none';
}

// Load selected TJA file from ZIP
async function loadTjaFileFromZip(zip, filePath) {
    try {
        if (!zip) {
            throw new Error('No ZIP file loaded');
        }

        const file = zip.file(filePath);
        if (!file) {
            throw new Error(`File ${filePath} not found in ZIP`);
        }

        const arrayBuffer = await file.async('arraybuffer');
        loadTJAFromBuffer(arrayBuffer);

        // Hide selector if it was shown
        hideZipFileSelector();
    } catch (error) {
        console.error('Error loading TJA file from ZIP:', error);
        alert('Error loading TJA file: ' + error.message);
    }
}

$cancelZip.on('click', evt => {
    hideZipFileSelector();
});

//==============================================================================

// 初始化i18n
i18n.setLanguage('en');

// 监听语言变化事件，更新动态生成的内容
window.addEventListener('languageChanged', () => {
    updateUI();
});

if ($input.first().value) {
    processTJA();
}

updateUI();

import { Buffer } from 'buffer';

import $ from 'umbrellajs';
import * as d3 from 'd3';

import downloadjs from 'downloadjs';
import html2canvas from 'html2canvas';

import chardet from 'chardet';
import iconv from 'iconv-lite';

import parseTJA, { difficultyTypeToString } from './parseTJA';
import drawChart from './drawChart';
import analyseChart from './analyseChart';

import '../css/style.scss';
import '../css/Pixel-3x5.css';

//==============================================================================

const $charsetUtf8 = $('#charset-utf-8').first();
const $charsetShiftjis = $('#charset-shift-jis').first();
const $charsetGb18030 = $('#charset-gb18030').first();
const $editorLive = $('#editor-live').first();
const $autoScrollToBottom = $('#auto-scroll-to-bottom').first();
const $editorProcess = $('.editor-process');
const $input = $('.area-editor .input');
const $errors = $('.area-errors .errors');

let tjaParsed = null;
let selectedDifficulty = '';
let selectedPage = 'preview';

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

    const canvas = document.querySelector('#tja-preview');
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    downloadjs(dataURL, `${tjaParsed.headers.title}.preview.png`, 'image/png');
};


function displayErrors(message) {
    $errors.text(message);
}

function clearControlsDiffs() {
    $(`.controls-diff .button`).remove();
}

function addControlsDiff(difficultyId, difficultyType) {
    let element = `<span class="button btn-diff-${difficultyId}" data-value='${difficultyId}'>${difficultyTypeToString(difficultyType)}</span>`;

    $(`.controls-diff`).append(element);
    $(`.controls-diff`).append(' ');
}

function listenControlsDiffs() {
    $('.controls-diff .button').on('click', evt => {
        const diff = $(evt.target).data('value');

        selectedDifficulty = parseInt(diff, 10);
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
}

function processTJA() {
    try {
        tjaParsed = parseTJA($input.first().value);
        tjaParsed.courses.sort(function (a, b) {
            return a.headers.course - b.headers.course;
        });

        clearControlsDiffs();
        tjaParsed.courses.forEach(function (course, iDiff) {
            addControlsDiff(iDiff, course.headers.course);
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

    document.fonts.load('5px "Pixel 3x5"').then(() => {
        try {
            const $canvas = drawChart(tjaParsed, selectedDifficulty);
            $canvas.id = 'tja-preview';
            $('.page-preview').append($canvas);

            displayErrors('No error');
        } catch (e) {
            console.error(e);
            displayErrors(e.message);
        }
    });
}

function hidePreview() {
    $('#tja-preview').remove();
}

function showStatistics() {
    if (selectedDifficulty === '') return;

    try {
        const data = analyseChart(tjaParsed, selectedDifficulty);
        buildStatisticsPage(data);
    } catch (e) {
        console.error(e);
        displayErrors(e.message);
    }
}

function buildStatisticsPage(data) {
    const { statistics: stats, graph } = data;

    // Statistics
    $('.stat-total-combo').text(stats.totalCombo);

    const course = tjaParsed.courses[selectedDifficulty];
    const { scoreInit, scoreDiff } = course.headers;

    const drop1 = n => Math.floor(n / 10) * 10;
    const multipliers = [0, 1, 2, 4, 8];
    const noteScores = multipliers.map(m => drop1(scoreInit + scoreDiff * m));
    const noteGogoScores = noteScores.map(s => drop1(s * 1.2));
    const statPotential = (
        noteScores.map((s, i) => stats.score.notes[0][i] * s).reduce((p, c) => p + c, 0) +
        noteGogoScores.map((s, i) => stats.score.notes[1][i] * s).reduce((p, c) => p + c, 0) +
        stats.score.balloon[0] * 300 +
        stats.score.balloon[1] * 360 +
        stats.score.balloonPop[0] * 5000 +
        stats.score.balloonPop[1] * 6000 +
        Math.floor(stats.totalCombo / 100) * 10000
    );

    if (stats.rendas.length) $('.stat-max-score').text(`${statPotential}`);
    else $('.stat-max-score').text(`${statPotential} Points`);

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

    $('.stat-density').text((stats.totalCombo / stats.length).toFixed(3));
    $('.stat-length').text(stats.length.toFixed(2));
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}m${(seconds % 60).toFixed(2).padStart(5, '0')}s`;
    $('.stat-formatted-length').text(formatTime(stats.length));

    $('.stat-renda').html(stats.rendas
        .map(r => ((r[1] === 'rendaBig') ? (x => `<span class="is-size-big">${x}</span>`) : (x => x))(
            r[0].toFixed(3) + 's'))
        .join(' + '));
    $('.stat-renda-total').text(
        stats.rendas.map(r => r[0]).reduce((a, b) => a + b, 0)
            .toFixed(3)
        + 's');

    $('.stat-balloon').html(stats.balloons.map(b => (
        ((b[2] === 'balloonEx') ? (x => `<span class="is-size-ex">${x}</span>`) : (x => x))(
            `${b[1]}hit(s) / ${b[0].toFixed(3)}s = ${(b[1] / b[0]).toFixed(3)} hit/s${(b[2] === 'fuse') ? " [💣]" : ""}`)
    )).join('<br>'));

    // Graph
    const graphWidth = 600, graphHeight = 200;
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

//==============================================================================

$editorProcess.on('click', () => {
    processTJA();
    showPreview();
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

$('.controls-page .button').on('click', evt => {
    const page = $(evt.target).data('value');

    selectedPage = page;
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

$('.btn-unique').on('click', evt => {
    downloadNewUniqueId();
});

//==============================================================================

if ($input.first().value) {
    processTJA();
}

updateUI();

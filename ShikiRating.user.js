// ==UserScript==
// @name         Shiki Rating
// @namespace    http://shikimori.org/
// @version      2.8.3
// @description  Rating from shiki users
// @author       ImoutoChan
// @match        http://shikimori.org/*
// @match        https://shikimori.org/*
// @match        http://shikimori.one/*
// @match        https://shikimori.one/*
// @match        http://shikimori.me/*
// @match        https://shikimori.me/*
// @downloadURL  https://github.com/ImoutoChan/shiki-rating-userscript/raw/master/ShikiRating.user.js
// @updateURL    https://github.com/ImoutoChan/shiki-rating-userscript/raw/master/ShikiRating.user.js
// @license      MIT
// @grant        none
// ==/UserScript==

const debug = false;

const log = (message) => {
    if (debug) {
        console.log(`ShikiRating: ${message}`);
    }
};

const getLocale = () => document.body.getAttribute('data-locale');

const needAddRating = (urlpart) => ["/animes", "/mangas", "/ranobe"].includes(urlpart);

const removeLastClass = (domElement) => {
    const classes = domElement.classList;
    if (classes.length > 0) {
        classes.remove(classes[classes.length - 1]);
    }
};

const setNoData = (domElement) => {
    domElement.innerHTML = '';
    const noData = document.createElement('p');
    noData.className = 'b-nothing_here';
    noData.innerText = getLocale() === 'ru' ? 'Недостаточно данных' : 'Insufficient data';
    Object.assign(noData.style, {
        textAlign: 'center',
        color: '#7b8084',
        marginTop: '15px',
    });
    domElement.appendChild(noData);
};

const appendShikiRating = () => {
    'use strict';

    const urlpart = window.location.pathname.substring(0, 7);
    log(urlpart);

    if (!needAddRating(urlpart)) {
        log('wrong page');
        return;
    }

    if (document.querySelector("#shiki-score")) {
        log('already created');
        return;
    }

    const malRate = document.querySelector(".scores > .b-rate");
    if (!malRate) {
        log("can't find default rating");
        return;
    }

    malRate.id = 'mal-score';

    const newShikiRate = malRate.cloneNode(true);
    newShikiRate.id = 'shiki-score';

    const rateContainer = document.querySelector(".scores");
    rateContainer.appendChild(newShikiRate);

    const scoreDataJson = document.querySelector("#rates_scores_stats")?.getAttribute("data-stats");
    if (!scoreDataJson) {
        log('no score data found');
        setNoData(newShikiRate);
        return;
    }

    let scoreData;
    try {
        scoreData = JSON.parse(scoreDataJson);
    } catch (e) {
        log('error parsing score data');
        setNoData(newShikiRate);
        return;
    }

    if (!scoreData || scoreData.length === 0) {
        setNoData(newShikiRate);
        return;
    }

    const { sumScore, totalCount } = scoreData.reduce((acc, [score, count]) => {
        acc.sumScore += score * count;
        acc.totalCount += count;
        return acc;
    }, { sumScore: 0, totalCount: 0 });

    const shikiScore = sumScore / totalCount;
    const shikiScoreDigit = Math.round(shikiScore);
    log(shikiScore);

    const scoreElement = newShikiRate.querySelector("div.text-score > div.score-value");
    scoreElement.innerHTML = shikiScore.toFixed(2);
    removeLastClass(scoreElement);
    scoreElement.classList.add(`score-${shikiScoreDigit}`);

    const starElement = newShikiRate.querySelector("div.stars-container > div.stars.score");
    removeLastClass(starElement);
    starElement.style.color = '#456';
    starElement.classList.add(`score-${shikiScoreDigit}`);

    const labelData = getLocale() === 'ru' ?
        { "0": "", "1": "Хуже некуда", "2": "Ужасно", "3": "Очень плохо", "4": "Плохо", "5": "Более-менее", "6": "Нормально", "7": "Хорошо", "8": "Отлично", "9": "Великолепно", "10": "Эпик вин!" } :
        { "0": "", "1": "Worst Ever", "2": "Terrible", "3": "Very Bad", "4": "Bad", "5": "So-so", "6": "Fine", "7": "Good", "8": "Excellent", "9": "Great", "10": "Masterpiece!" };

    newShikiRate.querySelector("div.text-score > div.score-notice").textContent = labelData[shikiScoreDigit];

    const malLabel = getLocale() === 'ru' ? 'На основе оценок mal' : 'From MAL users';
    malRate.insertAdjacentHTML('afterend', `<p class="score-source">${malLabel}</p>`);

    const shikiCountLabel = `<strong>${totalCount}</strong>`;
    const shikiLabel = getLocale() === 'ru' ?
        `На основе ${shikiCountLabel} оценок shiki` :
        `From ${shikiCountLabel} shiki users`;
    newShikiRate.insertAdjacentHTML('afterend', `<p class="score-counter">${shikiLabel}</p>`);

    const malScoreLabelElement = document.querySelector('.score-source');
    Object.assign(malScoreLabelElement.style, {
        marginBottom: '15px',
        textAlign: 'center',
        color: '#7b8084',
    });

    const shikiScoreLabelElement = document.querySelector('.score-counter');
    Object.assign(shikiScoreLabelElement.style, {
        textAlign: 'center',
        color: '#7b8084',
    });
};

const ready = (fn) => {
    document.addEventListener('page:load', fn);
    document.addEventListener('turbolinks:load', fn);

    if (document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
};

ready(appendShikiRating);

// ==UserScript==
// @name         Shikimori Rating
// @namespace    http://shikimori.org/
// @version      3.1.1
// @description  Ratings from Shikimori users
// @author       ImoutoChan
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @downloadURL  https://github.com/idMysteries/Shikimori-Rating/raw/master/ShikiRating.user.js
// @updateURL    https://github.com/idMysteries/Shikimori-Rating/raw/master/ShikiRating.user.js
// @license      MIT
// @grant        none
// ==/UserScript==

const DEBUG_MODE = false;
const log = (msg) => DEBUG_MODE && console.log(`ShikiRating: ${msg}`);
const isRussian = document.body.getAttribute('data-locale') === 'ru';
const isValidPage = () => ["/animes", "/mangas", "/ranobe"].some(path => window.location.pathname.startsWith(path));

const createNoDataMessage = () => {
    const msg = document.createElement('p');
    msg.className = 'b-nothing_here';
    msg.innerText = isRussian ? 'Недостаточно данных' : 'Insufficient data';
    Object.assign(msg.style, { textAlign: 'center', color: '#7b8084', marginTop: '15px' });
    return msg;
};

const calculateScore = (data) => data.reduce((acc, [score, count]) => {
    acc.totalScore += score * count;
    acc.totalVotes += count;
    return acc;
}, { totalScore: 0, totalVotes: 0 });

const updateScoreElement = (el, score, rounded) => {
    const valueEl = el.querySelector("div.text-score > div.score-value");
    valueEl.textContent = score.toFixed(2);
    valueEl.className = `score-value score-${rounded}`;

    const starsEl = el.querySelector("div.stars-container > div.stars.score");
    starsEl.className = `stars score score-${Math.round(score)}`;
    starsEl.style.color = '#456';
};


const addShikiRating = () => {
    if (!isValidPage() || document.querySelector("#shiki-score")) return log('Invalid page or rating exists');

    const malRating = document.querySelector(".scores > .b-rate");
    if (!malRating) return log("Default rating not found");

    const scoresContainer = document.querySelector(".scores");
    const shikiRating = malRating.cloneNode(true);
    shikiRating.id = 'shiki-score';
    scoresContainer.appendChild(shikiRating);

    const scoreDataJson = document.querySelector("#rates_scores_stats")?.getAttribute("data-stats");
    if (!scoreDataJson) return shikiRating.replaceChildren(createNoDataMessage());

    let scoreData;
    try {
        scoreData = JSON.parse(scoreDataJson);
    } catch {
        return shikiRating.replaceChildren(createNoDataMessage());
    }

    if (!scoreData.length) return shikiRating.replaceChildren(createNoDataMessage());

    const { totalScore, totalVotes } = calculateScore(scoreData);
    const score = totalScore / totalVotes, rounded = Math.floor(score);
    log(`Score: ${score}`);

    updateScoreElement(shikiRating, score, rounded);

    const labels = isRussian
        ? { "1": "Хуже некуда", "2": "Ужасно", "3": "Очень плохо", "4": "Плохо", "5": "Более-менее", "6": "Нормально", "7": "Хорошо", "8": "Отлично", "9": "Великолепно", "10": "Эпик вин!" }
        : { "1": "Worst Ever", "2": "Terrible", "3": "Very Bad", "4": "Bad", "5": "So-so", "6": "Fine", "7": "Good", "8": "Excellent", "9": "Great", "10": "Masterpiece!" };
    shikiRating.querySelector("div.text-score > div.score-notice").textContent = labels[rounded] || '';

    const votesWord = totalVotes % 10 === 1 && totalVotes % 100 !== 11 ? 'оценки' : 'оценок';
    const shikiSource = isRussian
        ? `На основе <strong>${totalVotes}</strong> ${votesWord} Shikimori`
        : `From <strong>${totalVotes}</strong> Shikimori users`;
    shikiRating.insertAdjacentHTML('afterend', `<p class="score-counter" style="text-align:center;color:#7b8084">${shikiSource}</p>`);

    const malSource = isRussian ? 'На основе оценок MAL' : 'From MAL users';
    malRating.insertAdjacentHTML('afterend', `<p class="score-source" style="text-align:center;color:#7b8084;margin-bottom:15px">${malSource}</p>`);
};

const onDocumentReady = (callback) => {
    document.addEventListener('page:load', callback);
    document.addEventListener('turbolinks:load', callback);

    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

onDocumentReady(addShikiRating);

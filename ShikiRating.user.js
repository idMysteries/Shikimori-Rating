// ==UserScript==
// @name         Shikimori Rating
// @namespace    https://shikimori.one/
// @version      3.1.7
// @description  Ratings from Shikimori users
// @author       ImoutoChan
// @author       idMysteries
// @match        *://shikimori.one/*
// @match        *://shiki.one/*
// @downloadURL  https://github.com/idMysteries/Shikimori-Rating/raw/master/ShikiRating.user.js
// @updateURL    https://github.com/idMysteries/Shikimori-Rating/raw/master/ShikiRating.user.js
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const DEBUG = false, log = m => DEBUG && console.log(`ShikiRating: ${m}`);
  const isRu = document.body.getAttribute('data-locale') === 'ru';
  const validPage = () => ["/animes", "/mangas", "/ranobe"].some(p => location.pathname.startsWith(p));

  const updateEl = (el, score, r) => {
    const v = el.querySelector("div.text-score > div.score-value");
    v.textContent = Math.trunc(score * 100) / 100;
    v.className = `score-value score-${r}`;
    const stars = el.querySelector("div.stars-container > div.stars.score");
    stars.className = `stars score score-${Math.round(score)}`;
    stars.style.color = '#456';
  };

  const addRating = () => {
    if (!validPage() || document.querySelector("#shiki-score")) return log('Invalid page or rating exists');
    const mal = document.querySelector(".scores > .b-rate");
    if (!mal) return log("Default rating not found");

    const scoresCont = document.querySelector(".scores");
    const shiki = mal.cloneNode(true);
    shiki.id = 'shiki-score';
    scoresCont.appendChild(shiki);

    const json = document.querySelector("#rates_scores_stats")?.getAttribute("data-stats");
    if (!json) return log("Score data json not found");

    let data;
    try { data = JSON.parse(json); }
    catch { return log("Can't parse json"); }
    if (!data.length) return log("Err: score data length");

    let totalScore = 0, totalVotes = 0;
    for (const [s, cnt] of data) {
      totalScore += s * cnt;
      totalVotes += cnt;
    }
    const score = totalScore / totalVotes, r = Math.floor(score);
    log(`Score: ${score}`);
    updateEl(shiki, score, r);

    const labels = isRu
      ? { "1": "Хуже некуда", "2": "Ужасно", "3": "Очень плохо", "4": "Плохо", "5": "Более-менее", "6": "Нормально", "7": "Хорошо", "8": "Отлично", "9": "Великолепно", "10": "Эпик вин!" }
      : { "1": "Worst Ever", "2": "Terrible", "3": "Very Bad", "4": "Bad", "5": "So-so", "6": "Fine", "7": "Good", "8": "Excellent", "9": "Great", "10": "Masterpiece!" };
    shiki.querySelector("div.text-score > div.score-notice").textContent = labels[r] || '';

    const votesWord = totalVotes % 10 === 1 && totalVotes % 100 !== 11 ? 'оценки' : 'оценок';
    const shikiSrc = isRu
      ? `На основе <strong>${totalVotes}</strong> ${votesWord} Shikimori`
      : `From <strong>${totalVotes}</strong> Shikimori users`;
    shiki.insertAdjacentHTML('afterend', `<p class="score-counter" style="text-align:center;color:#7b8084">${shikiSrc}</p>`);

    const malSrc = isRu ? 'На основе оценок MAL' : 'From MAL users';
    mal.insertAdjacentHTML('afterend', `<p class="score-source" style="text-align:center;color:#7b8084;margin-bottom:15px">${malSrc}</p>`);
  };

  const onDocumentReady = cb => {
    document.addEventListener('page:load', cb);
    document.addEventListener('turbolinks:load', cb);
    document.readyState !== "loading" ? cb() : document.addEventListener('DOMContentLoaded', cb);
  };

  onDocumentReady(addRating);
})();

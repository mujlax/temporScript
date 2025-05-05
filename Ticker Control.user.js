// ==UserScript==
// @name         Ticker Control
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Меняй framerate по хоткею
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

     window.addEventListener('load', () => {
        console.log('[Tampermonkey] Скрипт активен Новая версия');

        document.addEventListener('keydown', function (e) {
            if (!e.shiftKey) return;

            // Получаем текущий framerate, если возможно
            let currentFramerate = (typeof createjs !== 'undefined' && createjs.Ticker)
                ? createjs.Ticker.framerate
                : null;

            // Проверка: createjs загружен
            if (currentFramerate === null) {
                console.warn('[Tampermonkey] createjs не найден');
                return;
            }

            if (e.key === '<' || (e.code === 'Comma' && e.shiftKey)) {
                createjs.Ticker.framerate = Math.max(1, currentFramerate - 5);
                console.log(`[Framerate ↓] Установлен: ${createjs.Ticker.framerate}`);
                e.preventDefault();
            }

            if (e.key === '>' || (e.code === 'Period' && e.shiftKey)) {
                createjs.Ticker.framerate = currentFramerate + 5;
                console.log(`[Framerate ↑] Установлен: ${createjs.Ticker.framerate}`);
                e.preventDefault();
            }
        });
    });
})();

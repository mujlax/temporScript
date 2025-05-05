// ==UserScript==
// @name         Banners_Control
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Чмоха
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

     window.addEventListener('load', () => {
        console.log('[Tampermonkey] Скрипт активен');

        document.addEventListener('keydown', function (e) {
            if (!e.shiftKey) return;

            // Работа с createjs.Ticker.framerate
            let framerate = (typeof createjs !== 'undefined' && createjs.Ticker)
                ? createjs.Ticker.framerate
                : null;

            // Shift + < (Shift + ,)
            if ((e.key === '<' || e.code === 'Comma') && framerate !== null) {
                createjs.Ticker.framerate = Math.max(1, framerate - 5);
                console.log(`[Framerate ↓] Установлен: ${createjs.Ticker.framerate}`);
                e.preventDefault();
            }

            // Shift + > (Shift + .)
            if ((e.key === '>' || e.code === 'Period') && framerate !== null) {
                createjs.Ticker.framerate = framerate + 5;
                console.log(`[Framerate ↑] Установлен: ${createjs.Ticker.framerate}`);
                e.preventDefault();
            }

            // Shift + / (обычно выводит "?")
            if (e.code === 'Slash') {
                if (typeof window.exportRoot !== 'undefined') {
                    window.exportRoot.paused = !window.exportRoot.paused;
                    console.log(`[Paused toggle] exportRoot.paused = ${window.exportRoot.paused}`);
                } else {
                    console.warn('[Tampermonkey] exportRoot не найден');
                }
                e.preventDefault();
            }
        });
    });
})();

// ==UserScript==
// @name         Animate Control Panel Collapsible
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  Коллапсируемая панель с иконками управления framerate и паузой на Animate-страницах; отображение текущего framerate внутри контейнера кнопок с эффектом hover и появлением фона в hover-зоне
// @match        *://*/*
// @include      file:///*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        // Проверка Animate-страницы
        const isAnimateCC = !!document.querySelector('meta[name="authoring-tool"][content*="Adobe_Animate_CC"]');
        if (!isAnimateCC) return;
        console.log('[Animate Panel] Adobe Animate страница обнаружена');

        // Подключаем Material Icons
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Настройки фона
        const bgExpanded = 'rgba(0, 0, 0, 0.6)';
        const bgCollapsed = 'transparent';

        // Создаём панель
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: bgCollapsed,
            borderRadius: '6px',
            padding: '6px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'width 0.2s, height 0.2s, background 0.2s',
            overflow: 'hidden',
            width: '32px',
            height: '32px'
        });
        panel.classList.add('collapsed');

        // Контейнер кнопок + счетчика
        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '8px',
            alignItems: 'center'
        });

        // Элемент отображения framerate внутри контейнера
        const frDisplay = document.createElement('div');
        Object.assign(frDisplay.style, {
            fontSize: '12px',
            color: '#fff',
            textAlign: 'center',
            width: '100%'
        });
        function updateFrDisplay() {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                frDisplay.textContent = `FPS: ${Math.round(createjs.Ticker.framerate)}`;
            } else {
                frDisplay.textContent = '';
            }
        }
        updateFrDisplay();
        btnContainer.appendChild(frDisplay);

        // Функция создания кнопки с иконкой и hover-эффектом
        function addIconButton(iconName, title, onClick) {
            const btn = document.createElement('button');
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = iconName;
            btn.appendChild(icon);
            btn.title = title;
            Object.assign(btn.style, {
                width: '32px',
                height: '32px',
                padding: '0',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background 0.2s'
            });
            // hover
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(0,0,0,0.5)'; });
            btn.addEventListener('click', () => { onClick(); updateFrDisplay(); });
            btnContainer.appendChild(btn);
        }

        // Добавляем кнопки
        addIconButton('remove', 'Framerate -5', () => {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                createjs.Ticker.framerate = Math.max(1, createjs.Ticker.framerate - 5);
                console.log(`[Framerate ↓] ${createjs.Ticker.framerate}`);
            }
        });
        addIconButton('add', 'Framerate +5', () => {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                createjs.Ticker.framerate += 5;
                console.log(`[Framerate ↑] ${createjs.Ticker.framerate}`);
            }
        });
        addIconButton('pause_circle_filled', 'Toggle Pause', () => {
            if (typeof window.exportRoot !== 'undefined') {
                window.exportRoot.paused = !window.exportRoot.paused;
                console.log(`[Paused toggle] ${window.exportRoot.paused}`);
            }
        });

        // Кнопка раскрытия/скрытия панели
        const toggle = document.createElement('div');
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'material-icons';
        toggleIcon.textContent = 'menu';
        toggle.appendChild(toggleIcon);
        toggle.title = 'Показать меню';
        Object.assign(toggle.style, {
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            opacity: '0',
            transition: 'opacity 0.2s',
            cursor: 'pointer',
            background: 'transparent',
            color: '#fff'
        });

        // hover зона: показываем иконку и фон панели
        document.addEventListener('mousemove', (e) => {
            const threshold = 50;
            if (e.clientX <= threshold && e.clientY <= threshold && panel.classList.contains('collapsed')) {
                toggle.style.opacity = '1';
                panel.style.background = bgExpanded;
            } else if (panel.classList.contains('collapsed')) {
                toggle.style.opacity = '0';
                panel.style.background = bgCollapsed;
            }
        });

        toggle.addEventListener('click', () => {
            if (panel.classList.contains('collapsed')) {
                panel.classList.remove('collapsed');
                panel.style.width = 'auto';
                panel.style.height = 'auto';
                panel.style.background = bgExpanded;
                toggle.title = 'Скрыть меню';
                btnContainer.style.display = 'flex';
                updateFrDisplay();
                toggle.style.opacity = '1';
            } else {
                panel.classList.add('collapsed');
                panel.style.width = '32px';
                panel.style.height = '32px';
                panel.style.background = bgCollapsed;
                toggle.title = 'Показать меню';
                btnContainer.style.display = 'none';
                toggle.style.opacity = '0';
            }
        });

        // Изначально скрываем кнопки и добавляем элементы
        btnContainer.style.display = 'none';
        panel.appendChild(toggle);
        panel.appendChild(btnContainer);
        document.body.appendChild(panel);
    });
})();

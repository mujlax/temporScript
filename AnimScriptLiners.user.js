// ==UserScript==
// @name         Anim Depart Panels
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Zaebisya
// @match        *://*/*
// @include      file:///*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        // Проверка Animate-страницы
        const isAnimateCC = !!document.querySelector('div#animation_container');
        if (!isAnimateCC) return;
        console.log('[Animate Panel] Adobe Animate страница обнаружена');

        // Подключаем Material Icons
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // --- Глобальный стиль для скрытия стрелочек у input[type=number] ---
        const style = document.createElement('style');
        style.textContent = `
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type=number] {
            -moz-appearance: textfield;
            appearance: textfield;
        }
        `;
        document.head.appendChild(style);

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
            gap: '12px',
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

        // Контейнер для слайдера
        const sliderContainer = document.createElement('div');
        Object.assign(sliderContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            margin: '8px 0',
        });

        // Переменная для хранения изначального FPS
        let initialFPS = 24; // значение по умолчанию

        // Функция получения текущего FPS
        function getCurrentFPS() {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                return createjs.Ticker.framerate;
            }
            return 24;
        }

        // Функция инициализации начального FPS
        function initializeInitialFPS() {
            if (typeof window.exportRoot !== 'undefined' && typeof createjs !== 'undefined' && createjs.Ticker) {
                initialFPS = createjs.Ticker.framerate;
                slider.value = initialFPS.toString();
                console.log(`[FPS] Initial value detected: ${initialFPS}`);
            }
        }

        // Слайдер
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '100';
        slider.step = '1';
        slider.value = getCurrentFPS().toString();
        Object.assign(slider.style, {
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '24px',
            height: '70px',
            margin: '0',
            padding: '0',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            outline: 'none',
            cursor: 'pointer',
        });

        // Функция сброса FPS к изначальному значению
        function resetFPS() {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                createjs.Ticker.framerate = initialFPS;
                slider.value = initialFPS.toString();
                updateFrDisplay();
                console.log(`[FPS Reset] to initial value: ${initialFPS}`);
            }
        }

        // Событие изменения FPS
        slider.addEventListener('input', () => {
            if (typeof createjs !== 'undefined' && createjs.Ticker) {
                createjs.Ticker.framerate = parseInt(slider.value, 10);
                updateFrDisplay();
            }
        });

        // Добавляем обработчик двойного клика для сброса FPS
        slider.addEventListener('dblclick', resetFPS);

        // Добавляем подсказку о возможности сброса
        slider.title = 'Двойной клик для сброса к изначальному FPS';

        sliderContainer.appendChild(slider);
        btnContainer.appendChild(sliderContainer);

        // Инициализируем начальный FPS после небольшой задержки,
        // чтобы убедиться, что анимация полностью загружена
        setTimeout(initializeInitialFPS, 100);

        // Также попробуем получить FPS при первом тике
        if (typeof createjs !== 'undefined' && createjs.Ticker) {
            const tickListener = () => {
                initializeInitialFPS();
                createjs.Ticker.removeEventListener('tick', tickListener);
            };
            createjs.Ticker.addEventListener('tick', tickListener);
        }

        // --- Слайдер для перемотки по кадрам ---
        const frameSliderContainer = document.createElement('div');
        Object.assign(frameSliderContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            margin: '8px 0 16px 0',
            width: '32px'
        });
        // Подпись текущего кадра
        const frameLabel = document.createElement('div');
        Object.assign(frameLabel.style, {
            fontSize: '12px',
            color: '#fff',
            marginBottom: '2px',
            textAlign: 'center',
            width: '100%'
        });
        frameLabel.textContent = '';
        frameSliderContainer.appendChild(frameLabel);
        // Слайдер кадров
        const frameSlider = document.createElement('input');
        frameSlider.type = 'range';
        frameSlider.min = '0';
        frameSlider.max = '0'; // обновим позже
        frameSlider.step = '1';
        frameSlider.value = '0';
        Object.assign(frameSlider.style, {
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '24px',
            height: '80px',
            margin: '0',
            padding: '0',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            outline: 'none',
            cursor: 'pointer',
        });
        // Поле для ввода номера кадра
        const frameInput = document.createElement('input');
        frameInput.type = 'number';
        frameInput.min = '1';
        frameInput.value = '1';
        frameInput.style.width = '32px';
        frameInput.style.marginTop = '4px';
        frameInput.style.fontSize = '12px';
        frameInput.style.textAlign = 'center';
        frameInput.style.borderRadius = '4px';
        frameInput.style.border = '1px solid #888';
        frameInput.style.background = 'rgba(0,0,0,0.2)';
        frameInput.style.color = '#fff';
        frameInput.style.outline = 'none';
        // Скрыть стрелочки у input[type=number]
        frameInput.style.MozAppearance = 'textfield';
        frameInput.style.appearance = 'textfield';
        frameInput.style.WebkitAppearance = 'none';
        // Для Chrome/Safari
        frameInput.style.setProperty('::-webkit-outer-spin-button', 'none');
        frameInput.style.setProperty('::-webkit-inner-spin-button', 'none');
        // При изменении поля — переход к кадру
        function gotoFrameFromInput() {
            if (typeof window.exportRoot !== 'undefined' && typeof window.exportRoot.gotoAndStop === 'function') {
                let val = parseInt(frameInput.value, 10);
                if (isNaN(val)) return;
                val = Math.max(1, Math.min(val, parseInt(frameSlider.max, 10) + 1));
                window.exportRoot.gotoAndStop(val - 1);
                updateFrameSlider();
            }
        }
        frameInput.addEventListener('change', gotoFrameFromInput);
        frameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                gotoFrameFromInput();
                frameInput.blur();
            }
        });
        // Функция обновления слайдера кадров
        function updateFrameSlider() {
            if (typeof window.exportRoot !== 'undefined' && typeof window.exportRoot.totalFrames !== 'undefined') {
                frameSlider.max = (window.exportRoot.totalFrames - 1).toString();
                frameSlider.value = window.exportRoot.currentFrame || 0;
                frameSlider.disabled = false;
                frameLabel.textContent = `Кадр: ${window.exportRoot.currentFrame + 1} / ${window.exportRoot.totalFrames}`;
                frameInput.max = window.exportRoot.totalFrames;
                frameInput.disabled = false;
                if (document.activeElement !== frameInput) {
                    frameInput.value = (window.exportRoot.currentFrame + 1) || 1;
                }
            } else {
                frameSlider.max = '0';
                frameSlider.value = '0';
                frameSlider.disabled = true;
                frameLabel.textContent = 'Кадр: недоступно';
                frameInput.value = '';
                frameInput.disabled = true;
            }
        }
        // Событие перемотки по кадрам
        frameSlider.addEventListener('input', () => {
            if (typeof window.exportRoot !== 'undefined' && typeof window.exportRoot.gotoAndStop === 'function') {
                window.exportRoot.gotoAndStop(parseInt(frameSlider.value, 10));
                updateFrameSlider();
            }
        });
        // Обновлять слайдер при каждом tick (если exportRoot есть)
        if (typeof createjs !== 'undefined' && createjs.Ticker) {
            createjs.Ticker.addEventListener('tick', updateFrameSlider);
        }
        // Первичная инициализация
        updateFrameSlider();
        frameSliderContainer.appendChild(frameSlider);
        frameSliderContainer.appendChild(frameInput);
        btnContainer.appendChild(frameSliderContainer);

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
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(0,0,0,0.5)'; });
            btn.addEventListener('click', () => { onClick(); updateFrDisplay(); });
            btnContainer.appendChild(btn);
        }

        // Добавляем только кнопку паузы
        let pauseBtnIcon = null;
        function togglePause() {
            if (typeof window.exportRoot !== 'undefined') {
                window.exportRoot.paused = !window.exportRoot.paused;
                console.log(`[Paused toggle] ${window.exportRoot.paused}`);
                if (pauseBtnIcon) {
                    pauseBtnIcon.textContent = window.exportRoot.paused ? 'play_circle_filled' : 'pause_circle_filled';
                }
            }
        }

        // Функция создания и управления линейками
        let rulersActive = false;
        let horizontalRuler = null;
        let verticalRuler = null;

        function createRulers() {
            // Создаем горизонтальную линейку
            horizontalRuler = document.createElement('div');
            Object.assign(horizontalRuler.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                zIndex: '9998',
                cursor: 'grab',
                display: 'none'
            });

            // Создаем вертикальную линейку
            verticalRuler = document.createElement('div');
            Object.assign(verticalRuler.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '20px',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                zIndex: '9998',
                cursor: 'grab',
                display: 'none'
            });

            // Создаем перетаскиваемую горизонтальную линейку
            const horizontalGuide = document.createElement('div');
            Object.assign(horizontalGuide.style, {
                position: 'absolute',
                left: '0',
                top: '10px',
                width: '100%',
                height: '1px',
                background: 'red',
                zIndex: '9997',
                pointerEvents: 'none'
            });
            horizontalRuler.appendChild(horizontalGuide);

            // Разметка на горизонтальной линейке
            for (let i = 0; i <= window.innerWidth; i += 50) {
                const tick = document.createElement('div');
                Object.assign(tick.style, {
                    position: 'absolute',
                    left: `${i}px`,
                    top: '0',
                    width: '1px',
                    height: i % 100 === 0 ? '10px' : '5px',
                    background: 'white'
                });

                if (i % 100 === 0) {
                    const label = document.createElement('div');
                    Object.assign(label.style, {
                        position: 'absolute',
                        left: `${i + 3}px`,
                        top: '10px',
                        color: 'white',
                        fontSize: '8px'
                    });
                    label.textContent = i.toString();
                    horizontalRuler.appendChild(label);
                }

                horizontalRuler.appendChild(tick);
            }

            // Создаем перетаскиваемую вертикальную линейку
            const verticalGuide = document.createElement('div');
            Object.assign(verticalGuide.style, {
                position: 'absolute',
                left: '10px',
                top: '0',
                width: '1px',
                height: '100%',
                background: 'red',
                zIndex: '9997',
                pointerEvents: 'none'
            });
            verticalRuler.appendChild(verticalGuide);

            // Разметка на вертикальной линейке
            for (let i = 0; i <= window.innerHeight; i += 50) {
                const tick = document.createElement('div');
                Object.assign(tick.style, {
                    position: 'absolute',
                    left: '0',
                    top: `${i}px`,
                    height: '1px',
                    width: i % 100 === 0 ? '10px' : '5px',
                    background: 'white'
                });

                if (i % 100 === 0) {
                    const label = document.createElement('div');
                    Object.assign(label.style, {
                        position: 'absolute',
                        left: '10px',
                        top: `${i + 3}px`,
                        color: 'white',
                        fontSize: '8px'
                    });
                    label.textContent = i.toString();
                    verticalRuler.appendChild(label);
                }

                verticalRuler.appendChild(tick);
            }

            // Добавляем функционал создания направляющих
            let isDraggingH = false;
            let isDraggingV = false;
            let guides = [];

            // Горизонтальные направляющие
            horizontalRuler.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    const newGuide = document.createElement('div');
                    Object.assign(newGuide.style, {
                        position: 'absolute',
                        left: '0',
                        top: `${e.clientY}px`,
                        width: '100%',
                        height: '1px',
                        background: 'rgba(0, 191, 255, 0.7)',
                        zIndex: '9996',
                        cursor: 'row-resize'
                    });
                    document.body.appendChild(newGuide);
                    guides.push(newGuide);

                    const moveHandler = (moveEvent) => {
                        newGuide.style.top = `${moveEvent.clientY}px`;
                    };

                    const upHandler = () => {
                        document.removeEventListener('mousemove', moveHandler);
                        document.removeEventListener('mouseup', upHandler);
                    };

                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('mouseup', upHandler);

                    // Двойной клик для удаления
                    newGuide.addEventListener('dblclick', () => {
                        newGuide.remove();
                        guides = guides.filter(g => g !== newGuide);
                    });

                    // Перетаскивание
                    newGuide.addEventListener('mousedown', (guideEvent) => {
                        guideEvent.stopPropagation();

                        const guideMoveHandler = (moveEvent) => {
                            newGuide.style.top = `${moveEvent.clientY}px`;
                        };

                        const guideUpHandler = () => {
                            document.removeEventListener('mousemove', guideMoveHandler);
                            document.removeEventListener('mouseup', guideUpHandler);
                        };

                        document.addEventListener('mousemove', guideMoveHandler);
                        document.addEventListener('mouseup', guideUpHandler);
                    });
                }
            });

            // Вертикальные направляющие
            verticalRuler.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    const newGuide = document.createElement('div');
                    Object.assign(newGuide.style, {
                        position: 'absolute',
                        left: `${e.clientX}px`,
                        top: '0',
                        width: '1px',
                        height: '100%',
                        background: 'rgba(0, 191, 255, 0.7)',
                        zIndex: '9996',
                        cursor: 'col-resize'
                    });
                    document.body.appendChild(newGuide);
                    guides.push(newGuide);

                    const moveHandler = (moveEvent) => {
                        newGuide.style.left = `${moveEvent.clientX}px`;
                    };

                    const upHandler = () => {
                        document.removeEventListener('mousemove', moveHandler);
                        document.removeEventListener('mouseup', upHandler);
                    };

                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('mouseup', upHandler);

                    // Двойной клик для удаления
                    newGuide.addEventListener('dblclick', () => {
                        newGuide.remove();
                        guides = guides.filter(g => g !== newGuide);
                    });

                    // Перетаскивание
                    newGuide.addEventListener('mousedown', (guideEvent) => {
                        guideEvent.stopPropagation();

                        const guideMoveHandler = (moveEvent) => {
                            newGuide.style.left = `${moveEvent.clientX}px`;
                        };

                        const guideUpHandler = () => {
                            document.removeEventListener('mousemove', guideMoveHandler);
                            document.removeEventListener('mouseup', guideUpHandler);
                        };

                        document.addEventListener('mousemove', guideMoveHandler);
                        document.addEventListener('mouseup', guideUpHandler);
                    });
                }
            });

            document.body.appendChild(horizontalRuler);
            document.body.appendChild(verticalRuler);
        }

        function toggleRulers() {
            rulersActive = !rulersActive;

            if (rulersActive) {
                if (!horizontalRuler || !verticalRuler) {
                    createRulers();
                }
                horizontalRuler.style.display = 'block';
                verticalRuler.style.display = 'block';
            } else {
                if (horizontalRuler && verticalRuler) {
                    horizontalRuler.style.display = 'none';
                    verticalRuler.style.display = 'none';
                }
            }
        }

        // Создаём кнопку паузы с сохранением ссылки на иконку
        (function() {
            const btn = document.createElement('button');
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = (typeof window.exportRoot !== 'undefined' && window.exportRoot.paused) ? 'play_circle_filled' : 'pause_circle_filled';
            pauseBtnIcon = icon;
            btn.appendChild(icon);
            btn.title = 'Toggle Pause';
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
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(0,0,0,0.5)'; });
            btn.addEventListener('click', () => { togglePause(); updateFrDisplay(); });
            btnContainer.appendChild(btn);
        })();

        // Добавляем кнопку для включения/выключения линеек
        (function() {
            const btn = document.createElement('button');
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = 'straighten';
            btn.appendChild(icon);
            btn.title = 'Показать/скрыть линейки';
            Object.assign(btn.style, {
                width: '32px',
                height: '32px',
                padding: '0',
                margin: '8px 0 0 0',
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
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(0,0,0,0.5)'; });
            btn.addEventListener('click', toggleRulers);
            btnContainer.appendChild(btn);
        })();

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

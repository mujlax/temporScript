// ==UserScript==
// @name         Animate Control Panel Collapsible
// @namespace    http://tampermonkey.net/
// @version      1.30
// @description  Коллапсируемая панель с иконками управления framerate и паузой на Animate-страницах; отображение текущего framerate внутри контейнера кнопок с эффектом hover и появлением фона в hover-зоне
// @match        *://*/*
// @include      file:///*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        // Проверка Animate-страницы с несколькими попытками
        let checkAttempts = 0;
        const maxAttempts = 5;
        const checkInterval = 300; // мс между попытками
        
        function checkAnimatePage() {
            const isAnimateCC = !!document.querySelector('div#animation_container');
            if (isAnimateCC) {
                console.log('[Animate Panel] Adobe Animate страница обнаружена');
                initAnimatePanel();
            } else if (checkAttempts < maxAttempts) {
                checkAttempts++;
                console.log(`[Animate Panel] Попытка ${checkAttempts}/${maxAttempts} обнаружения страницы Animate...`);
                setTimeout(checkAnimatePage, checkInterval);
            }
        }
        
        // Запускаем первую проверку
        checkAnimatePage();
        
        // Основная функция инициализации панели
        function initAnimatePanel() {
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
            /* Предотвращение выделения текста при перетаскивании */
            .no-select, .no-select * {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
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
            let rectanglesActive = true; // Новая переменная для прямоугольников
            let horizontalRuler = null;
            let verticalRuler = null;
            let rectangles = [];
            let selectedColor = 'rgba(255, 0, 0, 0.3)';
            let colorPalette = null;

            function createColorPalette() {
                const palette = document.createElement('div');
                Object.assign(palette.style, {
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '5px',
                    borderRadius: '5px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    zIndex: '9999',
                    maxWidth: '150px'
                });

                const colors = [
                    'rgba(255, 0, 0, 0.3)',    // Красный
                    'rgba(255, 165, 0, 0.3)',  // Оранжевый
                    'rgba(255, 255, 0, 0.3)',  // Жёлтый
                    'rgba(0, 128, 0, 0.3)',    // Зелёный
                    'rgba(0, 0, 255, 0.3)',    // Синий
                    'rgba(128, 0, 128, 0.3)',  // Фиолетовый
                    'rgba(0, 0, 0, 0.3)',      // Чёрный
                    'rgba(255, 255, 255, 0.3)' // Белый
                ];

                colors.forEach(color => {
                    const colorBtn = document.createElement('div');
                    Object.assign(colorBtn.style, {
                        width: '25px',
                        height: '25px',
                        background: color,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        border: color === selectedColor ? '2px solid white' : '1px solid #ccc'
                    });
                    
                    colorBtn.addEventListener('click', () => {
                        selectedColor = color;
                        // Обновляем выделение выбранного цвета
                        palette.querySelectorAll('div').forEach(btn => {
                            btn.style.border = btn === colorBtn ? '2px solid white' : '1px solid #ccc';
                        });
                    });
                    
                    palette.appendChild(colorBtn);
                });

                return palette;
            }

            function createRulers() {
                // Создаем горизонтальную линейку
                horizontalRuler = document.createElement('div');
                horizontalRuler.className = 'no-select';
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
                verticalRuler.className = 'no-select';
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

                // Создаем цветовую палитру
                colorPalette = createColorPalette();
                document.body.appendChild(colorPalette);
                colorPalette.style.display = 'none';

                // Добавляем функционал рисования прямоугольников
                let isDrawingRect = false;
                let startX, startY;
                let currentRect = null;
                let isResizing = false;
                let resizeDirection = '';
                let currentResizeRect = null;

                // Функция для добавления маркеров изменения размера к прямоугольнику
                function addResizeHandles(rect) {
                    const handles = {
                        n: document.createElement('div'),  // верх
                        e: document.createElement('div'),  // право
                        s: document.createElement('div'),  // низ
                        w: document.createElement('div'),  // лево
                        ne: document.createElement('div'), // верх-право
                        se: document.createElement('div'), // низ-право
                        sw: document.createElement('div'), // низ-лево
                        nw: document.createElement('div')  // верх-лево
                    };
                    
                    // Общие стили для всех маркеров
                    const handleStyle = {
                        position: 'absolute',
                        width: '8px',
                        height: '8px',
                        background: 'white',
                        border: '1px solid #666',
                        zIndex: '9999',
                        display: 'none'
                    };
                    
                    // Позиционирование маркеров
                    Object.assign(handles.n.style, handleStyle, {
                        top: '-4px',
                        left: 'calc(50% - 4px)',
                        cursor: 'n-resize'
                    });
                    
                    Object.assign(handles.e.style, handleStyle, {
                        top: 'calc(50% - 4px)',
                        right: '-4px',
                        cursor: 'e-resize'
                    });
                    
                    Object.assign(handles.s.style, handleStyle, {
                        bottom: '-4px',
                        left: 'calc(50% - 4px)',
                        cursor: 's-resize'
                    });
                    
                    Object.assign(handles.w.style, handleStyle, {
                        top: 'calc(50% - 4px)',
                        left: '-4px',
                        cursor: 'w-resize'
                    });
                    
                    Object.assign(handles.ne.style, handleStyle, {
                        top: '-4px',
                        right: '-4px',
                        cursor: 'ne-resize'
                    });
                    
                    Object.assign(handles.se.style, handleStyle, {
                        bottom: '-4px',
                        right: '-4px',
                        cursor: 'se-resize'
                    });
                    
                    Object.assign(handles.sw.style, handleStyle, {
                        bottom: '-4px',
                        left: '-4px',
                        cursor: 'sw-resize'
                    });
                    
                    Object.assign(handles.nw.style, handleStyle, {
                        top: '-4px',
                        left: '-4px',
                        cursor: 'nw-resize'
                    });
                    
                    // Добавляем обработчики событий для всех маркеров
                    for (const [direction, handle] of Object.entries(handles)) {
                        handle.className = 'resize-handle';
                        handle.dataset.direction = direction;
                        
                        handle.addEventListener('mousedown', (e) => {
                            e.stopPropagation();
                            isResizing = true;
                            resizeDirection = direction;
                            currentResizeRect = rect;
                            
                            const offsetX = e.clientX;
                            const offsetY = e.clientY;
                            const rectLeft = parseInt(rect.style.left);
                            const rectTop = parseInt(rect.style.top);
                            const rectWidth = parseInt(rect.style.width);
                            const rectHeight = parseInt(rect.style.height);
                            
                            const moveHandler = (moveEvent) => {
                                if (!isResizing) return;
                                
                                moveEvent.preventDefault();
                                
                                const dx = moveEvent.clientX - offsetX;
                                const dy = moveEvent.clientY - offsetY;
                                
                                switch (direction) {
                                    case 'n':
                                        const newTopN = rectTop + dy;
                                        const newHeightN = rectHeight - dy;
                                        if (newHeightN > 10) {
                                            rect.style.top = `${newTopN}px`;
                                            rect.style.height = `${newHeightN}px`;
                                        }
                                        break;
                                    case 'e':
                                        const newWidthE = rectWidth + dx;
                                        if (newWidthE > 10) {
                                            rect.style.width = `${newWidthE}px`;
                                        }
                                        break;
                                    case 's':
                                        const newHeightS = rectHeight + dy;
                                        if (newHeightS > 10) {
                                            rect.style.height = `${newHeightS}px`;
                                        }
                                        break;
                                    case 'w':
                                        const newLeftW = rectLeft + dx;
                                        const newWidthW = rectWidth - dx;
                                        if (newWidthW > 10) {
                                            rect.style.left = `${newLeftW}px`;
                                            rect.style.width = `${newWidthW}px`;
                                        }
                                        break;
                                    case 'ne':
                                        const newTopNE = rectTop + dy;
                                        const newHeightNE = rectHeight - dy;
                                        const newWidthNE = rectWidth + dx;
                                        if (newHeightNE > 10) {
                                            rect.style.top = `${newTopNE}px`;
                                            rect.style.height = `${newHeightNE}px`;
                                        }
                                        if (newWidthNE > 10) {
                                            rect.style.width = `${newWidthNE}px`;
                                        }
                                        break;
                                    case 'se':
                                        const newHeightSE = rectHeight + dy;
                                        const newWidthSE = rectWidth + dx;
                                        if (newHeightSE > 10) {
                                            rect.style.height = `${newHeightSE}px`;
                                        }
                                        if (newWidthSE > 10) {
                                            rect.style.width = `${newWidthSE}px`;
                                        }
                                        break;
                                    case 'sw':
                                        const newLeftSW = rectLeft + dx;
                                        const newWidthSW = rectWidth - dx;
                                        const newHeightSW = rectHeight + dy;
                                        if (newWidthSW > 10) {
                                            rect.style.left = `${newLeftSW}px`;
                                            rect.style.width = `${newWidthSW}px`;
                                        }
                                        if (newHeightSW > 10) {
                                            rect.style.height = `${newHeightSW}px`;
                                        }
                                        break;
                                    case 'nw':
                                        const newTopNW = rectTop + dy;
                                        const newHeightNW = rectHeight - dy;
                                        const newLeftNW = rectLeft + dx;
                                        const newWidthNW = rectWidth - dx;
                                        if (newHeightNW > 10) {
                                            rect.style.top = `${newTopNW}px`;
                                            rect.style.height = `${newHeightNW}px`;
                                        }
                                        if (newWidthNW > 10) {
                                            rect.style.left = `${newLeftNW}px`;
                                            rect.style.width = `${newWidthNW}px`;
                                        }
                                        break;
                                }
                            };
                            
                            const upHandler = () => {
                                isResizing = false;
                                resizeDirection = '';
                                currentResizeRect = null;
                                document.removeEventListener('mousemove', moveHandler);
                                document.removeEventListener('mouseup', upHandler);
                            };
                            
                            document.addEventListener('mousemove', moveHandler);
                            document.addEventListener('mouseup', upHandler);
                        });
                        
                        rect.appendChild(handle);
                    }
                    
                    // Показываем и скрываем маркеры при наведении
                    rect.addEventListener('mouseenter', () => {
                        for (const handle of Object.values(handles)) {
                            handle.style.display = 'block';
                        }
                    });
                    
                    rect.addEventListener('mouseleave', () => {
                        // Скрываем маркеры только если не происходит изменение размера
                        if (!isResizing || currentResizeRect !== rect) {
                            for (const handle of Object.values(handles)) {
                                handle.style.display = 'none';
                            }
                        }
                    });
                    
                    return handles;
                }

                document.addEventListener('mousedown', (e) => {
                    // Если ректанглы активны и не находимся на линейках
                    if (rectanglesActive && 
                        (horizontalRuler === null || e.target !== horizontalRuler) && 
                        (verticalRuler === null || e.target !== verticalRuler)) {
                        
                        // Проверяем, не перетаскиваем ли мы панель
                        if (e.target === toggle || e.target === toggleIcon || panel.contains(e.target)) {
                            return; // Не рисуем прямоугольник, если кликнули на панель или её элементы
                        }
                        
                        // Проверяем, кликнули ли мы по прямоугольнику
                        let clickedRect = null;
                        let clickedOnRect = false;
                        
                        // Сначала проверяем, кликнули ли мы по существующему прямоугольнику
                        for (let rect of rectangles) {
                            const rectEl = rect.element;
                            const rectRect = rectEl.getBoundingClientRect();
                            
                            if (e.clientX >= rectRect.left && e.clientX <= rectRect.right &&
                                e.clientY >= rectRect.top && e.clientY <= rectRect.bottom) {
                                
                                clickedRect = rect;
                                clickedOnRect = true;
                                break;
                            }
                        }
                        
                        // Если кликнули по прямоугольнику и зажат Shift - копируем его
                        if (clickedOnRect && e.shiftKey) {
                            const rectEl = clickedRect.element;
                            
                            // Копируем прямоугольник
                            const copyRect = document.createElement('div');
                            copyRect.className = 'rectangle';
                            Object.assign(copyRect.style, {
                                position: 'absolute',
                                left: `${parseInt(rectEl.style.left) + 10}px`,
                                top: `${parseInt(rectEl.style.top) + 10}px`,
                                width: rectEl.style.width,
                                height: rectEl.style.height,
                                background: rectEl.style.background,
                                border: '1px solid #666',
                                zIndex: '9995',
                                cursor: 'move'
                            });
                            
                            document.body.appendChild(copyRect);
                            
                            // Добавляем в массив прямоугольников
                            rectangles.push({
                                element: copyRect,
                                color: rectEl.style.background
                            });
                            
                            // Добавляем функционал перетаскивания
                            makeRectDraggable(copyRect);
                            
                            // Добавляем маркеры изменения размера
                            addResizeHandles(copyRect);
                            
                            // Добавляем удаление по двойному клику
                            copyRect.addEventListener('dblclick', function() {
                                const rect = this;
                                if (rect) {
                                    rect.remove();
                                    rectangles = rectangles.filter(r => r.element !== rect);
                                }
                            });
                            
                            return;
                        } 
                        // Если кликнули по прямоугольнику без Shift - позволяем перетаскивать его
                        else if (clickedOnRect) {
                            return; // Обработка перетаскивания будет в makeRectDraggable
                        }
                        
                        // Если линейки активны, не кликнули по прямоугольнику и не на направляющих, рисуем новый прямоугольник
                        if (rulersActive && !clickedOnRect && !e.target.closest('.guide')) {
                            // Начинаем рисовать прямоугольник
                            isDrawingRect = true;
                            startX = e.clientX;
                            startY = e.clientY;
                            
                            currentRect = document.createElement('div');
                            currentRect.className = 'rectangle';
                            Object.assign(currentRect.style, {
                                position: 'absolute',
                                left: `${startX}px`,
                                top: `${startY}px`,
                                width: '0px',
                                height: '0px',
                                background: selectedColor,
                                border: '1px solid #666',
                                zIndex: '9995',
                                cursor: 'move'
                            });
                            
                            document.body.appendChild(currentRect);
                        }
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (isDrawingRect && currentRect) {
                        e.preventDefault(); // Предотвращаем выделение текста
                        const width = e.clientX - startX;
                        const height = e.clientY - startY;
                        
                        // Устанавливаем размеры и позицию в зависимости от направления рисования
                        if (width < 0) {
                            currentRect.style.left = `${e.clientX}px`;
                            currentRect.style.width = `${Math.abs(width)}px`;
                        } else {
                            currentRect.style.width = `${width}px`;
                        }
                        
                        if (height < 0) {
                            currentRect.style.top = `${e.clientY}px`;
                            currentRect.style.height = `${Math.abs(height)}px`;
                        } else {
                            currentRect.style.height = `${height}px`;
                        }
                    }
                });

                document.addEventListener('mouseup', (e) => {
                    if (isDrawingRect && currentRect) {
                        isDrawingRect = false;
                        
                        // Если прямоугольник слишком маленький, удаляем его
                        if (parseInt(currentRect.style.width) < 5 || parseInt(currentRect.style.height) < 5) {
                            currentRect.remove();
                            currentRect = null;
                            return;
                        }
                        
                        // Добавляем в массив прямоугольников
                        rectangles.push({
                            element: currentRect,
                            color: selectedColor
                        });
                        
                        // Добавляем функционал перетаскивания
                        makeRectDraggable(currentRect);
                        
                        // Добавляем маркеры изменения размера
                        addResizeHandles(currentRect);
                        
                        // Добавляем удаление по двойному клику
                        currentRect.addEventListener('dblclick', function() {
                            const rect = this;
                            if (rect) {
                                rect.remove();
                                rectangles = rectangles.filter(r => r.element !== rect);
                            }
                        });
                        
                        currentRect = null;
                    }
                });

                // Функция для добавления возможности перетаскивания прямоугольника
                function makeRectDraggable(element) {
                    let isDragging = false;
                    let offsetX, offsetY;
                    
                    element.addEventListener('mousedown', (e) => {
                        if (!e.shiftKey) { // Только если не зажата клавиша Shift
                            isDragging = true;
                            offsetX = e.clientX - parseInt(element.style.left);
                            offsetY = e.clientY - parseInt(element.style.top);
                            e.stopPropagation(); // Предотвращаем создание нового прямоугольника
                        }
                    });
                    
                    const moveHandler = (e) => {
                        if (isDragging) {
                            element.style.left = `${e.clientX - offsetX}px`;
                            element.style.top = `${e.clientY - offsetY}px`;
                            e.preventDefault();
                        }
                    };
                    
                    const upHandler = () => {
                        isDragging = false;
                    };
                    
                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('mouseup', upHandler);
                }

                // Добавляем функционал создания направляющих
                let isDraggingH = false;
                let isDraggingV = false;
                let guides = [];

                // Горизонтальные направляющие
                horizontalRuler.addEventListener('mousedown', (e) => {
                    if (e.button === 0) {
                        e.preventDefault(); // Предотвращаем выделение текста
                        
                        const newGuide = document.createElement('div');
                        newGuide.className = 'guide no-select';
                        Object.assign(newGuide.style, {
                            position: 'absolute',
                            left: '0',
                            top: `${e.clientY}px`,
                            width: '100%',
                            height: '5px', // Увеличиваем область для перетаскивания
                            background: 'transparent', // Делаем фон прозрачным
                            zIndex: '9996',
                            cursor: 'row-resize'
                        });
                        
                        // Добавляем видимую линию внутри увеличенной области
                        const visibleLine = document.createElement('div');
                        Object.assign(visibleLine.style, {
                            position: 'absolute',
                            left: '0',
                            top: '2px', // Центрируем в родительском элементе
                            width: '100%',
                            height: '1px',
                            background: 'rgba(0, 191, 255, 0.7)'
                        });
                        newGuide.appendChild(visibleLine);
                        
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
                            guideEvent.preventDefault(); // Предотвращаем выделение текста
                            
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
                        e.preventDefault(); // Предотвращаем выделение текста
                        
                        const newGuide = document.createElement('div');
                        newGuide.className = 'guide no-select';
                        Object.assign(newGuide.style, {
                            position: 'absolute',
                            left: `${e.clientX}px`,
                            top: '0',
                            width: '5px', // Увеличиваем область для перетаскивания
                            height: '100%',
                            background: 'transparent', // Делаем фон прозрачным
                            zIndex: '9996',
                            cursor: 'col-resize'
                        });
                        
                        // Добавляем видимую линию внутри увеличенной области
                        const visibleLine = document.createElement('div');
                        Object.assign(visibleLine.style, {
                            position: 'absolute',
                            left: '2px', // Центрируем в родительском элементе
                            top: '0',
                            width: '1px',
                            height: '100%',
                            background: 'rgba(0, 191, 255, 0.7)'
                        });
                        newGuide.appendChild(visibleLine);
                        
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
                            guideEvent.preventDefault(); // Предотвращаем выделение текста
                            
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
                    if (colorPalette) colorPalette.style.display = 'flex';
                } else {
                    if (horizontalRuler && verticalRuler) {
                        horizontalRuler.style.display = 'none';
                        verticalRuler.style.display = 'none';
                    }
                    if (colorPalette) colorPalette.style.display = 'none';
                    
                    // Не отключаем rectanglesActive при отключении линеек
                    // так прямоугольники останутся доступными для копирования
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

            // Функционал перетаскивания панели
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;
            let wasDragged = false; // Флаг, показывающий было ли перетаскивание

            toggle.addEventListener('mousedown', (e) => {
                // Начинаем перетаскивание только при нажатии левой кнопки мыши
                if (e.button === 0) {
                    isDragging = true;
                    wasDragged = false; // Сбрасываем флаг при начале нового перетаскивания
                    // Вычисляем смещение от курсора до верхнего левого угла панели
                    dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
                    dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
                    e.preventDefault();
                }
            });

            document.addEventListener('mousemove', (e) => {
                // Перемещаем панель если режим перетаскивания активен
                if (isDragging) {
                    panel.style.left = `${e.clientX - dragOffsetX}px`;
                    panel.style.top = `${e.clientY - dragOffsetY}px`;
                    wasDragged = true; // Устанавливаем флаг, что было перетаскивание
                }
                
                // Динамическая hover-зона, которая перемещается вместе с панелью
                const threshold = 50;
                const panelRect = panel.getBoundingClientRect();
                const isInsideHoverZone = 
                    e.clientX >= panelRect.left - threshold &&
                    e.clientX <= panelRect.right + threshold &&
                    e.clientY >= panelRect.top - threshold &&
                    e.clientY <= panelRect.bottom + threshold;
                
                if (isInsideHoverZone && panel.classList.contains('collapsed')) {
                    toggle.style.opacity = '1';
                    panel.style.background = bgExpanded;
                } else if (panel.classList.contains('collapsed')) {
                    toggle.style.opacity = '0';
                    panel.style.background = bgCollapsed;
                }
            });

            document.addEventListener('mouseup', () => {
                // Прекращаем перетаскивание при отпускании кнопки мыши
                isDragging = false;
                // wasDragged сохраняем, чтобы использовать в click обработчике
                // Он сбросится при следующем mousedown
            });

            toggle.addEventListener('click', (e) => {
                // Если было перетаскивание, игнорируем событие click
                if (wasDragged) {
                    e.stopPropagation();
                    return;
                }
                
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
        }
    });
})();

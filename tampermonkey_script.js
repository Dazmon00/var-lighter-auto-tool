// ==UserScript==
// @name         交易自动化工具
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  提供四个交易策略按钮：long_lighter, long_var, short_lighter, short_var
// @author       colarisx
// @match        https://app.lighter.xyz/*
// @match        https://omni.variational.io//*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 工具函数 ====================
    function formatTime(date) {
        return date.toTimeString().split(' ')[0];
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== UI创建 ====================
    function createUI() {
        // 创建可拖动的控制按钮
        const controlButton = document.createElement('div');
        controlButton.id = 'trading-tool-control-btn';
        controlButton.textContent = '交易工具';
        controlButton.style.position = 'fixed';
        controlButton.style.top = '10px';
        controlButton.style.right = '10px';
        controlButton.style.width = '80px';
        controlButton.style.height = '30px';
        controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        controlButton.style.color = 'white';
        controlButton.style.borderRadius = '15px';
        controlButton.style.padding = '5px 10px';
        controlButton.style.zIndex = '9999';
        controlButton.style.fontFamily = 'Arial, sans-serif';
        controlButton.style.fontSize = '12px';
        controlButton.style.fontWeight = 'bold';
        controlButton.style.textAlign = 'center';
        controlButton.style.cursor = 'move';
        controlButton.style.userSelect = 'none';
        controlButton.style.display = 'flex';
        controlButton.style.alignItems = 'center';
        controlButton.style.justifyContent = 'center';
        controlButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
        controlButton.style.transition = 'background-color 0.3s ease';

        // 创建主容器
        const container = document.createElement('div');
        container.id = 'trading-tool-container';
        container.style.position = 'fixed';
        container.style.top = '45px';
        container.style.right = '10px';
        container.style.width = '220px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = 'white';
        container.style.borderRadius = '8px';
        container.style.padding = '15px';
        container.style.zIndex = '9999';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        container.style.display = 'none'; // 初始隐藏

        // 标题
        const title = document.createElement('div');
        title.textContent = '交易自动化工具';
        title.style.fontSize = '16px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '15px';
        title.style.textAlign = 'center';
        title.style.color = '#f0c040';
        container.appendChild(title);

        // 状态显示
        const statusDiv = document.createElement('div');
        statusDiv.id = 'trading-status';
        statusDiv.style.marginBottom = '15px';
        statusDiv.style.padding = '8px';
        statusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        statusDiv.style.borderRadius = '4px';
        statusDiv.style.fontSize = '12px';
        statusDiv.style.minHeight = '40px';
        statusDiv.textContent = '状态: 未启动';
        container.appendChild(statusDiv);

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '8px';

        // 创建按钮函数
        const createButton = (id, text, color, onClick) => {
            const button = document.createElement('button');
            button.id = id;
            button.textContent = text;
            button.style.backgroundColor = color;
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.padding = '8px 12px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '12px';
            button.style.fontWeight = 'bold';
            button.style.transition = 'all 0.3s ease';
            button.addEventListener('click', onClick);
            return button;
        };

        // 创建四个功能按钮
        const longLighterBtn = createButton('long-lighter-btn', '做多Lighter', '#4CAF50', () => {
            stopAllScripts();
            showConfigPanel('longLighter');
        });

        const shortLighterBtn = createButton('short-lighter-btn', '做空Lighter', '#FF9800', () => {
            stopAllScripts();
            showConfigPanel('shortLighter');
        });

        const longVarBtn = createButton('long-var-btn', '做多Var', '#2196F3', () => {
            stopAllScripts();
            showConfigPanel('longVar');
        });

        const shortVarBtn = createButton('short-var-btn', '做空Var', '#F44336', () => {
            stopAllScripts();
            showConfigPanel('shortVar');
        });

        // 停止按钮
        const stopBtn = createButton('stop-all-btn', '停止所有策略', '#9E9E9E', () => {
            stopAllScripts();
            updateStatus('所有策略已停止');
        });

        // 添加按钮到容器
        buttonContainer.appendChild(longLighterBtn);
        buttonContainer.appendChild(shortLighterBtn);
        buttonContainer.appendChild(longVarBtn);
        buttonContainer.appendChild(shortVarBtn);
        buttonContainer.appendChild(stopBtn);

        container.appendChild(buttonContainer);

        // 创建配置面板
        const configPanel = document.createElement('div');
        configPanel.id = 'trading-config-panel';
        configPanel.style.display = 'none'; // 初始隐藏
        configPanel.style.marginTop = '15px';
        configPanel.style.padding = '10px';
        configPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        configPanel.style.borderRadius = '4px';

        // 配置标题
        const configTitle = document.createElement('div');
        configTitle.textContent = '策略配置';
        configTitle.style.fontSize = '14px';
        configTitle.style.fontWeight = 'bold';
        configTitle.style.marginBottom = '10px';
        configTitle.style.textAlign = 'center';
        configPanel.appendChild(configTitle);

        // 创建配置表单
        const configForm = document.createElement('div');
        configForm.style.display = 'flex';
        configForm.style.flexDirection = 'column';
        configForm.style.gap = '10px';

        // 重试次数配置
        const retryGroup = document.createElement('div');
        retryGroup.style.display = 'flex';
        retryGroup.style.flexDirection = 'column';
        retryGroup.style.gap = '5px';

        const retryLabel = document.createElement('label');
        retryLabel.textContent = '重试次数:';
        retryLabel.style.fontSize = '12px';
        retryGroup.appendChild(retryLabel);

        const retryInput = document.createElement('input');
        retryInput.type = 'number';
        retryInput.id = 'retry-count';
        retryInput.value = '5';
        retryInput.min = '1';
        retryInput.max = '99';
        retryInput.style.padding = '5px';
        retryInput.style.borderRadius = '3px';
        retryInput.style.border = 'none';
        retryGroup.appendChild(retryInput);

        configForm.appendChild(retryGroup);

        // 休眠时间配置
        const sleepGroup = document.createElement('div');
        sleepGroup.style.display = 'flex';
        sleepGroup.style.flexDirection = 'column';
        sleepGroup.style.gap = '5px';

        const sleepLabel = document.createElement('label');
        sleepLabel.textContent = '休眠时间(秒):';
        sleepLabel.style.fontSize = '12px';
        sleepGroup.appendChild(sleepLabel);

        const sleepInput = document.createElement('input');
        sleepInput.type = 'number';
        sleepInput.id = 'sleep-time';
        sleepInput.value = '300';
        sleepInput.min = '10';
        sleepInput.max = '3600';
        sleepInput.style.padding = '5px';
        sleepInput.style.borderRadius = '3px';
        sleepInput.style.border = 'none';
        sleepGroup.appendChild(sleepInput);

        configForm.appendChild(sleepGroup);

        // 交易对配置
        const pairGroup = document.createElement('div');
        pairGroup.style.display = 'flex';
        pairGroup.style.flexDirection = 'column';
        pairGroup.style.gap = '5px';

        const pairLabel = document.createElement('label');
        pairLabel.textContent = '交易对:';
        pairLabel.style.fontSize = '12px';
        pairGroup.appendChild(pairLabel);

        const pairSelect = document.createElement('select');
        pairSelect.id = 'trading-pair';
        pairSelect.style.padding = '5px';
        pairSelect.style.borderRadius = '3px';
        pairSelect.style.border = 'none';

        // 添加常见交易对选项
        const commonPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT'];
        commonPairs.forEach(pair => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            pairSelect.appendChild(option);
        });

        pairGroup.appendChild(pairSelect);
        configForm.appendChild(pairGroup);

        // 按钮组
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.justifyContent = 'space-between';
        buttonGroup.style.marginTop = '10px';

        const startButton = document.createElement('button');
        startButton.textContent = '开始策略';
        startButton.style.backgroundColor = '#4CAF50';
        startButton.style.color = 'white';
        startButton.style.border = 'none';
        startButton.style.borderRadius = '4px';
        startButton.style.padding = '8px 12px';
        startButton.style.cursor = 'pointer';
        startButton.style.fontSize = '12px';
        startButton.style.fontWeight = 'bold';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.backgroundColor = '#9E9E9E';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.padding = '8px 12px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.fontSize = '12px';
        cancelButton.style.fontWeight = 'bold';

        buttonGroup.appendChild(startButton);
        buttonGroup.appendChild(cancelButton);

        configForm.appendChild(buttonGroup);
        configPanel.appendChild(configForm);
        container.appendChild(configPanel);

        // 配置面板按钮事件
        startButton.addEventListener('click', () => {
            const strategy = configPanel.dataset.strategy;
            const retryCount = parseInt(retryInput.value);
            const sleepTime = parseInt(sleepInput.value);
            const tradingPair = pairSelect.value;

            // 验证输入
            if (isNaN(retryCount) || retryCount < 1 || retryCount > 99) {
                updateStatus('错误：重试次数必须在1-99之间');
                return;
            }

            if (isNaN(sleepTime) || sleepTime < 10 || sleepTime > 3600) {
                updateStatus('错误：休眠时间必须在10-3600秒之间');
                return;
            }

            // 隐藏配置面板
            configPanel.style.display = 'none';

            // 启动策略
            startStrategyWithConfig(strategy, {
                retryCount: retryCount,
                sleepTime: sleepTime,
                tradingPair: tradingPair
            });
        });

        cancelButton.addEventListener('click', () => {
            configPanel.style.display = 'none';
            updateStatus('已取消配置');
        });

        // 添加到页面
        document.body.appendChild(container);

        // 实现拖动功能
        let isDragging = false;
        let dragStartX, dragStartY;
        let initialButtonTop, initialButtonLeft;

        // 控制按钮拖动事件
        controlButton.addEventListener('mousedown', function(e) {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            const rect = controlButton.getBoundingClientRect();
            initialButtonTop = rect.top;
            initialButtonLeft = rect.left;

            controlButton.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            const newTop = initialButtonTop + deltaY;
            const newLeft = initialButtonLeft + deltaX;

            // 限制在窗口内
            const maxTop = window.innerHeight - controlButton.offsetHeight;
            const maxLeft = window.innerWidth - controlButton.offsetWidth;

            controlButton.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
            controlButton.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            controlButton.style.right = 'auto'; // 取消right定位

            // 同时移动面板，保持相对位置
            container.style.top = (parseInt(controlButton.style.top) + 35) + 'px';
            container.style.left = controlButton.style.left;
            container.style.right = 'auto'; // 取消right定位
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                controlButton.style.cursor = 'move';
            }
        });

        // 点击按钮展开/收起面板
        let isPanelVisible = false;
        controlButton.addEventListener('click', function(e) {
            // 如果刚刚结束拖动，不触发点击事件
            if (isDragging) return;

            isPanelVisible = !isPanelVisible;
            if (isPanelVisible) {
                container.style.display = 'block';
                controlButton.style.backgroundColor = 'rgba(240, 192, 64, 0.8)';
            } else {
                container.style.display = 'none';
                controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }
        });

        // 添加控制按钮到页面
        document.body.appendChild(controlButton);

        // 返回创建的元素，以便后续操作
        return {
            container,
            statusDiv,
            controlButton,
            configPanel
        };
    }

    // ==================== 策略配置启动 ====================
    // 显示配置面板
    function showConfigPanel(strategy) {
        const configPanel = document.getElementById('trading-config-panel');
        if (!configPanel) {
            updateStatus('错误：配置面板未初始化');
            return;
        }

        // 设置当前策略
        configPanel.dataset.strategy = strategy;

        // 显示配置面板
        configPanel.style.display = 'block';

        // 更新状态
        updateStatus(`配置 ${getStrategyDisplayName(strategy)} 策略...`);
    }

    // 获取策略显示名称
    function getStrategyDisplayName(strategy) {
        switch(strategy) {
            case 'longLighter': return 'Long Lighter';
            case 'longVar': return 'Long Var';
            case 'shortLighter': return 'Short Lighter';
            case 'shortVar': return 'Short Var';
            default: return '未知策略';
        }
    }

    // 根据配置启动策略
    function startStrategyWithConfig(strategy, config) {
        // 保存当前配置到全局变量，供策略函数使用
        currentConfig = config;

        // 切换到指定的交易对
        switchToTradingPair(config.tradingPair);

        switch(strategy) {
            case 'longLighter':
                startLongLighter();
                break;
            case 'longVar':
                startLongVar();
                break;
            case 'shortLighter':
                startShortLighter();
                break;
            case 'shortVar':
                startShortVar();
                break;
            default:
                updateStatus('未知的策略类型');
        }
    }

    // 切换到指定的交易对
    function switchToTradingPair(tradingPair) {
        try {
            updateStatus(`正在切换到 ${tradingPair} 交易对...`);

            // 尝试找到交易对输入框
            const searchInput = document.querySelector('input[placeholder="搜索交易对"]') ||
                document.querySelector('input[placeholder="Search"]') ||
                document.querySelector('input[placeholder*="交易对"]') ||
                document.querySelector('input[placeholder*="交易"]') ||
                document.querySelector('input[type="search"]') ||
                document.querySelector('.input-wrapper input');

            if (searchInput) {
                // 清空输入框
                searchInput.value = '';
                searchInput.focus();

                // 输入交易对
                searchInput.value = tradingPair;

                // 触发输入事件
                const inputEvent = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(inputEvent);

                // 等待一下让搜索结果出现
                setTimeout(() => {
                    // 尝试点击搜索结果中的第一个匹配项
                    const searchResults = document.querySelectorAll('[class*="symbol"], [class*="pair"], [class*="item"]');
                    let found = false;

                    for (const item of searchResults) {
                        if (item.textContent.includes(tradingPair)) {
                            item.click();
                            found = true;
                            updateStatus(`已切换到 ${tradingPair} 交易对`);
                            break;
                        }
                    }

                    if (!found) {
                        // 如果没找到搜索结果，尝试按回车
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true
                        });
                        searchInput.dispatchEvent(enterEvent);
                        updateStatus(`已尝试切换到 ${tradingPair} 交易对`);
                    }
                }, 500);
            } else {
                updateStatus(`未找到交易对搜索框，请手动切换到 ${tradingPair}`);
            }
        } catch (error) {
            console.error('切换交易对时出错:', error);
            updateStatus(`切换交易对失败: ${error.message}`);
        }
    }

    // 更新状态显示
    function updateStatus(message) {
        const statusDiv = document.getElementById('trading-status');
        if (statusDiv) {
            const time = formatTime(new Date());
            statusDiv.textContent = `[${time}] ${message}`;
        }

        // 同时更新控制按钮文本
        const controlButton = document.getElementById('trading-tool-control-btn');
        if (controlButton) {
            // 如果消息包含策略名称，更新按钮文本
            if (message.includes('Long Lighter')) {
                controlButton.textContent = 'Long Lighter';
            } else if (message.includes('Long Var')) {
                controlButton.textContent = 'Long Var';
            } else if (message.includes('Short Lighter')) {
                controlButton.textContent = 'Short Lighter';
            } else if (message.includes('Short Var')) {
                controlButton.textContent = 'Short Var';
            } else if (message.includes('已停止')) {
                controlButton.textContent = '交易工具';
            }
        }
    }

    // ==================== 脚本控制 ====================
    let currentScript = null;
    let isRunning = false;
    let currentConfig = null; // 存储当前策略配置

    // 停止所有脚本
    function stopAllScripts() {
        if (currentScript) {
            currentScript.isRunning = false;
            currentScript = null;
        }
        isRunning = false;

        // 重置所有按钮状态
        const buttons = document.querySelectorAll('#trading-tool-container button');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    // 设置当前运行中的按钮状态
    function setActiveButton(buttonId) {
        const buttons = document.querySelectorAll('#trading-tool-container button');
        buttons.forEach(btn => {
            if (btn.id === buttonId) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    }

    // ==================== 交易功能 ====================
    // 查找按钮函数
    function findButton(text, className) {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
            btn.textContent.includes(text) &&
            (!className || btn.className.includes(className))
        );
    }

    // 查找并点击开多仓按钮 (lighter版本)
    function clickLongButtonLighter() {
        const longBtn = findButton('买入 / 做多', 'text-gray-0');
        if (longBtn) {
            longBtn.click();
            console.log('已点击开多仓按钮');
            return true;
        }
        return false;
    }

    // 查找并点击开空仓按钮 (lighter版本)
    function clickShortButtonLighter() {
        const shortBtn = findButton('卖出 / 做空', 'text-gray-0');
        if (shortBtn) {
            shortBtn.click();
            console.log('已点击开空仓按钮');
            return true;
        }
        return false;
    }

    // 查找并点击提交按钮 (lighter版本)
    function clickSubmitButtonLighter(isLong) {
        const submitBtn = findButton('下达市场订单', isLong ? 'border-green-8' : 'border-red-5');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            console.log('已点击提交按钮');
            return true;
        } else if (submitBtn && submitBtn.disabled) {
            console.log('提交按钮当前不可用');
            return false;
        }
        return false;
    }

    // 查找并点击开多仓按钮 (var版本)
    function clickLongButtonVar() {
        const longButtons = Array.from(document.querySelectorAll('button'));
        const longButton = longButtons.find(btn => {
            const span = btn.querySelector('span');
            return span && span.textContent.includes('买') && btn.querySelector('svg');
        });

        if (longButton) {
            longButton.click();
            console.log('已点击开多仓按钮');
            return true;
        }
        return false;
    }

    // 查找并点击开空仓按钮 (var版本)
    function clickShortButtonVar() {
        const shortButtons = Array.from(document.querySelectorAll('button'));
        const shortButton = shortButtons.find(btn => {
            const span = btn.querySelector('span');
            return span && span.textContent.includes('卖') && btn.querySelector('svg');
        });

        if (shortButton) {
            shortButton.click();
            console.log('已点击开空仓按钮');
            return true;
        }
        return false;
    }

    // 查找并点击提交按钮 (var版本)
    function clickSubmitButtonVar() {
        const submitButtons = Array.from(document.querySelectorAll('button[data-testid="submit-button"]'));
        const submitButton = submitButtons.find(btn => {
            return btn.textContent.includes('买') || btn.textContent.includes('卖');
        });

        if (submitButton && !submitButton.disabled) {
            submitButton.click();
            console.log('已点击提交按钮');
            return true;
        } else if (submitButton && submitButton.disabled) {
            console.log('提交按钮当前不可用');
            return false;
        }
        return false;
    }

    // ==================== 交易策略 ====================
    // Long Lighter 策略
    function startLongLighter() {
        setActiveButton('long-lighter-btn');
        currentScript = {
            isRunning: true,
            iteration: 0,
            currentPosition: null
        };

        const config = {
            maxRetries: currentConfig ? currentConfig.retryCount : 5,
            retryDelay: 1000,
            sleepDuration: currentConfig ? currentConfig.sleepTime * 1000 : 100000, // 开多仓后休眠时间
            clickDelay: 500,
            maxIterations: 10000,
            enableSafetyChecks: true,
            tradingPair: currentConfig ? currentConfig.tradingPair : 'BTCUSDT'
        };

        async function openLongPosition() {
            console.log('尝试开多仓...');

            if (!clickLongButtonLighter()) {
                throw new Error('未找到做多按钮');
            }

            await sleep(config.clickDelay);

            if (!clickSubmitButtonLighter(true)) {
                throw new Error('未找到做多提交按钮或按钮不可用');
            }

            console.log('开多仓成功');
            currentScript.currentPosition = 'long';
            return true;
        }

        async function openShortPosition() {
            console.log('尝试开空仓...');

            if (!clickShortButtonLighter()) {
                throw new Error('未找到做空按钮');
            }

            await sleep(config.clickDelay);

            if (!clickSubmitButtonLighter(false)) {
                throw new Error('未找到做空提交按钮或按钮不可用');
            }

            console.log('开空仓成功');
            currentScript.currentPosition = 'short';
            return true;
        }

        async function openPositionWithRetry(positionType) {
            const openFunction = positionType === 'long' ? openLongPosition : openShortPosition;
            let lastError = null;

            for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
                try {
                    await openFunction();
                    return true;
                } catch (error) {
                    lastError = error;
                    console.error(`第${attempt}次开${positionType === 'long' ? '多' : '空'}仓失败:`, error.message);

                    if (attempt < config.maxRetries) {
                        console.log(`等待${config.retryDelay/1000}秒后重试...`);
                        await sleep(config.retryDelay);
                    }
                }
            }

            console.error(`开${positionType === 'long' ? '多' : '空'}仓失败，已达到最大重试次数`);
            throw lastError;
        }

        async function executeTradingCycle() {
            currentScript.iteration++;
            const now = new Date();
            const currentTime = formatTime(now);

            if (config.enableSafetyChecks && currentScript.iteration > config.maxIterations) {
                console.error(`达到最大迭代次数 ${config.maxIterations}，停止脚本`);
                currentScript.isRunning = false;
                updateStatus(`达到最大迭代次数，脚本已停止`);
                return;
            }

            try {
                updateStatus(`第${currentScript.iteration}次执行 - 开多仓`);
                await openPositionWithRetry('long');

                updateStatus(`开多仓成功，开始休眠${config.sleepDuration/1000}秒...`);
                await sleep(config.sleepDuration);

                updateStatus(`休眠结束，开空仓`);
                await openPositionWithRetry('short');

                updateStatus(`交易周期完成`);
            } catch (error) {
                console.error(`[${currentTime}] 交易周期执行失败:`, error);
                updateStatus(`交易失败: ${error.message}`);
            }
        }

        async function mainLoop() {
            console.log('Long Lighter 策略开始运行...');
            updateStatus('Long Lighter 策略已启动');

            while (currentScript.isRunning) {
                const now = new Date();

                const nextMinute = new Date(now);
                nextMinute.setMinutes(nextMinute.getMinutes() + 1);
                nextMinute.setSeconds(0);
                nextMinute.setMilliseconds(0);

                const waitTime = nextMinute.getTime() - Date.now();

                if (waitTime > 0) {
                    updateStatus(`等待下一分钟整点，剩余 ${Math.round(waitTime/1000)} 秒`);
                    await sleep(waitTime);
                }

                if (currentScript.isRunning) {
                    await executeTradingCycle();
                }
            }

            updateStatus('Long Lighter 策略已停止');
        }

        mainLoop().catch(error => {
            console.error('Long Lighter 脚本运行出错:', error);
            updateStatus(`脚本出错: ${error.message}`);
        });
    }

    // Long Var 策略
    function startLongVar() {
        setActiveButton('long-var-btn');
        currentScript = {
            isRunning: true,
            iteration: 0
        };

        const config = {
            sleepAfterLong: currentConfig ? currentConfig.sleepTime * 1000 : 100000, // 开多仓后休眠时间
            waitBeforeRetry: 1000,
            uiUpdateDelay: 500,
            longMaxRetries: currentConfig ? currentConfig.retryCount : 5,
            shortMaxRetries: currentConfig ? currentConfig.retryCount : 5,
            tradingPair: currentConfig ? currentConfig.tradingPair : 'BTCUSDT'
        };

        async function openLongPosition() {
            let retryCount = 0;

            while (retryCount < config.longMaxRetries) {
                console.log(`开始执行开多仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

                if (!clickLongButtonVar()) {
                    console.log('未找到开多仓按钮');
                    retryCount++;
                    if (retryCount < config.longMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开多仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                await sleep(config.uiUpdateDelay);

                if (!clickSubmitButtonVar()) {
                    console.log('开多仓提交失败');
                    retryCount++;
                    if (retryCount < config.longMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开多仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                console.log('开多仓操作完成');
                return true;
            }

            console.log(`开多仓操作失败，已达到最大重试次数${config.longMaxRetries}次`);
            return false;
        }

        async function openShortPosition() {
            let retryCount = 0;

            while (retryCount < config.shortMaxRetries) {
                console.log(`开始执行开空仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

                if (!clickShortButtonVar()) {
                    console.log('未找到开空仓按钮');
                    retryCount++;
                    if (retryCount < config.shortMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开空仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                await sleep(config.uiUpdateDelay);

                if (!clickSubmitButtonVar()) {
                    console.log('开空仓提交失败');
                    retryCount++;
                    if (retryCount < config.shortMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开空仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                console.log('开空仓操作完成');
                return true;
            }

            console.log(`开空仓操作失败，已达到最大重试次数${config.shortMaxRetries}次`);
            return false;
        }

        async function mainLoop() {
            console.log('Long Var 策略开始运行...');
            updateStatus('Long Var 策略已启动');

            while (currentScript.isRunning) {
                currentScript.iteration++;

                const now = new Date();
                const nextMinute = new Date(now);
                nextMinute.setMinutes(nextMinute.getMinutes() + 1);
                nextMinute.setSeconds(0);
                nextMinute.setMilliseconds(0);

                const waitTime = nextMinute.getTime() - now.getTime();

                if (waitTime > 0) {
                    updateStatus(`等待整点开多仓，剩余 ${Math.round(waitTime/1000)} 秒`);
                    await sleep(waitTime);
                }

                if (!currentScript.isRunning) break;

                const exactTime = new Date();
                const currentTime = formatTime(exactTime);

                updateStatus(`第${currentScript.iteration}次执行 - 开多仓`);

                const longSuccess = await openLongPosition();

                if (longSuccess) {
                    updateStatus(`开多仓成功`);
                } else {
                    updateStatus(`开多仓失败，继续执行休眠流程`);
                }

                updateStatus(`开始休眠${config.sleepAfterLong/1000}秒...`);
                await sleep(config.sleepAfterLong);

                if (!currentScript.isRunning) break;

                const afterSleep = new Date();
                updateStatus(`休眠结束，准备开空仓`);

                const shortSuccess = await openShortPosition();

                if (shortSuccess) {
                    updateStatus(`开空仓成功`);
                } else {
                    updateStatus(`开空仓失败，继续下一轮循环`);
                }
            }

            updateStatus('Long Var 策略已停止');
        }

        mainLoop().catch(error => {
            console.error('Long Var 脚本运行出错:', error);
            updateStatus(`脚本出错: ${error.message}`);
        });
    }

    // Short Lighter 策略
    function startShortLighter() {
        setActiveButton('short-lighter-btn');
        currentScript = {
            isRunning: true,
            iteration: 0,
            currentPosition: null
        };

        const config = {
            maxRetries: currentConfig ? currentConfig.retryCount : 5,
            retryDelay: 1000,
            sleepDuration: currentConfig ? currentConfig.sleepTime * 1000 : 100000, // 开空仓后休眠时间
            clickDelay: 500,
            maxIterations: 10000,
            enableSafetyChecks: true,
            tradingPair: currentConfig ? currentConfig.tradingPair : 'BTCUSDT'
        };

        async function openLongPosition() {
            console.log('尝试开多仓...');

            if (!clickLongButtonLighter()) {
                throw new Error('未找到做多按钮');
            }

            await sleep(config.clickDelay);

            if (!clickSubmitButtonLighter(true)) {
                throw new Error('未找到做多提交按钮或按钮不可用');
            }

            console.log('开多仓成功');
            currentScript.currentPosition = 'long';
            return true;
        }

        async function openShortPosition() {
            console.log('尝试开空仓...');

            if (!clickShortButtonLighter()) {
                throw new Error('未找到做空按钮');
            }

            await sleep(config.clickDelay);

            if (!clickSubmitButtonLighter(false)) {
                throw new Error('未找到做空提交按钮或按钮不可用');
            }

            console.log('开空仓成功');
            currentScript.currentPosition = 'short';
            return true;
        }

        async function openPositionWithRetry(positionType) {
            const openFunction = positionType === 'long' ? openLongPosition : openShortPosition;
            let lastError = null;

            for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
                try {
                    await openFunction();
                    return true;
                } catch (error) {
                    lastError = error;
                    console.error(`第${attempt}次开${positionType === 'long' ? '多' : '空'}仓失败:`, error.message);

                    if (attempt < config.maxRetries) {
                        console.log(`等待${config.retryDelay/1000}秒后重试...`);
                        await sleep(config.retryDelay);
                    }
                }
            }

            console.error(`开${positionType === 'long' ? '多' : '空'}仓失败，已达到最大重试次数`);
            throw lastError;
        }

        async function executeTradingCycle() {
            currentScript.iteration++;
            const now = new Date();
            const currentTime = formatTime(now);

            if (config.enableSafetyChecks && currentScript.iteration > config.maxIterations) {
                console.error(`达到最大迭代次数 ${config.maxIterations}，停止脚本`);
                currentScript.isRunning = false;
                updateStatus(`达到最大迭代次数，脚本已停止`);
                return;
            }

            try {
                updateStatus(`第${currentScript.iteration}次执行 - 开空仓`);
                await openPositionWithRetry('short');

                updateStatus(`开空仓成功，开始休眠${config.sleepDuration/1000}秒...`);
                await sleep(config.sleepDuration);

                updateStatus(`休眠结束，开多仓`);
                await openPositionWithRetry('long');

                updateStatus(`交易周期完成`);
            } catch (error) {
                console.error(`[${currentTime}] 交易周期执行失败:`, error);
                updateStatus(`交易失败: ${error.message}`);
            }
        }

        async function mainLoop() {
            console.log('Short Lighter 策略开始运行...');
            updateStatus('Short Lighter 策略已启动');

            while (currentScript.isRunning) {
                const now = new Date();

                const nextMinute = new Date(now);
                nextMinute.setMinutes(nextMinute.getMinutes() + 1);
                nextMinute.setSeconds(0);
                nextMinute.setMilliseconds(0);

                const waitTime = nextMinute.getTime() - Date.now();

                if (waitTime > 0) {
                    updateStatus(`等待下一分钟整点，剩余 ${Math.round(waitTime/1000)} 秒`);
                    await sleep(waitTime);
                }

                if (currentScript.isRunning) {
                    await executeTradingCycle();
                }
            }

            updateStatus('Short Lighter 策略已停止');
        }

        mainLoop().catch(error => {
            console.error('Short Lighter 脚本运行出错:', error);
            updateStatus(`脚本出错: ${error.message}`);
        });
    }

    // Short Var 策略
    function startShortVar() {
        setActiveButton('short-var-btn');
        currentScript = {
            isRunning: true,
            iteration: 0
        };

        const config = {
            sleepAfterShort: currentConfig ? currentConfig.sleepTime * 1000 : 100000, // 开空仓后休眠时间
            waitBeforeRetry: 1000,
            uiUpdateDelay: 500,
            shortMaxRetries: currentConfig ? currentConfig.retryCount : 5,
            longMaxRetries: currentConfig ? currentConfig.retryCount : 5,
            tradingPair: currentConfig ? currentConfig.tradingPair : 'BTCUSDT'
        };

        async function openShortPosition() {
            let retryCount = 0;

            while (retryCount < config.shortMaxRetries) {
                console.log(`开始执行开空仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

                if (!clickShortButtonVar()) {
                    console.log('未找到开空仓按钮');
                    retryCount++;
                    if (retryCount < config.shortMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开空仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                await sleep(config.uiUpdateDelay);

                if (!clickSubmitButtonVar()) {
                    console.log('开空仓提交失败');
                    retryCount++;
                    if (retryCount < config.shortMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开空仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                console.log('开空仓操作完成');
                return true;
            }

            console.log(`开空仓操作失败，已达到最大重试次数${config.shortMaxRetries}次`);
            return false;
        }

        async function openLongPosition() {
            let retryCount = 0;

            while (retryCount < config.longMaxRetries) {
                console.log(`开始执行开多仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

                if (!clickLongButtonVar()) {
                    console.log('未找到开多仓按钮');
                    retryCount++;
                    if (retryCount < config.longMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开多仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                await sleep(config.uiUpdateDelay);

                if (!clickSubmitButtonVar()) {
                    console.log('开多仓提交失败');
                    retryCount++;
                    if (retryCount < config.longMaxRetries) {
                        console.log(`${config.waitBeforeRetry/1000}秒后重试开多仓...`);
                        await sleep(config.waitBeforeRetry);
                    }
                    continue;
                }

                console.log('开多仓操作完成');
                return true;
            }

            console.log(`开多仓操作失败，已达到最大重试次数${config.longMaxRetries}次`);
            return false;
        }

        async function mainLoop() {
            console.log('Short Var 策略开始运行...');
            updateStatus('Short Var 策略已启动');

            while (currentScript.isRunning) {
                currentScript.iteration++;

                const now = new Date();
                const nextMinute = new Date(now);
                nextMinute.setMinutes(nextMinute.getMinutes() + 1);
                nextMinute.setSeconds(0);
                nextMinute.setMilliseconds(0);

                const waitTime = nextMinute.getTime() - now.getTime();

                if (waitTime > 0) {
                    updateStatus(`等待整点开空仓，剩余 ${Math.round(waitTime/1000)} 秒`);
                    await sleep(waitTime);
                }

                if (!currentScript.isRunning) break;

                const exactTime = new Date();
                const currentTime = formatTime(exactTime);

                updateStatus(`第${currentScript.iteration}次执行 - 开空仓`);

                const shortSuccess = await openShortPosition();

                if (shortSuccess) {
                    updateStatus(`开空仓成功`);
                } else {
                    updateStatus(`开空仓失败，继续执行休眠流程`);
                }

                updateStatus(`开始休眠${config.sleepAfterShort/1000}秒...`);
                await sleep(config.sleepAfterShort);

                if (!currentScript.isRunning) break;

                const afterSleep = new Date();
                updateStatus(`休眠结束，准备开多仓`);

                const longSuccess = await openLongPosition();

                if (longSuccess) {
                    updateStatus(`开多仓成功`);
                } else {
                    updateStatus(`开多仓失败，继续下一轮循环`);
                }
            }

            updateStatus('Short Var 策略已停止');
        }

        mainLoop().catch(error => {
            console.error('Short Var 脚本运行出错:', error);
            updateStatus(`脚本出错: ${error.message}`);
        });
    }

    // ==================== 初始化 ====================
    // 等待页面加载完成
    function init() {
        // 检查是否已经创建了UI
        if (document.getElementById('trading-tool-container') ||
            document.getElementById('trading-tool-control-btn') ||
            document.getElementById('trading-config-panel')) {
            console.log('交易工具UI已存在');
            return;
        }

        // 创建UI
        createUI();
        console.log('交易自动化工具已加载');
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露控制函数到全局
    window.stopAllTradingScripts = function() {
        stopAllScripts();
        updateStatus('所有策略已停止');
    };

    console.log('交易自动化油猴脚本已加载');
})();

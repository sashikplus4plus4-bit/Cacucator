// ========== МОДУЛЬ ВЫЧИСЛЕНИЙ ==========
const CalculatorEngine = (function() {
    function formatNumber(value) {
        if (typeof value !== 'number') return value;
        if (Math.abs(value) < 1e-10 && value !== 0) {
            return value.toFixed(10).replace(/\.?0+$/, '');
        }
        if (Number.isInteger(value)) {
            return value.toString();
        }
        return value.toLocaleString('fullwide', { 
            useGrouping: false, 
            maximumFractionDigits: 15,
            notation: 'standard'
        });
    }

    function calculateWithPrecision(expression) {
        let jsExpression = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\^/g, '**');

        try {
            const result = new Function('return ' + jsExpression)();
            if (result === undefined || isNaN(result) || !isFinite(result)) {
                throw new Error('Math error');
            }
            const rounded = Math.round(result * 1e12) / 1e12;
            return {
                success: true,
                value: rounded,
                formatted: formatNumber(rounded)
            };
        } catch (e) {
            return {
                success: false,
                error: '⚠️ Ошибка в формуле'
            };
        }
    }

    function factorial(n) {
        if (n < 0) return null;
        if (n === 0 || n === 1) return 1n;
        let result = 1n;
        for (let i = 2; i <= n; i++) result *= BigInt(i);
        return result;
    }

    function preciseSqrt(x) {
        if (x < 0) return null;
        if (x === 0) return 0;
        if (Number.isInteger(x) && x < 1e12) {
            const sqrtInt = Math.floor(Math.sqrt(x));
            if (sqrtInt * sqrtInt === x) return sqrtInt;
        }
        return Math.sqrt(x);
    }

    return { formatNumber, calculateWithPrecision, factorial, preciseSqrt };
})();

// ========== ОСНОВНАЯ ЛОГИКА ==========
(function() {
    const display = document.getElementById('display');
    const displayContainer = document.getElementById('displayContainer');
    const philosophyDiv = document.getElementById('philosophyMessage');
    const hotkeysToggle = document.getElementById('hotkeysToggle');
    const hotkeysPanel = document.getElementById('hotkeysPanel');
    const arrow = document.getElementById('arrow');
    
    let currentInput = '0';
    let justCalculated = false;
    let philosophyShown = false;
    let hotkeysExpanded = false;

    function updateDisplay(value) {
        display.value = value || '0';
        setTimeout(() => {
            displayContainer.scrollLeft = displayContainer.scrollWidth;
        }, 10);
    }

    function showPhilosophyMessage() {
        philosophyDiv.style.display = 'block';
        philosophyDiv.innerText = "Вы уверены, что вам нужно решить этот пример, или может, сами подумаете?";
        philosophyShown = true;
    }

    function hidePhilosophyMessage() {
        philosophyDiv.style.display = 'none';
        philosophyDiv.innerText = '';
        philosophyShown = false;
    }

    function triggerPhilosophy() {
        if (Math.random() < 0.1) {
            showPhilosophyMessage();
            return true;
        }
        return false;
    }

    function clearIfPhilosophyShown() {
        if (philosophyShown) {
            currentInput = '0';
            updateDisplay(currentInput);
            hidePhilosophyMessage();
            justCalculated = false;
            return true;
        }
        return false;
    }

    function addSymbol(symbol) {
        clearIfPhilosophyShown();

        if (justCalculated && !philosophyShown) {
            currentInput = '0123456789.'.includes(symbol) ? symbol : display.value + symbol;
            justCalculated = false;
        } else {
            if (currentInput === '0' && symbol !== '.' && !'+-×÷−*/'.includes(symbol)) {
                currentInput = symbol;
            } else {
                currentInput += symbol;
            }
        }
        updateDisplay(currentInput);
    }

    function applySpecialFunction(func) {
        clearIfPhilosophyShown();

        let expression = display.value;
        let numberMatch = expression.match(/(\d+\.?\d*|\.\d+)$/);
        let number = numberMatch ? parseFloat(numberMatch[0]) : parseFloat(expression);

        if (func === '√') {
            if (isNaN(number)) {
                currentInput = '⚠️ Ошибка в формуле';
                updateDisplay(currentInput);
                return;
            }
            const sqrtResult = CalculatorEngine.preciseSqrt(number);
            if (sqrtResult === null) {
                currentInput = '⚠️ Ошибка в формуле';
                updateDisplay(currentInput);
                return;
            }
            if (numberMatch) {
                currentInput = expression.slice(0, numberMatch.index) + CalculatorEngine.formatNumber(sqrtResult);
            } else {
                currentInput = CalculatorEngine.formatNumber(sqrtResult);
            }
            updateDisplay(currentInput);
            justCalculated = true;
        }
        else if (func === 'n!') {
            if (!Number.isInteger(number) || number < 0 || (numberMatch && numberMatch[0].includes('.'))) {
                currentInput = '⚠️ Ошибка в формуле';
                updateDisplay(currentInput);
                return;
            }
            const factResult = CalculatorEngine.factorial(parseInt(number, 10));
            if (factResult === null) {
                currentInput = '⚠️ Ошибка в формуле';
                updateDisplay(currentInput);
                return;
            }
            let factDisplay = factResult.toString();
            if (factResult <= Number.MAX_SAFE_INTEGER) {
                factDisplay = Number(factResult).toString();
            }
            if (numberMatch) {
                currentInput = expression.slice(0, numberMatch.index) + factDisplay;
            } else {
                currentInput = factDisplay;
            }
            updateDisplay(currentInput);
            justCalculated = true;
        }
    }

    function calculateResult() {
        if (triggerPhilosophy()) return;
        hidePhilosophyMessage();

        const result = CalculatorEngine.calculateWithPrecision(display.value);
        currentInput = result.success ? result.formatted : result.error;
        updateDisplay(currentInput);
        justCalculated = true;
    }

    function backspace() {
        if (clearIfPhilosophyShown()) return;
        currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
        updateDisplay(currentInput);
        justCalculated = false;
    }

    function clearAll() {
        currentInput = '0';
        updateDisplay(currentInput);
        hidePhilosophyMessage();
        justCalculated = false;
    }

    function insertPower() {
        clearIfPhilosophyShown();
        if (justCalculated && !philosophyShown) {
            currentInput = display.value + '^';
        } else {
            currentInput = (currentInput === '0' ? '' : currentInput) + '^';
        }
        justCalculated = false;
        updateDisplay(currentInput);
    }

    // ===== ИСПРАВЛЕННЫЙ ОБРАБОТЧИК - теперь работает на телефонах =====
    function handleButtonClick(action) {
        if (!action) return;

        if (/^[0-9.]$/.test(action)) {
            addSymbol(action);
        }
        else if (['+', '-', '*', '/', '(', ')', '×', '÷', '−'].includes(action)) {
            let op = action;
            if (op === '*') op = '×';
            if (op === '/') op = '÷';
            if (op === '-') op = '−';
            addSymbol(op);
        }
        else if (action === '√') applySpecialFunction('√');
        else if (action === 'n!') applySpecialFunction('n!');
        else if (action === 'x^y') insertPower();
        else if (action === 'C') clearAll();
        else if (action === '⌫') backspace();
        else if (action === '=') calculateResult();
    }

    // Упрощенный обработчик для всех устройств
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        // Используем только одно событие - click, оно работает везде
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = this.getAttribute('data-action');
            handleButtonClick(action);
            
            // Визуальная обратная связь через CSS :active
            // Не нужно добавлять inline-стили
        });
        
        // Для touch-устройств отключаем стандартное выделение
        button.addEventListener('touchstart', function(e) {
            // Не отменяем событие полностью, чтобы click сработал
            // Просто предотвращаем всплытие, если нужно
            e.stopPropagation();
        }, { passive: true });
    });

    // Клавиатурный ввод
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.altKey || e.ctrlKey || e.metaKey) return;

        if (/^[0-9]$/.test(key)) { e.preventDefault(); addSymbol(key); }
        else if (key === '.') { e.preventDefault(); addSymbol('.'); }
        else if (key === '+') { e.preventDefault(); addSymbol('+'); }
        else if (key === '-') { e.preventDefault(); addSymbol('−'); }
        else if (key === '*') { e.preventDefault(); addSymbol('×'); }
        else if (key === '/') { e.preventDefault(); addSymbol('÷'); }
        else if (key === '(') { e.preventDefault(); addSymbol('('); }
        else if (key === ')') { e.preventDefault(); addSymbol(')'); }
        else if (key === '^') { e.preventDefault(); insertPower(); }
        else if (key === '!') { e.preventDefault(); applySpecialFunction('n!'); }
        else if (key.toLowerCase() === 'r') { e.preventDefault(); applySpecialFunction('√'); }
        else if (key === 'Enter' || key === '=') { e.preventDefault(); calculateResult(); }
        else if (key === 'Escape') { e.preventDefault(); clearAll(); }
        else if (key === 'Backspace') { e.preventDefault(); backspace(); }
    });

    // Вставка из буфера
    displayContainer.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        clearIfPhilosophyShown();
        const validChars = text.replace(/[^0-9+\-*/().^!×÷√]/g, '');
        if (validChars) {
            currentInput = justCalculated ? validChars : (currentInput === '0' ? '' : currentInput) + validChars;
            justCalculated = false;
            updateDisplay(currentInput);
        }
    });

    hotkeysToggle.addEventListener('click', () => {
        hotkeysExpanded = !hotkeysExpanded;
        hotkeysPanel.classList.toggle('expanded', hotkeysExpanded);
        arrow.classList.toggle('expanded', hotkeysExpanded);
    });

    clearAll();
})();
// Funções Matemáticas
const calculateMod = (score) => Math.floor((score - 10) / 2);
const calculateProficiency = (level) => Math.ceil(level / 4) + 1;

// Gerenciador de Bolinhas de Foco/Adrenalina
function renderFocus(containerId, maxId, storageKey) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(maxId);
    if (!container || !input) return;

    const maxVal = parseInt(input.value) || 0;
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    container.innerHTML = '';
    for (let i = 0; i < maxVal; i++) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'focus-checkbox';
        cb.checked = saved[i] || false;
        cb.addEventListener('change', () => {
            const current = Array.from(container.querySelectorAll('input')).map(c => c.checked);
            localStorage.setItem(storageKey, JSON.stringify(current));
        });
        container.appendChild(cb);
    }
}

// Atualização Principal da Ficha
function updateSheet() {
    const level = parseInt(document.getElementById('levelField').value) || 1;
    const profBonus = calculateProficiency(level);
    document.getElementById('profBonusField').value = `+${profBonus}`;

    const mods = {};

    // 1. Atributos e Modificadores
    document.querySelectorAll('.stat-mini input').forEach(input => {
        const stat = input.dataset.stat;
        const val = parseInt(input.value) || 10;
        const mod = calculateMod(val);
        mods[stat] = mod;
        const el = document.getElementById(`mod-${stat}`);
        if(el) el.textContent = mod >= 0 ? `+${mod}` : mod;
    });

    // 2. CA e Iniciativa
    const dexMod = mods['Des'] || 0;
    document.getElementById('initField').value = dexMod >= 0 ? `+${dexMod}` : dexMod;
    document.getElementById('caField').value = 10 + dexMod;

    // 3. Vitalidade e Sanidade (17 + Modificador)
    document.getElementById('hpMaxField').value = 17 + (mods['Con'] || 0);
    document.getElementById('sanMaxField').value = 17 + (mods['Ocu'] || 0);

    // 4. Perícias e Resistências
    document.querySelectorAll('.mod-val').forEach(span => {
        const statBase = span.dataset.base;
        const profCheck = span.parentElement.querySelector('input[type="checkbox"]');
        const isProficient = profCheck ? profCheck.checked : false;
        const baseMod = mods[statBase] || 0;
        const finalVal = baseMod + (isProficient ? profBonus : 0);
        span.textContent = finalVal >= 0 ? `+${finalVal}` : finalVal;
    });

    // 5. Atualizar Focos
    renderFocus('containerFocusCombate', 'maxFocusCombate', 'save_focus_combat');
    renderFocus('containerFocusDiario', 'maxFocusDiario', 'save_focus_daily');
}

// Sistema de Salvamento Local
const SAVE_KEY_PREFIX = 'horror_v10_save_';

function saveAll() {
    const allInputs = document.querySelectorAll('input, textarea');
    allInputs.forEach((el, i) => {
        if (!el.readOnly && el.id !== 'importFile') {
            const val = el.type === 'checkbox' ? el.checked : el.value;
            localStorage.setItem(SAVE_KEY_PREFIX + i, val);
        }
    });
}

function loadAll() {
    const allInputs = document.querySelectorAll('input, textarea');
    allInputs.forEach((el, i) => {
        const saved = localStorage.getItem(SAVE_KEY_PREFIX + i);
        if (saved !== null) {
            if (el.type === 'checkbox') el.checked = (saved === 'true');
            else el.value = saved;
        }
    });
    updateSheet();
}

// Exportação e Importação de Arquivos
function exportarFicha() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(SAVE_KEY_PREFIX)) {
            dados[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(dados)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ficha_investigador.json';
    a.click();
}

function importarFicha(input) {
    const reader = new FileReader();
    reader.onload = function() {
        try {
            const dados = JSON.parse(reader.result);
            for (const key in dados) {
                localStorage.setItem(key, dados[key]);
            }
            location.reload();
        } catch(e) {
            alert("Erro ao ler o arquivo da ficha.");
        }
    };
    reader.readAsText(input.files[0]);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAll();
    document.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => {
            updateSheet();
            saveAll();
        });
    });
});

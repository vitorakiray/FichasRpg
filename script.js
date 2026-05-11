// Funções Matemáticas
function calculateMod(score) { return Math.floor((score - 10) / 2); }
function calculateProficiency(level) { return Math.ceil(level / 4) + 1; }

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

    // 1. Atualizar Atributos
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

    // 3. Vitalidade e Sanidade (Base 17 + Mod)
    const conMod = mods['Con'] || 0;
    const ocuMod = mods['Ocu'] || 0;
    document.getElementById('hpMaxField').value = 17 + conMod;
    document.getElementById('sanMaxField').value = 17 + ocuMod;

    // 4. Perícias e Resistências (.mod-val)
    document.querySelectorAll('.mod-val').forEach(span => {
        const statBase = span.dataset.base;
        const profCheck = span.parentElement.querySelector('input[type="checkbox"]');
        const isProficient = profCheck ? profCheck.checked : false;
        const baseMod = mods[statBase] || 0;
        const finalVal = baseMod + (isProficient ? profBonus : 0);
        span.textContent = finalVal >= 0 ? `+${finalVal}` : finalVal;
    });

    renderFocus('containerFocusCombate', 'maxFocusCombate', 'horror_focus_combat');
    renderFocus('containerFocusDiario', 'maxFocusDiario', 'horror_focus_daily');
}

// Sistema de Salvamento
const ALL_INPUTS = document.querySelectorAll('input, textarea');

function save() {
    ALL_INPUTS.forEach((el, i) => {
        if (!el.readOnly && el.id !== 'importFile') {
            localStorage.setItem('horror_v10_save_' + i, el.type === 'checkbox' ? el.checked : el.value);
        }
    });
}

function load() {
    ALL_INPUTS.forEach((el, i) => {
        const saved = localStorage.getItem('horror_v10_save_' + i);
        if (saved !== null) {
            if (el.type === 'checkbox') el.checked = (saved === 'true');
            else el.value = saved;
        }
    });
    updateSheet();
}

// Exportar e Importar
function exportarFicha() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('horror_v10_save_')) {
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
            alert("Erro ao ler arquivo da ficha.");
        }
    };
    reader.readAsText(input.files[0]);
}

// Gatilhos
ALL_INPUTS.forEach(el => el.addEventListener('input', () => { updateSheet(); save(); }));
window.onload = load;

function calculateMod(score) {
    return Math.floor((score - 10) / 2);
}

function calculateProficiency(level) {
    return Math.ceil(level / 4) + 1;
}

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
    const dex = mods['Des'] || 0;
    document.getElementById('initField').value = dex >= 0 ? `+${dex}` : dex;
    document.getElementById('caField').value = 10 + dex;

    // 3. Vitalidade e Sanidade (Base 17 + Mod)
    const conMod = mods['Con'] || 0;
    const ocuMod = mods['Ocu'] || 0;
    document.getElementById('hpMaxField').value = 17 + conMod;
    document.getElementById('sanMaxField').value = 17 + ocuMod;

    // 4. Atualizar todas as perícias e resistências (.mod-val)
    document.querySelectorAll('.mod-val').forEach(span => {
        const stat = span.dataset.base;
        const profCheck = span.parentElement.querySelector('input[type="checkbox"]');
        const isProficient = profCheck ? profCheck.checked : false;
        const baseMod = mods[stat] || 0;
        const finalVal = baseMod + (isProficient ? profBonus : 0);
        span.textContent = finalVal >= 0 ? `+${finalVal}` : finalVal;
    });

    renderFocus('containerFocusCombate', 'maxFocusCombate', 'save_f_combate');
    renderFocus('containerFocusDiario', 'maxFocusDiario', 'save_f_diario');
}

// Persistência
const inputs = document.querySelectorAll('input, textarea');

function save() {
    inputs.forEach((el, i) => {
        if (!el.readOnly && el.id !== 'importFile') {
            localStorage.setItem('horror_final_v10_' + i, el.type === 'checkbox' ? el.checked : el.value);
        }
    });
}

function load() {
    inputs.forEach((el, i) => {
        const saved = localStorage.getItem('horror_final_v10_' + i);
        if (saved !== null) {
            if (el.type === 'checkbox') el.checked = (saved === 'true');
            else el.value = saved;
        }
    });
    updateSheet();
}

// Funções de Arquivo
function exportarFicha() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave.startsWith('horror_final_v10_')) {
            dados[chave] = localStorage.getItem(chave);
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
        const dados = JSON.parse(reader.result);
        for (const chave in dados) {
            localStorage.setItem(chave, dados[chave]);
        }
        location.reload();
    };
    reader.readAsText(input.files[0]);
}

inputs.forEach(el => el.addEventListener('input', () => { updateSheet(); save(); }));
window.onload = load;

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
    // 1. Proficiência por Nível
    const level = parseInt(document.getElementById('levelField').value) || 1;
    const profBonus = calculateProficiency(level);
    document.getElementById('profBonusField').value = `+${profBonus}`;

    const mods = {};

    // 2. Modificadores de Atributos
    document.querySelectorAll('.stat-mini input').forEach(input => {
        const stat = input.dataset.stat;
        const val = parseInt(input.value) || 10;
        const mod = calculateMod(val);
        mods[stat] = mod;
        const el = document.getElementById(`mod-${stat}`);
        if(el) el.textContent = mod >= 0 ? `+${mod}` : mod;
    });

    // 3. CA e Iniciativa
    const dex = mods['Des'] || 0;
    document.getElementById('initField').value = dex >= 0 ? `+${dex}` : dex;
    document.getElementById('caField').value = 10 + dex;

    // 4. Vida e Sanidade (Fórmula Simplificada: 17 + Modificador)
    const conMod = mods['Con'] || 0;
    const ocuMod = mods['Ocu'] || 0;
    
    document.getElementById('hpMaxField').value = 17 + conMod;
    document.getElementById('sanMaxField').value = 17 + ocuMod;

    // 5. Perícias e Resistências
    document.querySelectorAll('.mod-val').forEach(span => {
        const stat = span.dataset.base;
        const profCheck = span.parentElement.querySelector('input[type="checkbox"]');
        const isProficient = profCheck ? profCheck.checked : false;
        const baseMod = mods[stat] || 0;
        const finalVal = baseMod + (isProficient ? profBonus : 0);
        span.textContent = finalVal >= 0 ? `+${finalVal}` : finalVal;
    });

    // 6. Focos
    renderFocus('containerFocusCombate', 'maxFocusCombate', 'horror_focus_c');
    renderFocus('containerFocusDiario', 'maxFocusDiario', 'horror_focus_d');
}

// Persistência de Dados
const inputs = document.querySelectorAll('input, textarea');

function save() {
    inputs.forEach((el, i) => {
        if (!el.readOnly) {
            localStorage.setItem('horror_v9_save_' + i, el.type === 'checkbox' ? el.checked : el.value);
        }
    });
}

function load() {
    inputs.forEach((el, i) => {
        const saved = localStorage.getItem('horror_v9_save_' + i);
        if (saved !== null) {
            if (el.type === 'checkbox') el.checked = (saved === 'true');
            else el.value = saved;
        }
    });
    updateSheet();
}

inputs.forEach(el => el.addEventListener('input', () => { updateSheet(); save(); }));
window.onload = load;

const CLAU_STORAGE = 'tasquesKanban';

const nomsEstat = {
  perFer: 'Per fer',
  enCurs: 'En curs',
  fet: 'Fet'
};

const formulari = document.querySelector('#formulariTasca');
const inputId = document.querySelector('#tascaId');
const inputTitol = document.querySelector('#titol');
const inputDescripcio = document.querySelector('#descripcio');
const inputPrioritat = document.querySelector('#prioritat');
const inputData = document.querySelector('#dataVenciment');
const inputEstat = document.querySelector('#estat');
const errorTitol = document.querySelector('#errorTitol');
const btnEnviar = document.querySelector('#btnEnviar');
const btnCancelar = document.querySelector('#btnCancelar');
const btnNetejar = document.querySelector('#btnNetejar');

const cerca = document.querySelector('#cerca');
const filtreEstat = document.querySelector('#filtreEstat');
const filtrePrioritat = document.querySelector('#filtrePrioritat');
const btnRestablirFiltres = document.querySelector('#btnRestablirFiltres');

const columnes = {
  perFer: document.querySelector('#columnaPerFer'),
  enCurs: document.querySelector('#columnaEnCurs'),
  fet: document.querySelector('#columnaFet')
};

let tasques = carregarTasques();

function carregarTasques() {
  const dades = localStorage.getItem(CLAU_STORAGE);
  if (!dades) return [];

  try {
    return JSON.parse(dades);
  } catch (error) {
    console.error('Error carregant les tasques:', error);
    return [];
  }
}

function guardarTasques() {
  localStorage.setItem(CLAU_STORAGE, JSON.stringify(tasques));
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function validarFormulari() {
  const titol = inputTitol.value.trim();
  errorTitol.textContent = '';

  if (!titol) {
    errorTitol.textContent = 'El títol és obligatori.';
    inputTitol.focus();
    return false;
  }

  return true;
}

function obtenirDadesFormulari() {
  return {
    titol: inputTitol.value.trim(),
    descripcio: inputDescripcio.value.trim(),
    prioritat: inputPrioritat.value,
    dataVenciment: inputData.value,
    estat: inputEstat.value
  };
}

function crearTasca(dades) {
  tasques.push({
    id: generarId(),
    ...dades,
    creatEl: new Date().toISOString()
  });
}

function actualitzarTasca(id, dades) {
  tasques = tasques.map((tasca) => tasca.id === id ? { ...tasca, ...dades } : tasca);
}

function eliminarTasca(id) {
  const confirma = confirm('Segur que vols eliminar aquesta tasca?');
  if (!confirma) return;

  tasques = tasques.filter((tasca) => tasca.id !== id);
  guardarTasques();
  renderitzarAplicacio();
}

function editarTasca(id) {
  const tasca = tasques.find((item) => item.id === id);
  if (!tasca) return;

  inputId.value = tasca.id;
  inputTitol.value = tasca.titol;
  inputDescripcio.value = tasca.descripcio;
  inputPrioritat.value = tasca.prioritat;
  inputData.value = tasca.dataVenciment;
  inputEstat.value = tasca.estat;

  document.querySelector('#titolFormulari').textContent = 'Editar tasca';
  btnEnviar.textContent = 'Guardar canvis';
  btnCancelar.classList.remove('ocult');
  inputTitol.focus();
}

function canviarEstat(id, nouEstat) {
  tasques = tasques.map((tasca) => tasca.id === id ? { ...tasca, estat: nouEstat } : tasca);
  guardarTasques();
  renderitzarAplicacio();
}

function reiniciarFormulari() {
  formulari.reset();
  inputId.value = '';
  errorTitol.textContent = '';
  document.querySelector('#titolFormulari').textContent = 'Nova tasca';
  btnEnviar.textContent = 'Afegir tasca';
  btnCancelar.classList.add('ocult');
  inputPrioritat.value = 'mitjana';
  inputEstat.value = 'perFer';
}

function obtenirFiltres() {
  return {
    text: cerca.value.trim().toLowerCase(),
    estat: filtreEstat.value,
    prioritat: filtrePrioritat.value
  };
}

function getTasquesFiltrades(llistaTasques, filtres) {
  return llistaTasques.filter((tasca) => {
    const coincideixText = !filtres.text ||
      tasca.titol.toLowerCase().includes(filtres.text) ||
      tasca.descripcio.toLowerCase().includes(filtres.text);

    const coincideixEstat = filtres.estat === 'tots' || tasca.estat === filtres.estat;
    const coincideixPrioritat = filtres.prioritat === 'totes' || tasca.prioritat === filtres.prioritat;

    return coincideixText && coincideixEstat && coincideixPrioritat;
  });
}

function formatarData(data) {
  if (!data) return 'Sense data límit';
  const [any, mes, dia] = data.split('-');
  return `${dia}/${mes}/${any}`;
}

function crearTargetaTasca(tasca) {
  const article = document.createElement('article');
  article.className = `tasca prioritat-${tasca.prioritat}`;

  article.innerHTML = `
    <h3>${escaparHTML(tasca.titol)}</h3>
    <p>${escaparHTML(tasca.descripcio || 'Sense descripció.')}</p>
    <div class="meta-tasca">
      <span class="xapa ${tasca.prioritat}">${tasca.prioritat}</span>
      <span class="xapa">${formatarData(tasca.dataVenciment)}</span>
    </div>
    <label class="selector-estat">
      Estat
      <select data-accio="estat" data-id="${tasca.id}">
        <option value="perFer" ${tasca.estat === 'perFer' ? 'selected' : ''}>Per fer</option>
        <option value="enCurs" ${tasca.estat === 'enCurs' ? 'selected' : ''}>En curs</option>
        <option value="fet" ${tasca.estat === 'fet' ? 'selected' : ''}>Fet</option>
      </select>
    </label>
    <div class="accions-tasca">
      <button class="boto boto-secundari" type="button" data-accio="editar" data-id="${tasca.id}">Editar</button>
      <button class="boto boto-perill" type="button" data-accio="eliminar" data-id="${tasca.id}">Eliminar</button>
    </div>
  `;

  return article;
}

function escaparHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTauler(tasquesVisibles) {
  Object.values(columnes).forEach((columna) => {
    columna.innerHTML = '';
  });

  Object.keys(columnes).forEach((estat) => {
    const tasquesColumna = tasquesVisibles.filter((tasca) => tasca.estat === estat);

    if (tasquesColumna.length === 0) {
      const buit = document.createElement('div');
      buit.className = 'buit';
      buit.textContent = 'No hi ha tasques en aquesta columna.';
      columnes[estat].appendChild(buit);
      return;
    }

    tasquesColumna.forEach((tasca) => {
      columnes[estat].appendChild(crearTargetaTasca(tasca));
    });
  });

  actualitzarComptadorsColumnes(tasquesVisibles);
}

function actualitzarComptadorsColumnes(tasquesVisibles) {
  document.querySelector('#contadorPerFer').textContent = tasquesVisibles.filter((t) => t.estat === 'perFer').length;
  document.querySelector('#contadorEnCurs').textContent = tasquesVisibles.filter((t) => t.estat === 'enCurs').length;
  document.querySelector('#contadorFet').textContent = tasquesVisibles.filter((t) => t.estat === 'fet').length;
}

function actualitzarEstadistiques() {
  const total = tasques.length;
  const perFer = tasques.filter((t) => t.estat === 'perFer').length;
  const enCurs = tasques.filter((t) => t.estat === 'enCurs').length;
  const fet = tasques.filter((t) => t.estat === 'fet').length;
  const percentatge = total === 0 ? 0 : Math.round((fet / total) * 100);

  document.querySelector('#statTotal').textContent = total;
  document.querySelector('#statPerFer').textContent = perFer;
  document.querySelector('#statEnCurs').textContent = enCurs;
  document.querySelector('#statFet').textContent = fet;
  document.querySelector('#statPercentatge').textContent = `${percentatge}%`;
}

function renderitzarAplicacio() {
  const filtres = obtenirFiltres();
  const tasquesVisibles = getTasquesFiltrades(tasques, filtres);
  renderTauler(tasquesVisibles);
  actualitzarEstadistiques();
}

formulari.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validarFormulari()) return;

  const dades = obtenirDadesFormulari();
  const id = inputId.value;

  if (id) {
    actualitzarTasca(id, dades);
  } else {
    crearTasca(dades);
  }

  guardarTasques();
  reiniciarFormulari();
  renderitzarAplicacio();
});

btnCancelar.addEventListener('click', reiniciarFormulari);

btnNetejar.addEventListener('click', () => {
  if (tasques.length === 0) return;
  const confirma = confirm('Segur que vols eliminar totes les tasques?');
  if (!confirma) return;

  tasques = [];
  guardarTasques();
  reiniciarFormulari();
  renderitzarAplicacio();
});

[cerca, filtreEstat, filtrePrioritat].forEach((element) => {
  element.addEventListener('input', renderitzarAplicacio);
  element.addEventListener('change', renderitzarAplicacio);
});

btnRestablirFiltres.addEventListener('click', () => {
  cerca.value = '';
  filtreEstat.value = 'tots';
  filtrePrioritat.value = 'totes';
  renderitzarAplicacio();
});

document.addEventListener('click', (event) => {
  const boto = event.target.closest('button[data-accio]');
  if (!boto) return;

  const id = boto.dataset.id;
  const accio = boto.dataset.accio;

  if (accio === 'editar') editarTasca(id);
  if (accio === 'eliminar') eliminarTasca(id);
});

document.addEventListener('change', (event) => {
  const selector = event.target.closest('select[data-accio="estat"]');
  if (!selector) return;

  canviarEstat(selector.dataset.id, selector.value);
});

renderitzarAplicacio();

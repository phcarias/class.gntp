// ...existing code...
/* Alunos.js reescrito e consolidado */

const API_BASE = "http://localhost:9090";



/* ----------------- Navegação de seções ----------------- */
function initNavegacao() {
  const menuLinks = document.querySelectorAll(".menu-lateral a");
  const sections = document.querySelectorAll(".conteudo-principal section");
  if (!sections.length) return;

  function mostrarSecao(id) {
    sections.forEach(section => {
      section.style.display = section.id === id ? "block" : "none";
    });
    menuLinks.forEach(link => {
      link.parentElement.classList.toggle("ativo", link.getAttribute("href") === `#${id}`);
    });
  }

  menuLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href").substring(1);
      mostrarSecao(id);
      if (id === "resumo-frequencia") carregarGraficoFrequencia();
    });
  });

  // mostra primeira seção
  mostrarSecao(sections[0].id);
}


const username = localStorage.getItem('username') || 'alunos';
    const userInfoElement = document.querySelector('.info-usuario strong');
    if (userInfoElement) {
        userInfoElement.textContent = username;
    }

/* ----------------- Utilitários fetch ----------------- */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

/* ----------------- Meus Dados (aluno) ----------------- */
async function carregarMeusDadosEturmas() {
  const token = localStorage.getItem("token");
  let aluno = null;

  if (token) {
    try {
      aluno = await fetchJson(`${API_BASE}/aluno/me`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
    } catch (err) {
      console.warn("Falha ao obter /aluno/me:", err.message || err);
    }
  }

  if (!aluno) {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("usuario");
      if (raw) aluno = JSON.parse(raw);
    } catch (e) {
      console.warn("Fallback user localStorage inválido", e);
    }
  }

  const nome = aluno?.nome || aluno?.name || aluno?.usuarioNome || "-";
  const email = aluno?.email || aluno?.emailPrincipal || "-";

  let matricula = aluno?.matricula || aluno?.ra || aluno?.registro || "";
  if (!matricula && aluno?.roleData) {
    matricula = aluno.roleData.matricula || aluno.roleData.registro || matricula;
  }
  if (!matricula && Array.isArray(aluno?.roleData?.turmas)) {
    for (const rd of aluno.roleData.turmas) {
      if (rd?.matricula || rd?.registro) {
        matricula = rd.matricula || rd.registro;
        break;
      }
    }
  }

  const turmaNames = [];
  if (Array.isArray(aluno?.roleData?.turmas)) {
    aluno.roleData.turmas.forEach(rd => {
      const t = rd?.turma || rd;
      if (!t) return;
      const label = t.disciplina || t.nome || t.codigo || t._id || (typeof t === 'string' ? t : null);
      if (label) turmaNames.push(label);
    });
  }

  setText("aluno-nome", nome);
  setText("meu-nome", nome);
  setText("usuario-nome", nome);
  setText("aluno-email", email);
  setText("meu-email", email);
  setText("aluno-matricula", matricula || "-");
  setText("meu-matricula", matricula || "-");
  setText("aluno-turma", turmaNames.length ? turmaNames[0] : "-");
  const turmasEl = document.getElementById("aluno-turmas");
  if (turmasEl) turmasEl.textContent = turmaNames.join(" • ");
}

/* ----------------- Carregar turmas do aluno ----------------- */
async function carregarTurmasDoAluno() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    console.warn("Token ou userId não encontrado no localStorage.");
    return [];
  }
  try {
    const turmas = await fetchJson(`${API_BASE}/turma/listar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!Array.isArray(turmas)) return [];
    return turmas.filter(t => {
      if (!t || !Array.isArray(t.alunos)) return false;
      return t.alunos.some(a => {
        if (!a) return false;
        if (typeof a === "string") return String(a) === String(userId);
        if (typeof a === "object") return String(a._id || a.id) === String(userId);
        return false;
      });
    });
  } catch (err) {
    console.error("Erro ao carregar turmas do aluno:", err.message || err);
    return [];
  }
}

/* ----------------- Calendário ----------------- */
function normalizeHorariosFromTurma(turma) {
  const result = [];
  if (!turma) return result;

  if (Array.isArray(turma.aulas) && turma.aulas.length) {
    turma.aulas.forEach(a => {
      result.push({
        dia: a.dia || a.nomeDia || a.weekday || a.data || "-",
        inicio: a.inicio || a.horaInicio || a.start || "-",
        fim: a.fim || a.horaFim || a.end || "-",
        disciplina: a.disciplina || turma.disciplina || a.titulo || "-",
        sala: a.sala || a.local || a.room || "-",
        observacao: a.observacao || a.obs || ""
      });
    });
    return result;
  }

  const horarioObj = turma.horarios || turma.horario || turma.schedule || turma.agenda;
  if (horarioObj && typeof horarioObj === "object") {
    if (Array.isArray(horarioObj)) {
      horarioObj.forEach(h => {
        result.push({
          dia: h.dia || h.day || "-",
          inicio: h.inicio || h.start || h.hora || "-",
          fim: h.fim || h.end || "-",
          disciplina: h.disciplina || turma.disciplina || h.titulo || "-",
          sala: h.sala || h.local || "",
          observacao: h.observacao || ""
        });
      });
      return result;
    }
    for (const [key, value] of Object.entries(horarioObj)) {
      if (Array.isArray(value)) {
        value.forEach(entry => {
          result.push({
            dia: key,
            inicio: entry.inicio || entry.start || entry.hora || "-",
            fim: entry.fim || entry.end || "-",
            disciplina: entry.disciplina || turma.disciplina || entry.titulo || "-",
            sala: entry.sala || entry.local || "",
            observacao: entry.observacao || ""
          });
        });
      } else if (typeof value === "object") {
        result.push({
          dia: key,
          inicio: value.inicio || value.start || "-",
          fim: value.fim || value.end || "-",
          disciplina: value.disciplina || turma.disciplina || "-",
          sala: value.sala || "",
          observacao: value.observacao || ""
        });
      }
    }
    return result;
  }

  return result;
}

function criarTabelaCalendario(target) {
  target.innerHTML = "";

  const header = document.createElement("div");
  header.className = "calendario-header";
  header.style.marginBottom = "0.8rem";

  const label = document.createElement("label");
  label.textContent = "Selecionar turma:";
  label.style.marginRight = "0.5rem";

  const select = document.createElement("select");
  select.id = "calendario-turma-select";
  select.style.padding = "0.35rem 0.5rem";
  select.style.borderRadius = "6px";
  select.style.border = "1px solid #d1d5db";
  select.style.minWidth = "220px";

  header.appendChild(label);
  header.appendChild(select);
  target.appendChild(header);

  const tableWrapper = document.createElement("div");
  tableWrapper.id = "calendario-tabela-wrapper";
  tableWrapper.style.background = "#fff";
  tableWrapper.style.borderRadius = "8px";
  tableWrapper.style.padding = "0.75rem";
  tableWrapper.style.boxShadow = "0 6px 18px rgba(15,20,25,0.04)";
  target.appendChild(tableWrapper);

  return { select, tableWrapper };
}

function renderTabelaDeHorarios(tableWrapper, horarios) {
  tableWrapper.innerHTML = "";
  if (!horarios || horarios.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "Nenhum horário disponível para esta turma.";
    msg.style.color = "#6b7280";
    tableWrapper.appendChild(msg);
    return;
  }

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.fontSize = "0.95rem";

  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  ["Dia", "Início", "Fim", "Disciplina", "Sala", "Observações"].forEach(thText => {
    const th = document.createElement("th");
    th.textContent = thText;
    th.style.textAlign = "left";
    th.style.padding = "0.6rem 0.5rem";
    th.style.borderBottom = "1px solid #e6e9ee";
    th.style.color = "#2c3e50";
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  horarios.forEach(h => {
    const tr = document.createElement("tr");
    [h.dia || "-", h.inicio || "-", h.fim || "-", h.disciplina || "-", h.sala || "-", h.observacao || "-"].forEach((cellText, idx) => {
      const td = document.createElement("td");
      td.textContent = cellText;
      td.style.padding = "0.55rem 0.5rem";
      td.style.borderBottom = "1px solid #f1f3f5";
      if (idx === 0) td.style.fontWeight = "600";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
}

async function inicializarCalendarioAluno() {
  const target = document.getElementById("calendario-aulas-content")
    || document.getElementById("calendario-aulas")
    || document.querySelector(".secao-calendario");

  if (!target) {
    console.warn("Container do calendário não encontrado.");
    return;
  }

  const ui = criarTabelaCalendario(target);
  const select = ui.select;
  const tableWrapper = ui.tableWrapper;

  const turmas = await carregarTurmasDoAluno();
  if (!turmas || turmas.length === 0) {
    select.innerHTML = `<option value="">Nenhuma turma encontrada</option>`;
    renderTabelaDeHorarios(tableWrapper, []);
    return;
  }

  select.innerHTML = `<option value="">Selecione a turma</option>` +
    turmas.map(t => {
      const label = (t.disciplina || t.nome || t.codigo || t._id);
      return `<option value="${t._id}">${label}</option>`;
    }).join("");

  select.addEventListener("change", () => {
    const turmaId = select.value;
    const turma = turmas.find(t => String(t._id) === String(turmaId));
    if (!turma) {
      renderTabelaDeHorarios(tableWrapper, []);
      return;
    }
    const horarios = normalizeHorariosFromTurma(turma);
    renderTabelaDeHorarios(tableWrapper, horarios);
  });

  const first = turmas[0];
  if (first) {
    select.value = first._id;
    const horarios = normalizeHorariosFromTurma(first);
    renderTabelaDeHorarios(tableWrapper, horarios);
  }
}

/* ----------------- Gráfico de Frequência (Chart.js) ----------------- */
let _frequenciaChart = null;
function renderFrequenciaChart(labels, values) {
  const canvas = document.getElementById('grafico-frequencia');
  if (!canvas) return;
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js não encontrado. Inclua o script do Chart.js no HTML.');
    return;
  }
  if (_frequenciaChart) {
    try { _frequenciaChart.destroy(); } catch (e) {}
  }
  _frequenciaChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Frequência (%)',
        data: values,
        backgroundColor: values.map(v => v < 75 ? 'rgba(231,76,60,0.85)' : 'rgba(52,152,219,0.9)'),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } }
      }
    }
  });
}

function buildChartFromCards() {
  const cards = document.querySelectorAll('.cartao-resumo, .cartao-disciplina');
  if (!cards || cards.length === 0) return;
  const labels = [];
  const values = [];
  cards.forEach(card => {
    const labelEl = card.querySelector('h3') || card.querySelector('.rotulo-cartao') || card.querySelector('.conteudo-cartao h3');
    const valueEl = card.querySelector('.numero-cartao') || card.querySelector('.valor-frequencia') || card.querySelector('.porcentagem');
    const label = labelEl ? labelEl.textContent.trim() : null;
    let raw = valueEl ? valueEl.textContent.trim() : null;
    if (!label || raw === null) return;
    raw = raw.replace('%','').replace(/[^\d.,-]/g,'').replace(',', '.');
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    labels.push(label);
    values.push(Math.max(0, Math.min(100, val)));
  });
  if (labels.length) renderFrequenciaChart(labels, values);
}

function observeAndBuildChart() {
  const container = document.querySelector('.grade-cartoes') || document.querySelector('.conteudo-principal');
  if (!container) {
    buildChartFromCards();
    return;
  }
  buildChartFromCards();
  const observer = new MutationObserver(() => buildChartFromCards());
  observer.observe(container, { childList: true, subtree: true });
}

function carregarGraficoFrequencia() {
  observeAndBuildChart();
}

/* ----------------- Inicialização ----------------- */
async function inicializarTudo() {
  initNavegacao();
  try { await carregarMeusDadosEturmas(); } catch (e) { console.warn(e); }
  try { carregarGraficoFrequencia(); } catch (e) { /* ignore */ }
  try { await inicializarCalendarioAluno(); } catch (e) { console.warn(e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarTudo);
} else {
  inicializarTudo();
}
/* ...existing code... */
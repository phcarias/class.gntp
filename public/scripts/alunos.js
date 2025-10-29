// Arquivo limpo — copie e substitua todo o conteúdo atual por este.

const API_BASE = "http://127.0.0.1:9090";

/* ----------------- Navegação de seções ----------------- */
function initNavegacao() {
  const menuLinks = document.querySelectorAll(".menu-lateral a");
  const sections = document.querySelectorAll(".conteudo-principal section");
  if (!sections.length) return;

  function mostrarSecao(id) {
    sections.forEach((section) => {
      section.style.display = section.id === id ? "block" : "none";
    });
    menuLinks.forEach((link) => {
      const parent = link.parentElement;
      if (parent) parent.classList.toggle("ativo", link.getAttribute("href") === `#${id}`);
    });
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href").substring(1);
      if (id) {
        mostrarSecao(id);
        if (id === "resumo-frequencia") carregarGraficoFrequencia();
      }
    });
  });

  // mostrar primeira seção por padrão
  const firstId = sections[0] && sections[0].id ? sections[0].id : null;
  if (firstId) mostrarSecao(firstId);
}

/* ----------------- User info ----------------- */
const username = localStorage.getItem("username") || "aluno";
const userInfoElement = document.querySelector(".info-usuario strong");
if (userInfoElement) userInfoElement.textContent = username;

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
  if (el) el.textContent = value != null ? String(value) : "";
}

/* ----------------- Meus Dados (aluno) ----------------- */
async function carregarMeusDadosEturmas() {
  const token = localStorage.getItem("token");
  let aluno = null;

  if (token) {
    try {
      aluno = await fetchJson(`${API_BASE}/aluno/me`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

  const nome = (aluno && (aluno.nome || aluno.name || aluno.usuarioNome)) || "-";
  const email = (aluno && (aluno.email || aluno.emailPrincipal)) || "-";

  let matricula = (aluno && (aluno.matricula || aluno.ra || aluno.registro)) || "";
  if (!matricula && aluno && aluno.roleData) {
    matricula = aluno.roleData.matricula || aluno.roleData.registro || matricula;
  }
  if (!matricula && aluno && Array.isArray(aluno.roleData?.turmas)) {
    for (const rd of aluno.roleData.turmas) {
      if (rd?.matricula || rd?.registro) {
        matricula = rd.matricula || rd.registro;
        break;
      }
    }
  }

  const turmaNames = [];
  if (aluno && Array.isArray(aluno.roleData?.turmas)) {
    aluno.roleData.turmas.forEach((rd) => {
      const t = rd?.turma || rd;
      if (!t) return;
      const label = t.disciplina || t.nome || t.codigo || t._id || (typeof t === "string" ? t : null);
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
  const userId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");
  if (!token || !userId) {
    console.warn("Token ou userId não encontrado no localStorage.");
    return [];
  }
  try {
    const turmas = await fetchJson(`${API_BASE}/turma/listar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!Array.isArray(turmas)) return [];
    return turmas.filter((t) => {
      if (!t || !Array.isArray(t.alunos)) return false;
      return t.alunos.some((a) => {
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

/* ----------------- Calendário (mantido) ----------------- */
function normalizeHorariosFromTurma(turma) {
  const result = [];
  if (!turma) return result;

  if (Array.isArray(turma.aulas) && turma.aulas.length) {
    turma.aulas.forEach((a) => {
      result.push({
        dia: a.dia || a.nomeDia || a.weekday || a.data || "-",
        inicio: a.inicio || a.horaInicio || a.start || "-",
        fim: a.fim || a.horaFim || a.end || "-",
        disciplina: a.disciplina || turma.disciplina || a.titulo || "-",
        sala: a.sala || a.local || a.room || "-",
        observacao: a.observacao || a.obs || "",
      });
    });
    return result;
  }

  const horarioObj = turma.horarios || turma.horario || turma.schedule || turma.agenda;
  if (horarioObj && typeof horarioObj === "object") {
    if (Array.isArray(horarioObj)) {
      horarioObj.forEach((h) => {
        result.push({
          dia: h.dia || h.day || "-",
          inicio: h.inicio || h.start || h.hora || "-",
          fim: h.fim || h.end || "-",
          disciplina: h.disciplina || turma.disciplina || h.titulo || "-",
          sala: h.sala || h.local || "",
          observacao: h.observacao || "",
        });
      });
      return result;
    }
    for (const [key, value] of Object.entries(horarioObj)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          result.push({
            dia: key,
            inicio: entry.inicio || entry.start || "-",
            fim: entry.fim || entry.end || "-",
            disciplina: entry.disciplina || turma.disciplina || "",
            sala: entry.sala || entry.local || "",
            observacao: entry.observacao || "",
          });
        });
      }
    }
  }

  return result;
}

/* ----------------- Painel / Dashboard do Aluno ----------------- */

async function fetchFrequenciasAluno() {
  const token = localStorage.getItem("token");
  let alunoId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");

  if (!alunoId && token) {
    try {
      const res = await fetch(`${API_BASE}/aluno/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const me = await res.json();
        alunoId = me._id || me.id || alunoId;
      }
    } catch (e) {
      // silent
    }
  }
  if (!alunoId) return [];

  const endpoints = [
    `${API_BASE}/frequencia/listarfrequencias?aluno=${encodeURIComponent(alunoId)}`,
    `${API_BASE}/frequencia/listar?aluno=${encodeURIComponent(alunoId)}`,
    `${API_BASE}/frequencia?aluno=${encodeURIComponent(alunoId)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) continue;
      const json = await res.json();
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.frequencias)) return json.frequencias;
    } catch (e) {
      // tentar próximo endpoint
    }
  }

  return [];
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // semana começa na segunda
  const s = new Date(d);
  s.setDate(d.getDate() + diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function parseDateField(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (!Number.isNaN(dt.getTime())) return dt;
  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);
  return null;
}

function renderFrequenciaChart(labels, values) {
  const canvas = document.getElementById("grafico-frequencia");
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 32 * ratio;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;
  const maxVal = Math.max(100, ...(values.length ? values : [100]));
  const stepY = h / 5;
  const barW = values.length ? (w / values.length) * 0.6 : 0;
  const gap = values.length ? (w / values.length) - barW : 0;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(15,23,42,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + i * stepY;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + w, y);
    ctx.stroke();
  }

  values.forEach((val, i) => {
    const x = padding + i * (barW + gap) + gap / 2;
    const barH = (val / maxVal) * h;
    const y = padding + (h - barH);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#0b1220";
    ctx.font = `${12 * ratio}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.fillText(String(val) + "%", x + barW / 2, y - 6 * ratio);

    ctx.save();
    ctx.translate(x + barW / 2, padding + h + 14 * ratio);
    ctx.rotate(0);
    ctx.fillStyle = "#374151";
    ctx.fillText(labels[i] || "", 0, 0);
    ctx.restore();
  });
}

async function buildAlunoDashboard() {
  let container = document.getElementById("resumo-frequencia");
  if (!container) {
    const main = document.querySelector(".conteudo-principal") || document.body;
    container = document.createElement("section");
    container.id = "resumo-frequencia";
    container.className = "resumo-frequencia";
    container.style.margin = "1rem 0";
    main.insertBefore(container, main.firstChild);
  }

  container.innerHTML = `
    <div id="dashboard-aluno" class="dashboard-aluno" style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1rem"></div>
    <div style="background:#fff;padding:0.75rem;border-radius:8px;box-shadow:0 6px 18px rgba(15,20,25,0.04)">
      <canvas id="grafico-frequencia" style="width:100%;height:220px"></canvas>
    </div>
  `;

  const frequencias = await fetchFrequenciasAluno();
  let presentes = 0;
  let faltas = 0;
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  let faltasSemana = 0;
  let faltasMes = 0;

  const monthly = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = { present: 0, total: 0, label: d.toLocaleString(undefined, { month: "short", year: "numeric" }) };
  }

  frequencias.forEach((f) => {
    const dt = parseDateField(f.data || f.dataRegistro || f.createdAt || f.date);
    const st = (f.status || f.statusFrequencia || f.estado || "").toString().toLowerCase();
    const isFalta = st.includes("falta") || st.includes("absent") || st.includes("ausente");
    const isPresente = st.includes("presente") || st.includes("present") || st.includes("pres");

    if (isFalta) faltas++;
    else if (isPresente) presentes++;
    else presentes++;

    if (dt) {
      if (dt >= weekStart && isFalta) faltasSemana++;
      if (dt >= monthStart && isFalta) faltasMes++;

      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (monthly[key]) {
        monthly[key].total++;
        if (!isFalta) monthly[key].present++;
      }
    }
  });

  const total = presentes + faltas;
  const geralPct = total ? Math.round((presentes / total) * 100) : 0;

  const dash = document.getElementById("dashboard-aluno");
  dash.innerHTML = `
    <div class="card-dash" style="flex:1 1 220px;background:#fff;padding:0.9rem;border-radius:10px;box-shadow:0 8px 22px rgba(2,6,23,0.06)">
      <div style="font-weight:700;color:#0b1220">Frequência Geral</div>
      <div style="font-size:28px;margin-top:0.6rem;color:${geralPct < 75 ? "#dc2626" : "#0ea5a4"}">${geralPct}%</div>
      <div style="font-size:12px;color:#6b7280;margin-top:0.4rem">${presentes} presentes / ${total} registros</div>
    </div>
    <div class="card-dash" style="flex:1 1 180px;background:#fff;padding:0.9rem;border-radius:10px;box-shadow:0 8px 22px rgba(2,6,23,0.06)">
      <div style="font-weight:700;color:#0b1220">Faltas na semana</div>
      <div style="font-size:24px;margin-top:0.6rem;color:#f97316">${faltasSemana}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:0.4rem">Período desde ${weekStart.toLocaleDateString()}</div>
    </div>
    <div class="card-dash" style="flex:1 1 180px;background:#fff;padding:0.9rem;border-radius:10px;box-shadow:0 8px 22px rgba(2,6,23,0.06)">
      <div style="font-weight:700;color:#0b1220">Faltas no mês</div>
      <div style="font-size:24px;margin-top:0.6rem;color:#ef4444">${faltasMes}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:0.4rem">Mês atual: ${now.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
    </div>
  `;

  const labels = [];
  const values = [];
  Object.keys(monthly).forEach((k) => {
    labels.push(monthly[k].label);
    const totalM = monthly[k].total || 0;
    const pct = totalM ? Math.round((monthly[k].present / totalM) * 100) : 0;
    values.push(pct);
  });

  renderFrequenciaChart(labels, values);
}

function carregarGraficoFrequencia() {
  buildAlunoDashboard().catch((err) => {
    console.error("carregarGraficoFrequencia erro:", err);
  });
}

/* ----------------- Inicialização ----------------- */
document.addEventListener("DOMContentLoaded", () => {
  try {
    initNavegacao();
  } catch (e) {
    console.warn(e);
  }
  try {
    carregarMeusDadosEturmas();
  } catch (e) {
    console.warn(e);
  }
  // dashboard será carregado quando a seção resumo-frequencia for exibida
});




// ...existing code...
/* ----------------- Calendário Semanal (debugável e permissivo) ----------------- */
async function carregarCalendarioSemanal() {
  let calendarioContainer = document.getElementById("calendario-semanal");
  if (!calendarioContainer) {
    const main = document.querySelector(".conteudo-principal") || document.body;
    calendarioContainer = document.createElement("section");
    calendarioContainer.id = "calendario-semanal";
    calendarioContainer.className = "calendario-semanal";
    main.insertBefore(calendarioContainer, main.firstChild);
  }

  calendarioContainer.innerHTML = "<p>Carregando calendário...</p>";

  try {
    const token = localStorage.getItem("token");
    let userId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");
    const localEmail = (localStorage.getItem("email") || "").toLowerCase();
    const localName = (localStorage.getItem("username") || localStorage.getItem("name") || "").toLowerCase();

    if (!userId && token) {
      try {
        const meRes = await fetch(`${API_BASE}/aluno/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const me = await meRes.json();
          userId = me._id || me.id || userId;
        }
      } catch (e) {
        console.warn("falha /aluno/me:", e);
      }
    }

    if (!token) {
      calendarioContainer.innerHTML = "<p>Erro: usuário não autenticado (token ausente).</p>";
      return;
    }

    // buscar turmas
    let turmas = [];
    try {
      turmas = await fetchJson(`${API_BASE}/turma/listar`, { headers: { Authorization: `Bearer ${token}` } });
      if (!Array.isArray(turmas)) turmas = [];
    } catch (e) {
      console.error("Erro ao buscar turmas:", e);
      calendarioContainer.innerHTML = "<p>Erro ao carregar turmas.</p>";
      return;
    }

    // util helper para verificar se o registro de aluno corresponde ao usuário atual
    const alunoMatches = (a) => {
      if (!a) return false;
      try {
        // string id
        if (typeof a === "string") {
          if (userId && String(a) === String(userId)) return true;
          if (localEmail && String(a).toLowerCase().includes(localEmail)) return true;
          return false;
        }
        // objeto: checa vários campos
        const candidates = [
          a._id, a.id, a.alunoId, a.usuarioId, a.userId, a.uid,
          a.email, a.mail, a.nome, a.name, a.ra, a.matricula
        ];
        for (const c of candidates) {
          if (!c) continue;
          const s = String(c).toLowerCase();
          if (userId && s === String(userId).toLowerCase()) return true;
          if (localEmail && s.includes(localEmail)) return true;
          if (localName && s.includes(localName)) return true;
        }
        // por segurança, inspeciona sub-objetos (ex.: a.usuario, a.pessoa)
        if (a.usuario && typeof a.usuario === "object") {
          if (alunoMatches(a.usuario)) return true;
        }
        if (a.pessoa && typeof a.pessoa === "object") {
          if (alunoMatches(a.pessoa)) return true;
        }
      } catch (e) {
        // ignore
      }
      return false;
    };

    // filtra turmas do aluno usando função permissiva
    const minhasTurmas = turmas.filter(t => {
      const alunos = t.alunos || t.participantes || t.matriculados || [];
      if (!Array.isArray(alunos)) return false;
      return alunos.some(alunoMatches);
    });

    // Se não encontrou turmas, prepara debug mostrando candidatos por substring (ex: "bia")
    const debugCandidates = [];
    if (minhasTurmas.length === 0) {
      const q = localName || localEmail || "bia";
      (Array.isArray(turmas) ? turmas : []).forEach(t => {
        const alunos = t.alunos || t.participantes || [];
        if (!Array.isArray(alunos)) return;
        for (const a of alunos) {
          try {
            const s = JSON.stringify(a).toLowerCase();
            if (s.includes(q)) {
              debugCandidates.push({ turma: t, aluno: a, horarios: t.horarios || t.aulas || t.schedule || t.agenda || [] });
              break;
            }
          } catch (e) {}
        }
      });
    }

    // função para normalizar nomes de dias (tolerante)
    const normalizeDayKey = (raw) => {
      if (raw == null) return null;
      const s = String(raw).toLowerCase().trim();
      if (!s) return null;
      if (/^\d+$/.test(s)) {
        const n = Number(s);
        if (n >= 1 && n <= 7) return {1:'segunda',2:'terca',3:'quarta',4:'quinta',5:'sexta',6:'sabado',7:'domingo'}[n];
        if (n >= 0 && n <= 6) return {0:'domingo',1:'segunda',2:'terca',3:'quarta',4:'quinta',5:'sexta',6:'sabado'}[n];
      }
      if (s.includes('seg')) return 'segunda';
      if (s.includes('ter')) return 'terca';
      if (s.includes('qua')) return 'quarta';
      if (s.includes('qui')) return 'quinta';
      if (s.includes('sex') || s.includes('fri')) return 'sexta';
      if (s.includes('sab') || s.includes('sat')) return 'sabado';
      if (s.includes('dom') || s.includes('sun')) return 'domingo';
      return null;
    };

    // inicializa mapa dias
    const diasChave = ['segunda','terca','quarta','quinta','sexta','sabado','domingo'];
    const aulasPorDia = {};
    diasChave.forEach(d => aulasPorDia[d] = []);

    // percorre minhasTurmas e extrai horários com normalizeHorariosFromTurma
    minhasTurmas.forEach(turma => {
      const horarios = normalizeHorariosFromTurma(turma);
      (horarios || []).forEach(h => {
        const diaKey = normalizeDayKey(h.dia || h.diaSemana || h.day || h.weekday);
        if (!diaKey) return;
        const inicio = h.inicio || h.horarioInicio || h.start || h.hora || '??:??';
        const fim = h.fim || h.horarioFim || h.end || '??:??';
        const disc = h.disciplina || turma.disciplina || turma.nome || turma.codigo || 'Disciplina não informada';
        aulasPorDia[diaKey].push({ disciplina: disc, inicio: String(inicio), fim: String(fim), turmaId: turma._id || turma.id || '' });
      });
    });

    // ordenar horários
    const parseTimeForSort = (t) => {
      const m = String(t).match(/(\d{1,2}):(\d{2})/);
      if (!m) return 24*60;
      return Number(m[1])*60 + Number(m[2]);
    };
    diasChave.forEach(d => aulasPorDia[d].sort((a,b) => parseTimeForSort(a.inicio) - parseTimeForSort(b.inicio)));

    // montar saída HTML com debug se necessário
    const labelsOrder = ['segunda','terca','quarta','quinta','sexta','sabado','domingo'];
    let html = '';
    if (minhasTurmas.length === 0) {
      html += `<div class="debug-aviso" style="background:#fff3cd;border:1px solid #ffeeba;padding:0.6rem;border-radius:6px;margin-bottom:0.8rem">
        <strong>Aviso:</strong> Nenhuma turma encontrada para o usuário (match por id/email/nome falhou). Tentando mostrar candidatos parecidos.</div>`;
      if (debugCandidates.length) {
        html += `<div class="debug-candidatos" style="background:#f8fafc;border:1px solid #e6eef8;padding:0.6rem;border-radius:6px;margin-bottom:0.8rem">
          <strong>Candidatos encontrados (por substring):</strong><ul>`;
        debugCandidates.slice(0,10).forEach(dc => {
          html += `<li><strong>Turma:</strong> ${dc.turma.disciplina||dc.turma.nome||dc.turma.codigo||dc.turma._id} — <strong>aluno:</strong> ${JSON.stringify(dc.aluno)}</li>`;
        });
        html += `</ul></div>`;
      } else {
        html += `<div style="font-size:0.95rem;color:#374151;margin-bottom:0.6rem">Nenhum candidato por substring encontrado. Confira localStorage (userId/email/username) ou cole a saída do script de inspeção no chat.</div>`;
      }
    }

    // render calendário
    html += labelsOrder.map(k => {
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      const aulas = aulasPorDia[k] || [];
      if (!aulas.length) return `<div class="dia-semana"><h3>${label}</h3><p class="sem-aula">Sem aulas</p></div>`;
      const itens = aulas.map(a => `<li class="aula-item"><strong class="horario">${a.inicio} - ${a.fim}</strong> <span class="disciplina">${a.disciplina}</span></li>`).join("");
      return `<div class="dia-semana"><h3>${label}</h3><ul class="lista-aulas">${itens}</ul></div>`;
    }).join("");

    calendarioContainer.innerHTML = html;

  } catch (err) {
    console.error("Erro ao carregar calendário semanal:", err);
    calendarioContainer.innerHTML = "<p>Erro ao carregar calendário.</p>";
  }
}
// ...existing code...

// ...existing code...
document.addEventListener("DOMContentLoaded", () => {
  try { initNavegacao(); } catch (e) { console.warn(e); }
  try { carregarMeusDadosEturmas(); } catch (e) { console.warn(e); }
  try { carregarCalendarioSemanal(); } catch (e) { console.warn("carregarCalendarioSemanal erro:", e); }
  // dashboard será carregado quando a seção resumo-frequencia for exibida
});


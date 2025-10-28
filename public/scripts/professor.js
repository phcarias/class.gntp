// ...existing code...

const API_BASE = "http://127.0.0.1:9090";

/* ----------------- Utils ----------------- */
function tryDecodeTokenId(token) {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json && (json.id || json._id || json.sub || json.userId || json.uid) || null;
  } catch (e) {
    return null;
  }
}
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ----------------- Navegação ----------------- */
document.querySelectorAll(".menu-lateral a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href").substring(1);
    document.querySelectorAll(".conteudo-principal section").forEach(section => section.style.display = "none");
    const el = document.getElementById(targetId);
    if (el) el.style.display = "block";
    document.querySelectorAll(".menu-lateral li").forEach(item => item.classList.remove("ativo"));
    link.parentElement.classList.add("ativo");

    // initialize dynamic sections
    if (targetId === "minhas-turmas") {
      // nothing extra
    } else if (targetId === "frequencia-alunos") {
      carregarTurmasDropdown(); // load professor's turmas for frequency
    } else if (targetId === "avisos") {
      carregarTurmasParaAvisos();
    }
  });
});

/* ----------------- User info ----------------- */
const username = localStorage.getItem("username") || "professor";
const userInfoElement = document.querySelector(".info-usuario strong");
if (userInfoElement) userInfoElement.textContent = username;

/* ----------------- Turmas (lista / filtro para professor) ----------------- */
function exibirTurmas(turmas) {
  const listaTurmas = document.getElementById("lista-turmas");
  const nenhumaTurma = document.getElementById("nenhuma-turma");
  if (!listaTurmas) return;
  listaTurmas.innerHTML = "";
  if (!Array.isArray(turmas) || turmas.length === 0) {
    if (nenhumaTurma) nenhumaTurma.style.display = "block";
    return;
  }
  if (nenhumaTurma) nenhumaTurma.style.display = "none";

  turmas.forEach((turma) => {
    const turmaCard = document.createElement("article");
    turmaCard.classList.add("cartao-turma");
    const disciplinasText = Array.isArray(turma.disciplinas) ? turma.disciplinas.join(", ") : (turma.disciplina || "");
    const horariosText = Array.isArray(turma.horarios) ? turma.horarios.map(h => `${h.diaSemana} (${h.horarioInicio} - ${h.horarioFim})`).join(", ") : "";
    const profsText = Array.isArray(turma.professores) ? turma.professores.map(p => (p && (p.name || p.nome) ? (p.name || p.nome) : (typeof p === "string" ? p : ""))).join(", ") : "";

    turmaCard.innerHTML = `
      <header>
        <h3>${turma.codigo || ""} - ${disciplinasText}</h3>
        <p><strong>Horários:</strong> ${horariosText}</p>
        <p><strong>Professores:</strong> ${profsText}</p>
      </header>
    `;
    turmaCard.addEventListener("click", () => exibirDetalhesTurma(turma._id || turma.id));
    listaTurmas.appendChild(turmaCard);
  });
}

async function exibirDetalhesTurma(turmaId) {
  try {
    const res = await fetch(`${API_BASE}/turma/detalhes/${turmaId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Erro ao buscar detalhes da turma");
    const turma = await res.json();

    const detalhesContainer = document.createElement("div");
    detalhesContainer.classList.add("detalhes-turma");
    detalhesContainer.innerHTML = `
      <h3>Detalhes da Turma</h3>
      <p><strong>Código:</strong> ${turma.codigo || "-"}</p>
      <p><strong>Disciplina:</strong> ${turma.disciplina || turma.disciplinas || "-"}</p>
      <p><strong>Horários:</strong> ${(turma.horarios || []).map(h => `${h.diaSemana} (${h.horarioInicio} - ${h.horarioFim})`).join(", ")}</p>
      <p><strong>Professores:</strong> ${(turma.professores || []).map(p => p && (p.name || p.nome) ? (p.name || p.nome) : (typeof p === "string" ? p : "")).join(", ")}</p>
      <p><strong>Alunos:</strong> ${(turma.alunos || []).map(a => a && (a.name || a.nome) ? (a.name || a.nome) : (typeof a === "string" ? a : "")).join(", ")}</p>
      <button id="fechar-detalhes" class="botao-limpar">Fechar</button>
    `;
    document.body.appendChild(detalhesContainer);
    document.body.classList.add("modal-aberto");
    document.getElementById("fechar-detalhes").addEventListener("click", () => {
      detalhesContainer.remove();
      document.body.classList.remove("modal-aberto");
    });
  } catch (err) {
    console.error("Erro ao buscar detalhes da turma:", err);
    alert("Erro ao buscar detalhes da turma. Tente novamente mais tarde.");
  }
}

async function buscarTurmas(diaSemana) {
  try {
    const q = diaSemana ? `?diaSemana=${encodeURIComponent(diaSemana)}` : "";
    const res = await fetch(`${API_BASE}/turma/listar${q}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro ao buscar turmas: ${res.status} ${txt}`);
    }
    let turmas = await res.json();
    if (!Array.isArray(turmas)) turmas = [];

    // filtrar apenas turmas que o professor leciona
    const storedId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");
    const token = localStorage.getItem("token");
    const userId = storedId || tryDecodeTokenId(token);

    if (userId) {
      turmas = turmas.filter(t => {
        const profs = t.professores || t.professor || t.professorId || [];
        if (!Array.isArray(profs)) return false;
        return profs.some(p => {
          if (!p) return false;
          if (typeof p === "string") return String(p) === String(userId);
          if (typeof p === "object") return String(p._id || p.id || p) === String(userId);
          return false;
        });
      });
    } else {
      console.warn("buscarTurmas: userId não encontrado; retornando sem filtrar por professor.");
    }

    exibirTurmas(turmas);
  } catch (error) {
    console.error(error);
    alert("Erro ao buscar turmas. Tente novamente mais tarde.");
  }
}

/* ----------------- Frequência (dropdown / alunos / salvar) ----------------- */
async function carregarTurmasDropdown() {
  const turmaSelect = document.getElementById("turma-select");
  if (!turmaSelect) return;
  turmaSelect.innerHTML = '<option value="">Carregando turmas...</option>';
  try {
    const res = await fetch(`${API_BASE}/turma/listar`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Erro ao carregar turmas");
    let turmas = await res.json();
    if (!Array.isArray(turmas)) turmas = [];

    // filtrar apenas turmas do professor
    const storedId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");
    const token = localStorage.getItem("token");
    const userId = storedId || tryDecodeTokenId(token);
    if (userId) {
      turmas = turmas.filter(t => {
        const profs = t.professores || t.professor || [];
        if (!Array.isArray(profs)) return false;
        return profs.some(p => {
          if (!p) return false;
          if (typeof p === "string") return String(p) === String(userId);
          if (typeof p === "object") return String(p._id || p.id || p) === String(userId);
          return false;
        });
      });
    }

    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>' + turmas.map(t => {
      const label = t.codigo ? `${t.codigo} - ${t.disciplina || (t.disciplinas || []).join ? (t.disciplinas || []).join(", ") : ""}` : (t.disciplina || t._id);
      return `<option value="${t._id}">${label}</option>`;
    }).join("");
  } catch (err) {
    console.error("Erro ao carregar turmas:", err);
    turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
  }
}

async function carregarAlunos(turmaId) {
  const listaAlunos = document.getElementById("lista-alunos");
  const btnSalvarFrequencia = document.getElementById("btn-salvar-frequencia");
  if (!listaAlunos) return;
  try {
    const res = await fetch(`${API_BASE}/turma/detalhes/${turmaId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Erro ao carregar turma");
    const turma = await res.json();
    listaAlunos.innerHTML = "";
    (turma.alunos || []).forEach(aluno => {
      const id = aluno._id || aluno.id || aluno;
      const name = aluno.name || aluno.nome || id;
      listaAlunos.innerHTML += `
        <div class="aluno-item">
          <span data-id="${id}">${name}</span>
          <label><input type="radio" name="frequencia-${id}" value="presente" /> Presente</label>
          <label><input type="radio" name="frequencia-${id}" value="falta" /> Falta</label>
        </div>
      `;
    });
    if (btnSalvarFrequencia) btnSalvarFrequencia.style.display = turma.alunos && turma.alunos.length ? "block" : "none";
  } catch (err) {
    console.error("Erro ao carregar alunos:", err);
    alert("Erro ao carregar alunos. Tente novamente mais tarde.");
  }
}

// ...existing code...
async function salvarFrequencia() {
  const turmaSelect = document.getElementById("turma-select");
  const listaAlunos = document.getElementById("lista-alunos");
  if (!turmaSelect || !listaAlunos) return;
  const turmaId = turmaSelect.value;
  const frequencia = [];
  listaAlunos.querySelectorAll(".aluno-item").forEach(item => {
    const span = item.querySelector("span[data-id]");
    if (!span) return;
    const alunoId = span.getAttribute("data-id");
    const checked = item.querySelector(`input[name="frequencia-${alunoId}"]:checked`);
    if (checked) frequencia.push({ alunoId, status: checked.value });
  });
  if (frequencia.length === 0) { alert("Nenhuma frequência marcada."); return; }

  try {
    const res = await fetch(`${API_BASE}/frequencia/createfrequencia`, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, getAuthHeaders()),
      body: JSON.stringify({
        turmaId,
        registros: frequencia,
        data: new Date().toISOString().slice(0,10) // opcional: data YYYY-MM-DD
      })
    });

    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch(e) { body = { raw: text }; }
    console.log("salvarFrequencia response:", res.status, body);

    if (!res.ok) {
      alert(body.msg || body.error || "Erro ao salvar frequência");
      return;
    }

    alert("Frequência salva com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar frequencia:", err);
    alert("Erro de conexão ao salvar frequência.");
  }
}
// ...existing code...

/* ----------------- Avisos (carregar apenas turmas do professor) ----------------- */
async function carregarTurmasParaAvisos() {
  const select = document.getElementById("avisos-turma");
  if (!select) return;
  select.innerHTML = '<option value="">Carregando turmas...</option>';
  try {
    const res = await fetch(`${API_BASE}/turma/listar`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Falha ao carregar turmas");
    let turmas = await res.json();
    if (!Array.isArray(turmas)) turmas = [];

    const storedId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");
    const token = localStorage.getItem("token");
    const userId = storedId || tryDecodeTokenId(token);

    if (userId) {
      turmas = turmas.filter(t => {
        const profs = t.professores || t.professor || [];
        if (!Array.isArray(profs)) return false;
        return profs.some(p => {
          if (!p) return false;
          if (typeof p === "string") return String(p) === String(userId);
          if (typeof p === "object") return String(p._id || p.id || p) === String(userId);
          return false;
        });
      });
    } else {
      // fallback: if no userId, try username/email match
      const userEmail = localStorage.getItem("email");
      if (userEmail) {
        turmas = turmas.filter(t => Array.isArray(t.professores) && t.professores.some(p => (p.email || "").toLowerCase() === userEmail.toLowerCase()));
      }
    }

    if (turmas.length === 0) {
      select.innerHTML = '<option value="">Nenhuma turma encontrada</option>';
      return;
    }
    select.innerHTML = '<option value="">Selecione a turma</option>' + turmas.map(t => {
      const label = t.disciplina || t.nome || t.codigo || t._id;
      return `<option value="${t._id}">${label}</option>`;
    }).join("");
  } catch (err) {
    console.error(err);
    select.innerHTML = '<option value="">Erro ao carregar turmas</option>';
  }
}

/* ----------------- Eventos e inicialização ----------------- */
document.addEventListener("DOMContentLoaded", () => {
  // iniciar calendário / carregar turmas iniciais para frequência e avisos
  carregarTurmasDropdown();
  carregarTurmasParaAvisos();

  // filtro por dia (minhas turmas)
  const filtroDia = document.getElementById("filtro-dia");
  const btnFiltrar = document.getElementById("btn-filtrar");
  const btnLimpar = document.getElementById("btn-limpar");
  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", () => {
      const diaSemana = filtroDia ? filtroDia.value : "";
      if (!diaSemana) { alert("Selecione um dia para filtrar."); return; }
      buscarTurmas(diaSemana);
    });
  }
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      if (filtroDia) filtroDia.value = "";
      const listaTurmas = document.getElementById("lista-turmas");
      if (listaTurmas) listaTurmas.innerHTML = "";
      const nenhumaTurma = document.getElementById("nenhuma-turma");
      if (nenhumaTurma) nenhumaTurma.style.display = "none";
    });
  }

  // events for frequency UI
  const btnCarregarAlunos = document.getElementById("btn-carregar-alunos");
  if (btnCarregarAlunos) btnCarregarAlunos.addEventListener("click", () => {
    const turmaId = document.getElementById("turma-select")?.value;
    if (!turmaId) { alert("Selecione uma turma."); return; }
    carregarAlunos(turmaId);
  });
  const btnSalvarFrequencia = document.getElementById("btn-salvar-frequencia");
  if (btnSalvarFrequencia) btnSalvarFrequencia.addEventListener("click", salvarFrequencia);
});

// ...existing code...
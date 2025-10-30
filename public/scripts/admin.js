document.addEventListener('DOMContentLoaded', function () {

    api = 'http://localhost:9090'; // Defina a URL base da sua API aqui

    const token = localStorage.getItem('token');
    const type = localStorage.getItem('type');


    let alunosCache = [];
    let professoresCache = []; // novo cache
    let turmasCache = []; // Novo cache para turmas
    let usersCache = []; // Novo: cache de usuários

    // Utils
    const $ = (sel) => document.querySelector(sel);
    // Novo: debounce simples para 
    const debounce = (fn, wait = 300) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    };

    // Verificar se o usuário está autenticado


    if (!token) {
        window.location.href = '/login';
        return;
    }

    const username = localStorage.getItem('username') || 'Administrador';
    const userInfoElement = document.querySelector('.user-info strong');
    if (userInfoElement) {
        userInfoElement.textContent = username;
    }

    getAlunosStats();
    getProfessoresStats();
    getTurmasAtivas();
    getFrequenciaMedia();
    loadAlunos();
    loadProfessores(); // novo: carrega professores na inicialização
    loadUsers(); // Novo: carrega usuários

    // Add this block here (right after loadProfessores) to hide all sections except the first (dashboard)
    document.querySelectorAll('.main-content section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        }
    });

    // Novo: função para renderizar a lista de alunos (reaproveitada por loadAlunos e pela busca)
    function renderAlunosList(alunos) {
        const tbody = document.querySelector('#alunos .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Novo: estado de "nenhum resultado"
        if (!alunos || alunos.length === 0) {
            const row = document.createElement('tr');
            row.className = 'no-results';
            row.innerHTML = `<td colspan="6">Nenhum aluno encontrado.</td>`;
            tbody.appendChild(row);

            if (!tbody.dataset.bound) {
                tbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;
                    if (action === 'view') openAlunoModal('view', id);
                    if (action === 'edit') openAlunoModal('edit', id);
                });
                tbody.dataset.bound = '1';
            }
            return;
        }

        alunos.forEach(aluno => {
            const turmas = aluno.roleData?.turmas?.map(t => t?.turma?.codigo).join(', ') || 'N/A';
            const matricula = aluno.roleData?.matricula || 'N/A';
            const statusClass = aluno.active ? 'active' : 'inactive';
            const statusText = aluno.active ? 'Ativo' : 'Inativo';

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${matricula}</td>
              <td>${aluno.name || ''}</td>
              <td>${turmas}</td>
              <td><span class="status ${statusClass}">${statusText}</span></td>
              <td class="actions">
                <button class="btn-icon btn-edit" data-action="edit" data-id="${aluno._id || aluno.id}">
                  <span class="material-icons">edit</span>
                </button>
                <button class="btn-icon btn-view" data-action="view" data-id="${aluno._id || aluno.id}">
                  <span class="material-icons">visibility</span>
                </button>
                <button class="btn-icon danger" data-action="delete" data-id="${aluno._id || aluno.id}" title="Excluir">
                  <span class="material-icons">delete</span>
                </button>
              </td>
            `;
            tbody.appendChild(row);
        });

        if (!tbody.dataset.bound) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'view') openAlunoModal('view', id);
                if (action === 'edit') openAlunoModal('edit', id);
            });
            tbody.dataset.bound = '1';
        }
    }

    async function loadAlunos() {
        try {
            const res = await fetch(`${api}/administrador/getalunos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.error('Erro ao buscar alunos:', res.status);
                return;
            }
            const alunos = await res.json();
            alunosCache = alunos;

            // Refatorado: usa a função de renderização
            renderAlunosList(alunos);
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
        }
    }

    // Novo: renderização da lista de professores
    function renderProfessoresList(professores) {
        const tbody = document.querySelector('#professores .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!professores || professores.length === 0) {
            const row = document.createElement('tr');
            row.className = 'no-results';
            row.innerHTML = `<td colspan="6">Nenhum professor encontrado.</td>`;
            tbody.appendChild(row);
            if (!tbody.dataset.bound) {
                tbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('button[data-action]');
                    if (!btn) return;
                    const id = btn.dataset.id;
                    if (btn.dataset.action === 'view') openProfessorModal('view', id);
                    if (btn.dataset.action === 'edit') openProfessorModal('edit', id);
                });
                tbody.dataset.bound = '1';
            }
            return;
        }

        professores.forEach((prof) => {
            const disciplinas = Array.isArray(prof.roleData?.disciplinas) ? prof.roleData.disciplinas.join(', ') : 'N/A';
            const turmas = prof.roleData?.turmas?.map(t => t?.turma?.codigo).join(', ') || 'N/A';
            const statusClass = prof.active ? 'active' : 'inactive';
            const statusText = prof.active ? 'Ativo' : 'Inativo';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${prof.roleData?.matricula || prof._id || ''}</td>
                <td>${prof.name || ''}</td>
                <td>${disciplinas}</td>
                <td>${turmas}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" data-action="edit" data-id="${prof._id || prof.id}">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-icon btn-view" data-action="view" data-id="${prof._id || prof.id}">
                        <span class="material-icons">visibility</span>
                    </button>
                    <button class="btn-icon danger" data-action="delete" data-id="${prof._id || prof.id}" title="Excluir">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (!tbody.dataset.bound) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                if (btn.dataset.action === 'view') openProfessorModal('view', id);
                if (btn.dataset.action === 'edit') openProfessorModal('edit', id);
            });
            tbody.dataset.bound = '1';
        }
    }

    // Novo: carregar professores
    async function loadProfessores() {
        try {
            const res = await fetch(`${api}/administrador/getprofessores`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.error('Erro ao buscar professores:', res.status);
                return;
            }
            const professores = await res.json();
            professoresCache = professores;
            renderProfessoresList(professores);
        } catch (err) {
            console.error('Erro ao carregar professores:', err);
        }
    }

    // Novo: função para abrir modal de turma
    function openTurmaModal(mode, id) {
        const turma = turmasCache.find(t => String(t._id) === String(id));
        if (!turma) return;

        if (mode === 'view') {
            document.getElementById('view-turma-codigo').textContent = turma.codigo || '-';
            document.getElementById('view-turma-disciplinas').textContent = Array.isArray(turma.disciplinas) ? turma.disciplinas.join(', ') : '-';
            document.getElementById('view-turma-professores').textContent = turma.professores?.map(p => p.name).join(', ') || '-';
            document.getElementById('view-turma-alunos').textContent = turma.alunos?.map(a => a.name).join(', ') || '-';
            document.getElementById('view-turma-horarios').textContent = turma.horarios?.map(h => `${h.diaSemana} ${h.horarioInicio}-${h.horarioFim}`).join(', ') || '-';
            document.getElementById('view-turma-carga').textContent = turma.cargaHoraria || '-';
            document.getElementById('view-turma-periodo').textContent = turma.periodoLetivo ? `${turma.periodoLetivo.dataInicio} - ${turma.periodoLetivo.dataFim}` : '-';
            document.getElementById('view-turma-limite').textContent = turma.limiteFaltas || '-';
            document.getElementById('view-turma-status').textContent = turma.ativo ? 'Ativo' : 'Inativo';
            document.getElementById('turma-view-modal').classList.remove('hidden');
            document.getElementById('turma-view-modal').style.display = 'block';
        } else if (mode === 'edit') {
            document.getElementById('turma-edit-id').value = turma._id;
            document.getElementById('turma-edit-codigo').value = turma.codigo || '';
            document.getElementById('turma-edit-disciplinas').value = Array.isArray(turma.disciplinas) ? turma.disciplinas.join(', ') : '';
            // Preencher selects de professores e alunos (usando as novas funções)
            loadProfessoresSelect('turma-edit-professores', turma.professores?.map(p => p._id) || []);
            loadAlunosSelect('turma-edit-alunos', turma.alunos?.map(a => a._id) || []);
            // Popular horários dinamicamente
            const horariosList = document.getElementById('horarios-turma-edit-list');
            horariosList.innerHTML = '';
            if (turma.horarios && turma.horarios.length > 0) {
                turma.horarios.forEach(h => {
                    const row = document.createElement('div');
                    row.className = 'horario-row';
                    row.innerHTML = `
                        <select name="diaSemana[]" required>
                            <option value="">Dia da semana</option>
                            <option value="segunda" ${h.diaSemana === 'segunda' ? 'selected' : ''}>Segunda</option>
                            <option value="terca" ${h.diaSemana === 'terca' ? 'selected' : ''}>Terça</option>
                            <option value="quarta" ${h.diaSemana === 'quarta' ? 'selected' : ''}>Quarta</option>
                            <option value="quinta" ${h.diaSemana === 'quinta' ? 'selected' : ''}>Quinta</option>
                            <option value="sexta" ${h.diaSemana === 'sexta' ? 'selected' : ''}>Sexta</option>
                            <option value="sabado" ${h.diaSemana === 'sabado' ? 'selected' : ''}>Sábado</option>
                        </select>
                        <input type="time" name="horarioInicio[]" value="${h.horarioInicio || ''}" required />
                        <input type="time" name="horarioFim[]" value="${h.horarioFim || ''}" required />
                        <button type="button" class="btn-add-horario">+</button>
                        <button type="button" class="btn-remove-horario">-</button>
                    `;
                    horariosList.appendChild(row);
                });
            } else {
                // Adicionar uma linha vazia se não houver horários
                const row = document.createElement('div');
                row.className = 'horario-row';
                row.innerHTML = `
                    <select name="diaSemana[]" required>
                        <option value="">Dia da semana</option>
                        <option value="segunda">Segunda</option>
                        <option value="terca">Terça</option>
                        <option value="quarta">Quarta</option>
                        <option value="quinta">Quinta</option>
                        <option value="sexta">Sexta</option>
                        <option value="sabado">Sábado</option>
                    </select>
                    <input type="time" name="horarioInicio[]" required />
                    <input type="time" name="horarioFim[]" required />
                    <button type="button" class="btn-add-horario">+</button>
                    <button type="button" class="btn-remove-horario">-</button>
                `;
                horariosList.appendChild(row);
            }
            document.getElementById('turma-edit-carga').value = turma.cargaHoraria || '';
            document.getElementById('turma-edit-inicio').value = turma.periodoLetivo?.dataInicio?.split('T')[0] || '';
            document.getElementById('turma-edit-fim').value = turma.periodoLetivo?.dataFim?.split('T')[0] || '';
            document.getElementById('turma-edit-limite').value = turma.limiteFaltas || '';
            document.getElementById('turma-edit-ativo').value = turma.ativo ? 'true' : 'false';
            document.getElementById('turma-edit-modal-title').textContent = 'Editar Turma';
            document.getElementById('turma-edit-modal').classList.remove('hidden');
            document.getElementById('turma-edit-modal').style.display = 'block';
        }
    }

    function closeTurmaModal() {
        document.getElementById('turma-view-modal').style.display = 'none';
        document.getElementById('turma-view-modal').classList.add('hidden');
        document.getElementById('turma-edit-modal').style.display = 'none';
        document.getElementById('turma-edit-modal').classList.add('hidden');
    }

    async function saveTurma() {
        const id = document.getElementById('turma-edit-id').value;
        const payload = {
            codigo: document.getElementById('turma-edit-codigo').value,
            disciplinas: document.getElementById('turma-edit-disciplinas').value.split(',').map(d => d.trim()),
            professores: getSelectedValues(document.getElementById('turma-edit-professores')),
            alunos: getSelectedValues(document.getElementById('turma-edit-alunos')),
            // Coletar horários do formulário
            horarios: Array.from(document.querySelectorAll('#horarios-turma-edit-list .horario-row')).map(row => ({
                diaSemana: row.querySelector('select[name="diaSemana[]"]').value,
                horarioInicio: row.querySelector('input[name="horarioInicio[]"]').value,
                horarioFim: row.querySelector('input[name="horarioFim[]"]').value
            })),
            cargaHoraria: document.getElementById('turma-edit-carga').value,
            periodoLetivo: {
                dataInicio: document.getElementById('turma-edit-inicio').value,
                dataFim: document.getElementById('turma-edit-fim').value
            },
            limiteFaltas: document.getElementById('turma-edit-limite').value,
            ativo: document.getElementById('turma-edit-ativo').value === 'true'
        };

        try {
            const res = await fetch(`${api}/administrador/updateturma/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                console.error('Erro ao salvar turma:', txt);
                alert('Erro ao salvar turma. Verifique os dados.');
                return;
            }
            await loadTurmas();
            closeTurmaModal();
        } catch (e) {
            console.error('Erro ao salvar turma:', e);
            alert('Erro de conexão ao salvar turma.');
        }
    }

    // Novo: função para renderizar cards de turmas
    function renderTurmas(turmas) {
        const grid = document.querySelector('#turmas .cards-grid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!turmas || turmas.length === 0) {
            grid.innerHTML = '<p>Nenhuma turma encontrada.</p>';
            return;
        }

        turmas.forEach(turma => {
            // Formatar professores
            const professores = turma.professores?.map(p => p.name).join(', ') || 'N/A';
            // Disciplinas
            const disciplinas = Array.isArray(turma.disciplinas) ? turma.disciplinas.join(', ') : 'N/A';
            // Horário: assume horários iguais e junta dias (e.g., Seg-Qua-Sex, 08:00-12:00)
            const uniqueTimes = [...new Set(turma.horarios?.map(h => `${h.horarioInicio}-${h.horarioFim}`))];
            const time = uniqueTimes.length === 1 ? uniqueTimes[0] : 'Vários';
            const days = turma.horarios?.map(h => h.diaSemana.slice(0, 3)).join('-') || 'N/A';
            const horario = days !== 'N/A' ? `${days}, ${time}` : 'N/A';
            // Alunos: contar
            const alunosCount = turma.alunos?.length || 0;

            const card = document.createElement('div');
            card.className = 'turma-card';
            card.innerHTML = `
                <h3>${turma.codigo || 'N/A'}</h3>
                <div class="turma-info">
                    <p><strong>Professor:</strong> ${professores}</p>
                    <p><strong>Disciplinas:</strong> ${disciplinas}</p>
                    <p><strong>Horário:</strong> ${horario}</p>
                    <p><strong>Alunos:</strong> ${alunosCount}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-small" data-action="view-turma" data-id="${turma._id}">Visualizar</button>
                    <button class="btn-small" data-action="edit-turma" data-id="${turma._id}">Editar</button>
                    <button class="btn-small danger" data-action="delete-turma" data-id="${turma._id}">Excluir</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Bind para ações (se não existir)
        if (!grid.dataset.bound) {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'view-turma') openTurmaModal('view', id);
                if (action === 'edit-turma') openTurmaModal('edit', id);
                if (action === 'delete-turma') openConfirmacaoModal('turma', id);
            });
            grid.dataset.bound = '1';
        }
    }

    // Novo: função para carregar turmas
    async function loadTurmas() {
        try {
            const res = await fetch(`${api}/administrador/getturmas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.error('Erro ao buscar turmas:', res.status);
                return;
            }
            const turmas = await res.json();
            turmasCache = turmas;
            renderTurmas(turmas);
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
        }
    }

    // Novo: bind da busca (não colapsa a listagem completa)
    (function bindAlunoSearch() {
        // Ajuste o seletor se necessário para o seu HTML
        const searchInput = document.querySelector('.search-box input[placeholder="Buscar aluno por nome..."]');
        const searchIcon = document.querySelector('.search-box .material-icons');
        if (!searchInput) return;
        if (searchInput.dataset.bound) return;

        const runSearch = async () => {
            const term = searchInput.value.trim();
            if (!term) {
                // Campo limpo -> recarrega todos
                await loadAlunos();
                return;
            }
            // Evita chamadas para termos muito curtos
            if (term.length < 2) return;

            try {
                const res = await fetch(`${api}/administrador/buscaraluno`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: term })
                });

                if (res.status === 404) {
                    alunosCache = [];
                    renderAlunosList([]); // Novo: mostra estado vazio
                    return;
                }
                if (!res.ok) {
                    console.error('Erro ao buscar alunos por nome:', res.status);
                    renderAlunosList([]); // Novo: mostra estado vazio em erro
                    return;
                }

                const alunos = await res.json();
                alunosCache = alunos;
                renderAlunosList(alunos);
            } catch (err) {
                console.error('Erro ao buscar alunos por nome:', err);
                renderAlunosList([]); // Novo: mostra estado vazio em exceção
            }
        };

        // Busca com debounce ao digitar
        searchInput.addEventListener('input', debounce(runSearch, 300));
        // Clique na lupa dispara a busca imediata
        if (searchIcon) {
            searchIcon.addEventListener('click', runSearch);
        }

        searchInput.dataset.bound = '1';
    })();

    // Novo: busca de professores com debounce
    (function bindProfessorSearch() {
        const searchInput = document.querySelector('#professores .search-box input[placeholder="Buscar professor por nome..."]');
        const searchIcon = document.querySelector('#professores .search-box .material-icons');
        if (!searchInput || searchInput.dataset.bound) return;

        const runSearch = async () => {
            const term = searchInput.value.trim();
            if (!term) {
                await loadProfessores();
                return;
            }
            if (term.length < 2) return;

            try {
                const res = await fetch(`${api}/administrador/buscarprofessor`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: term })
                });

                if (res.status === 404) {
                    professoresCache = [];
                    renderProfessoresList([]);
                    return;
                }
                if (!res.ok) {
                    console.error('Erro ao buscar professores por nome:', res.status);
                    renderProfessoresList([]);
                    return;
                }

                const professores = await res.json();
                professoresCache = professores;
                renderProfessoresList(professores);
            } catch (err) {
                console.error('Erro ao buscar professores por nome:', err);
                renderProfessoresList([]);
            }
        };

        searchInput.addEventListener('input', debounce(runSearch, 300));
        if (searchIcon) searchIcon.addEventListener('click', runSearch);

        searchInput.dataset.bound = '1';
    })();

    function getSelectedValues(selectEl) {
        return Array.from(selectEl?.selectedOptions || []).map(o => o.value);
    }

    // Util: carregar turmas em qualquer <select> (reuso do seu fetch atual)
    async function loadTurmasSelect(selectId, preselectedIds = []) {
        const select = document.getElementById(selectId);
        if (!select) return;

        try {
            const res = await fetch('http://localhost:9090/turma/listar');
            if (!res.ok) throw new Error('Erro ao carregar turmas');
            const data = await res.json();
            select.innerHTML = '';
            data.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma._id;
                option.textContent = turma.codigo;
                if (preselectedIds.includes(String(turma._id))) option.selected = true;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            alert('Erro ao carregar turmas. Tente novamente.');
        }
    }

    // Novo: função para carregar professores no select (reutiliza lógica de carregarProfessoresTurma)
    async function loadProfessoresSelect(selectId, preselectedIds = []) {
        const select = document.getElementById(selectId);
        if (!select) return;

        try {
            const res = await fetch(`${api}/turma/professores`);
            if (!res.ok) throw new Error('Erro ao carregar professores');
            const data = await res.json();
            select.innerHTML = '';
            data.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof._id;
                option.textContent = prof.name;
                if (preselectedIds.includes(String(prof._id))) option.selected = true;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar professores:', error);
            alert('Erro ao carregar professores. Tente novamente.');
        }
    }

    // Novo: função para carregar alunos no select (reutiliza lógica de carregarAlunosTurma)
    async function loadAlunosSelect(selectId, preselectedIds = []) {
        const select = document.getElementById(selectId);
        if (!select) return;

        try {
            const res = await fetch(`${api}/turma/alunos`);
            if (!res.ok) throw new Error('Erro ao carregar alunos');
            const data = await res.json();
            select.innerHTML = '';
            data.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno._id;
                option.textContent = aluno.name;
                if (preselectedIds.includes(String(aluno._id))) option.selected = true;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            alert('Erro ao carregar alunos. Tente novamente.');
        }
    }

    // Modal handling
    function openAlunoModal(mode, id) {
        const aluno = alunosCache.find(a => String(a._id || a.id) === String(id));
        if (!aluno) return;

        if (mode === 'view') {
            // Preencher spans no modal de visualização
            document.getElementById('view-matricula').textContent = aluno.roleData?.matricula || '-';
            document.getElementById('view-nome').textContent = aluno.name || '-';
            document.getElementById('view-email').textContent = aluno.email || '-';
            document.getElementById('view-responsavel').textContent = aluno.roleData?.responsavelEmail || '-';
            document.getElementById('view-turmas').textContent = (aluno.roleData?.turmas || [])
                .map(t => t?.turma?.codigo || t?.codigo || 'N/A')
                .join(', ') || '-';
            document.getElementById('view-status').textContent = aluno.active ? 'Ativo' : 'Inativo';
            document.getElementById('view-created').textContent = aluno.createdAt ? new Date(aluno.createdAt).toLocaleDateString('pt-BR') : '-';

            // Abrir modal de visualização
            const modal = document.getElementById('modal-ver-aluno');
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        } else if (mode === 'edit') {
            // Código existente para edição
            document.getElementById('aluno-id').value = aluno._id || aluno.id || '';
            document.getElementById('aluno-nome').value = aluno.name || '';
            document.getElementById('aluno-email').value = aluno.email || '';
            document.getElementById('aluno-matricula').value = aluno.roleData?.matricula || '';
            document.getElementById('aluno-active').value = aluno.active ? 'true' : 'false';

            const respEl = document.getElementById('aluno-responsavel-email');
            if (respEl) respEl.value = aluno.roleData?.responsavelEmail || '';

            const currentTurmaIds = (aluno.roleData?.turmas || [])
                .map(t => {
                    if (t && typeof t === 'object') {
                        const tt = t.turma ?? t._id ?? t.id ?? t;
                        if (tt && typeof tt === 'object') return tt._id || tt.id || '';
                        return String(tt || '');
                    }
                    return String(t || '');
                })
                .filter(Boolean);

            loadTurmasSelect('aluno-turmas-select', currentTurmaIds);

            document.getElementById('aluno-modal-title').textContent = 'Editar aluno';
            document.getElementById('aluno-save').classList.remove('hidden');

            document.querySelectorAll('#aluno-form input, #aluno-form select, #aluno-form textarea')
                .forEach(el => el.disabled = false);

            const modal = document.getElementById('aluno-modal');
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        }
    }

    window.addEventListener('click', (e) => {
        // ... outros ifs
        if (e.target === document.getElementById('modal-ver-aluno')) {
            closeVerAlunoModal();
        }
    });

    function closeAlunoModal() {
        const modal = document.getElementById('aluno-modal');
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    function closeVerAlunoModal() {
        const modal = document.getElementById('modal-ver-aluno');
        if (!modal) return;
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }

    async function saveAluno() {
        const id = document.getElementById('aluno-id').value;
        const name = document.getElementById('aluno-nome').value.trim();
        if (!name) {
            alert('Nome é obrigatório.');
            return;
        }
        const turmas = getSelectedValues(document.getElementById('aluno-turmas-select'));
        const responsavelEmail = document.getElementById('aluno-responsavel-email')?.value?.trim();

        const payload = {
            id,
            name,
            email: document.getElementById('aluno-email').value.trim(),
            active: document.getElementById('aluno-active').value === 'true',
            roleData: {
                matricula: document.getElementById('aluno-matricula').value.trim(),
                turmas,
                responsavelEmail
            }
        };

        try {
            const res = await fetch(`${api}/administrador/attaluno`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                console.error('Erro ao salvar aluno:', txt);
                alert('Erro ao salvar aluno. Verifique os dados.');
                return;
            }
            await loadAlunos();
            closeAlunoModal();
        } catch (e) {
            console.error('Erro ao salvar aluno:', e);
            alert('Erro de conexão ao salvar aluno.');
        }
    }

    function openProfessorModal(mode, id) {
        const prof = professoresCache.find(p => String(p._id || p.id) === String(id));
        if (!prof) return;

        document.getElementById('professor-id').value = prof._id || prof.id || '';
        document.getElementById('professor-nome').value = prof.name || '';
        document.getElementById('professor-email').value = prof.email || '';
        document.getElementById('professor-matricula').value = prof.roleData?.matricula || '';
        document.getElementById('professor-active').value = prof.active ? 'true' : 'false';
        document.getElementById('professor-disciplinas').value =
            Array.isArray(prof.roleData?.disciplinas) ? prof.roleData.disciplinas.join(', ') : '';

        const currentTurmaIds = (prof.roleData?.turmas || [])
            .map(t => {
                if (t && typeof t === 'object') {
                    const tt = t.turma ?? t._id ?? t.id ?? t;
                    if (tt && typeof tt === 'object') return tt._id || tt.id || '';
                    return String(tt || '');
                }
                return String(t || '');
            })
            .filter(Boolean);

        loadTurmasSelect('professor-turmas-select', currentTurmaIds);

        const isView = mode === 'view';
        document.getElementById('professor-modal-title').textContent = isView ? 'Visualizar professor' : 'Editar professor';
        document.getElementById('professor-save').classList.toggle('hidden', isView);

        document.querySelectorAll('#professor-form input, #professor-form select, #professor-form textarea')
            .forEach(el => el.disabled = isView);

        const modal = document.getElementById('professor-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }

    function closeProfessorModal() {
        const modal = document.getElementById('professor-modal');
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }

    async function saveProfessor() {
        const id = document.getElementById('professor-id').value;
        const name = document.getElementById('professor-nome').value.trim();
        if (!name) {
            alert('Nome é obrigatório.');
            return;
        }
        const turmasSelect = document.getElementById('professor-turmas-select');
        const turmas = turmasSelect?.multiple
            ? Array.from(turmasSelect.selectedOptions || []).map(o => o.value)
            : [turmasSelect?.value].filter(Boolean);
        const disciplinas = (document.getElementById('professor-disciplinas').value || '')
            .split(',').map(d => d.trim()).filter(Boolean);

        const payload = {
            id,
            name,
            email: document.getElementById('professor-email').value.trim(),
            active: document.getElementById('professor-active').value === 'true',
            roleData: {
                matricula: document.getElementById('professor-matricula').value.trim(),
                turmas,
                disciplinas
            }
        };

        try {
            const res = await fetch(`${api}/administrador/attprofessor`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                console.error('Erro ao salvar professor:', txt);
                alert('Erro ao salvar professor. Verifique os dados.');
                return;
            }
            await loadProfessores();
            closeProfessorModal();
        } catch (e) {
            console.error('Erro ao salvar professor:', e);
            alert('Erro de conexão ao salvar professor.');
        }
    }

    // Bind botões do modal (delegado para garantir existência)
    document.addEventListener('click', (e) => {
        if (e.target?.id === 'aluno-cancel') closeAlunoModal();
        if (e.target?.id === 'aluno-save') saveAluno();
        if (e.target === document.getElementById('aluno-modal')) closeAlunoModal(); // clique no backdrop
        if (e.target?.id === 'professor-cancel') closeProfessorModal();
        if (e.target?.id === 'professor-save') saveProfessor();
        if (e.target === document.getElementById('professor-modal')) closeProfessorModal(); // clique no backdrop
        if (e.target?.id === 'turma-edit-save') saveTurma();
        if (e.target?.id === 'turma-edit-cancel') closeTurmaModal();
        if (e.target?.id === 'close-turma-edit-modal') closeTurmaModal();
        if (e.target === document.getElementById('turma-edit-modal')) closeTurmaModal(); // clique no backdrop
        // Novo: fechar modal de visualização de turma
        if (e.target?.id === 'turma-view-cancel') closeTurmaModal();
        if (e.target === document.getElementById('turma-view-modal')) closeTurmaModal(); // clique no backdrop
        if (e.target?.id === 'close-modal-ver-aluno') {
            closeVerAlunoModal();
        }
    });

    // Novo: função para abrir modal de confirmação
    function openConfirmacaoModal(tipo, id) {
        const modal = document.getElementById('modal-confirmacao');
        const mensagemEl = document.getElementById('confirmacao-mensagem');
        const confirmarBtn = document.getElementById('btn-confirmar-confirmacao');

        mensagemEl.textContent = `Tem certeza que deseja excluir este ${tipo}? Esta ação pode gerar inconsistências nos relatórios futuros, pois removerá o ${tipo} de todas as turmas associadas e registros relacionados.`;

        confirmarBtn.onclick = () => {
            if (tipo === 'turma') deleteTurma(tipo, id);
            else if (tipo === 'admin') deleteUser(tipo, id);  // Adicione suporte para 'usuario'
            else deleteUser(tipo, id);  // Para aluno/professor
            modal.style.display = 'none';
        };

        modal.style.display = 'block';
    }

    // Novo: função para deletar usuário (aluno ou professor)
    async function deleteUser(tipo, id) {

        console.log(`Deletando ${tipo} com ID:`, id);
        try {
            const res = await fetch(`${api}/administrador/userremove/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                const txt = await res.text();
                console.error(`Erro ao deletar ${tipo}:`, txt);
                alert(`Erro ao deletar ${tipo}. Verifique os dados.`);
                return;
            }
            alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} deletado com sucesso!`);
            if (tipo === 'aluno') await loadAlunos();
            else if (tipo === 'professor') await loadProfessores();
            else await loadUsers();
        } catch (e) {
            console.error(`Erro ao deletar ${tipo}:`, e);
            alert(`Erro de conexão ao deletar ${tipo}.`);
        }
    }

    // Novo: função para deletar turma
    async function deleteTurma(tipo, id) {
        try {
            const res = await fetch(`${api}/administrador/turmaremove/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                const txt = await res.text();
                console.error(`Erro ao deletar ${tipo}:`, txt);
                alert(`Erro ao deletar ${tipo}. Verifique os dados.`);
                return;
            }
            alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} deletada com sucesso!`);
            await loadTurmas(); // Recarrega turmas após exclusão
        } catch (e) {
            console.error(`Erro ao deletar ${tipo}:`, e);
            alert(`Erro de conexão ao deletar ${tipo}.`);
        }
    }

    // Novo: bind para fechar modal de confirmação
    document.addEventListener('click', (e) => {
        if (e.target?.id === 'close-modal-confirmacao' || e.target?.id === 'btn-cancelar-confirmacao') {
            document.getElementById('modal-confirmacao').style.display = 'none';
        }
    });
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal-confirmacao');
        if (e.target === modal) modal.style.display = 'none';
    });

    (function bindAlunosTableActions() {
        const tbody = document.querySelector('#alunos .data-table tbody');
        if (!tbody || tbody.dataset.bound) return;
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.dataset.action === 'view') openAlunoModal('view', id);
            if (btn.dataset.action === 'edit') openAlunoModal('edit', id);
            if (btn.dataset.action === 'delete') openConfirmacaoModal('aluno', id);
        });
        tbody.dataset.bound = '1';
    })();

    // Novo: bind para ações da tabela de professores
    (function bindProfessoresTableActions() {
        const tbody = document.querySelector('#professores .data-table tbody');
        if (!tbody || tbody.dataset.bound) return;
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.dataset.action === 'view') openProfessorModal('view', id);
            if (btn.dataset.action === 'edit') openProfessorModal('edit', id);
            if (btn.dataset.action === 'delete') openConfirmacaoModal('professor', id);
        });
        tbody.dataset.bound = '1';
    })();

    // Modal para adicionar novo aluno
    function openNovoAlunoModal() {
        const modal = document.getElementById('modal-novo-aluno');
        if (!modal) return;
        modal.style.display = 'block';
        loadTurmasSelect('turma-aluno', []); // reusa seu carregamento de turmas
    }
    function closeNovoAlunoModal() {
        const modal = document.getElementById('modal-novo-aluno');
        if (!modal) return;
        modal.style.display = 'none';
    }

    // Delegação única (qualquer botão com data-action="novo-aluno")
    (function bindNovoAlunoButtons() {
        if (document.body.dataset.boundNovoAluno) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="novo-aluno"]');
            if (btn) {
                e.preventDefault();
                openNovoAlunoModal();
            }
            if (e.target?.id === 'close-modal-novo-aluno') {
                closeNovoAlunoModal();
            }
        });
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-novo-aluno');
            if (e.target === modal) closeNovoAlunoModal();
        });
        document.body.dataset.boundNovoAluno = '1';
    })();

    // Submeter formulário para adicionar aluno
    const formNovoAluno = document.getElementById('form-novo-aluno');
    // Submeter formulário para adicionar aluno
    if (formNovoAluno && !formNovoAluno.dataset.bound) {
        formNovoAluno.addEventListener('submit', async (e) => {
            e.preventDefault();

            const alunoData = {
                name: formNovoAluno.name.value,
                email: formNovoAluno.email.value,
                password: formNovoAluno.password.value,
                confirmpassword: formNovoAluno.confirmpassword.value,
                matricula: formNovoAluno.matricula.value,
                responsavelEmail: formNovoAluno.responsavelEmail.value,
                type: "aluno",
                turmas: Array.from(document.getElementById('turma-aluno')?.selectedOptions || []).map(opt => opt.value)
            };

            try {
                const res = await fetch(`${api}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(alunoData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    alert(error?.msg || 'Erro ao adicionar aluno.');
                    return;
                }

                alert('Aluno adicionado com sucesso!');
                closeNovoAlunoModal();
                formNovoAluno.reset();
            } catch (error) {
                console.error('Erro ao adicionar aluno:', error);
                alert('Erro ao adicionar aluno. Tente novamente mais tarde.');
            }
        });
        formNovoAluno.dataset.bound = '1';
    }


    // ...existing code...
    // Adicione a nova função delegada para professor
    (function bindNovoProfessorButtons() {
        if (document.body.dataset.boundNovoProfessor) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="novo-professor"]');
            if (btn) {
                e.preventDefault();
                const modal = document.getElementById('modal-novo-professor');
                if (modal) modal.style.display = 'block';
                // Carregar turmas se necessário para professor
            }
            if (e.target?.id === 'close-modal-novo-professor') {
                const modal = document.getElementById('modal-novo-professor');
                if (modal) modal.style.display = 'none';
            }
        });
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-novo-professor');
            if (e.target === modal) modal.style.display = 'none';
        });
        document.body.dataset.boundNovoProfessor = '1';
    })();

    // Adicione a nova função delegada
    (function bindNovoTurmaButtons() {
        if (document.body.dataset.boundNovoTurma) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="nova-turma"]');
            if (btn) {
                e.preventDefault();
                const modal = document.getElementById('modal-nova-turma');
                if (modal) modal.style.display = 'block';
                carregarProfessoresTurma();
                carregarAlunosTurma();
            }
            if (e.target?.id === 'close-modal-nova-turma') {
                const modal = document.getElementById('modal-nova-turma');
                if (modal) modal.style.display = 'none';
            }
        });
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-nova-turma');
            if (e.target === modal) modal.style.display = 'none';
        });
        document.body.dataset.boundNovoTurma = '1';
    })();

    // Defina formNovoProfessor
    const formNovoProfessor = document.getElementById('form-novo-professor');

    // Submeter formulário para adicionar professor
    if (formNovoProfessor && !formNovoProfessor.dataset.bound) {
        formNovoProfessor.addEventListener('submit', async (e) => {
            e.preventDefault();
            const professorData = {
                name: formNovoProfessor.name.value,
                email: formNovoProfessor.email.value,
                password: formNovoProfessor.password.value,
                confirmpassword: formNovoProfessor.confirmpassword.value,
                matricula: formNovoProfessor.matricula.value,
                disciplinas: formNovoProfessor.disciplinas.value.split(',').map(d => d.trim()),
                type: "professor",
                turmas: Array.from(document.getElementById('turma-professor').selectedOptions).map(opt => opt.value)
            };
            try {
                const res = await fetch(`${api}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(professorData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    alert(`Erro ao adicionar professor: ${error.msg}`);
                    return;
                }

                alert('Professor adicionado com sucesso!');
                const modal = document.getElementById('modal-novo-professor');
                if (modal) modal.style.display = 'none';
                formNovoProfessor.reset();
            } catch (error) {
                console.error('Erro ao adicionar professor:', error);
                alert('Erro ao adicionar professor. Tente novamente mais tarde.');
            }
        });
        formNovoProfessor.dataset.bound = '1';
    }

    // Modal para criar nova turma
    const modalNovaTurma = document.getElementById('modal-nova-turma');
    const btnNovaTurma = document.getElementById('btn-nova-turma');
    const closeModalNovaTurma = document.getElementById('close-modal-nova-turma');
    const formNovaTurma = document.getElementById('form-nova-turma');

    // Carregar professores
    function carregarProfessoresTurma() {
        fetch('http://localhost:9090/turma/professores')
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById("professores-turma");
                select.innerHTML = "";
                data.forEach(prof => {
                    const option = document.createElement("option");
                    option.value = prof._id;
                    option.textContent = prof.name;
                    select.appendChild(option);
                });
            })
            .catch(error => console.error("Erro ao carregar professores:", error));
    }

    // Carregar alunos
    function carregarAlunosTurma() {
        fetch('http://localhost:9090/turma/alunos')
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById("alunos-turma");
                select.innerHTML = "";
                data.forEach(aluno => {
                    const option = document.createElement("option");
                    option.value = aluno._id;
                    option.textContent = aluno.name;
                    select.appendChild(option);
                });
            })
            .catch(error => console.error("Erro ao carregar alunos:", error));
    }


    // Adicionar/remover horários
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-add-horario')) {
            const horariosList = e.target.closest('#horarios-turma-list') || e.target.closest('#horarios-turma-edit-list');
            const row = document.createElement('div');
            row.className = 'horario-row';
            row.innerHTML = `
                <select name="diaSemana[]" required>
                    <option value="">Dia da semana</option>
                    <option value="segunda">Segunda</option>
                    <option value="terca">Terça</option>
                    <option value="quarta">Quarta</option>
                    <option value="quinta">Quinta</option>
                    <option value="sexta">Sexta</option>
                    <option value="sabado">Sábado</option>
                </select>
                <input type="time" name="horarioInicio[]" required />
                <input type="time" name="horarioFim[]" required />
                <button type="button" class="btn-add-horario">+</button>
                <button type="button" class="btn-remove-horario">-</button>
            `;
            horariosList.appendChild(row);
        }
        if (e.target.classList.contains('btn-remove-horario')) {
            e.target.parentElement.remove();
        }
    });

    // Submeter formulário para criar turma
    formNovaTurma.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disciplinas como array
        const disciplinas = formNovaTurma.disciplinas.value.split(',').map(d => d.trim());

        // Professores/alunos selecionados
        const professores = Array.from(document.getElementById('professores-turma').selectedOptions).map(opt => opt.value);
        const alunos = Array.from(document.getElementById('alunos-turma').selectedOptions).map(opt => opt.value);

        // Horários
        const horarioRows = document.querySelectorAll('#horarios-turma-list .horario-row');
        const horarios = Array.from(horarioRows).map(row => {
            return {
                diaSemana: row.querySelector('select[name="diaSemana[]"]').value,
                horarioInicio: row.querySelector('input[name="horarioInicio[]"]').value,
                horarioFim: row.querySelector('input[name="horarioFim[]"]').value
            };
        });

        // Período letivo
        const periodoLetivo = {
            dataInicio: formNovaTurma.periodoInicio.value,
            dataFim: formNovaTurma.periodoFim.value
        };

        // Payload
        const turmaData = {
            codigo: formNovaTurma.codigo.value,
            disciplinas,
            professores,
            alunos,
            horarios,
            cargaHoraria: formNovaTurma.cargaHoraria.value,
            periodoLetivo,
            limiteFaltas: formNovaTurma.limiteFaltas.value,
            ativo: formNovaTurma.ativo.value === "true"
        };

        try {
            const res = await fetch('http://localhost:9090/turma/criarturma', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(turmaData)
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`Erro ao criar turma: ${error.erro || error.msg}`);
                return;
            }

            alert('Turma criada com sucesso!');
            modalNovaTurma.style.display = 'none';
            formNovaTurma.reset();
            // Opcional: atualizar listagem de turmas
        } catch (error) {
            console.error('Erro ao criar turma:', error);
            alert('Erro ao criar turma. Tente novamente mais tarde.');
        }
    });



    //funções p/ dashboard admin

    async function getAlunosStats() {


        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/alunosstats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Adiciona o token no cabeçalho
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }
        const stats = await res.json();
        document.getElementById('total-alunos').textContent = stats.totalAlunos;
        document.getElementById('alunos-change').textContent = "+" + stats.alunosMatriculadosEsteMes + " este mês";
    }
    async function getTurmasAtivas() {


        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/turmasativas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Adiciona o token no cabeçalho
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }
        const stats = await res.json();
        document.getElementById('total-turmas').textContent = stats.turmasAtivas;
        document.getElementById('turmas-change').textContent = "- " + stats.turmasDesativadas + " turma desativada(s)";


    }

    async function getFrequenciaMedia() {


        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/frequenciamedia`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Adiciona o token no cabeçalho
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }

        console.log('Resposta da frequência média:', res.text, res.frequenciaMedia, res.diferencaFrequencia);

        const stats = await res.json();

        console.log('Dados da frequência média:', stats);

        document.getElementById('frequencia-media').textContent = stats.frequenciaMedia + "%";
        document.getElementById('frequencia-anterior').textContent =
            (stats.diferencaFrequencia >= 0 ? "+" : "") + stats.diferencaFrequencia + "% em relação ao mês anterior";
    }


    async function getProfessoresStats() {


        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/professoresstats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }
        const stats = await res.json();
        document.getElementById('total-professores').textContent = stats.totalProfessores;
        document.getElementById('professores-change').textContent = "+" + stats.professoresCadastradosEsteMes + " este mês";
    }




    // Navegação simples entre seções
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.querySelectorAll('.main-content section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(targetId).style.display = 'block';

            // Atualiza menu ativo
            document.querySelectorAll('.sidebar li').forEach(item => {
                item.classList.remove('active');
            });
            link.parentElement.classList.add('active');
        });
    });

    // Mostrar apenas a seção ativa inicialmente
    document.querySelectorAll('.main-content section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        }
    });
    // Carregar turmas no select
    document.addEventListener("DOMContentLoaded", () => {
        fetch('http://localhost:9090/turma/listar')
            .then(response => response.json())
            .then(data => {
                const turmaSelect = document.getElementById("turma-aluno");
                turmaSelect.innerHTML = "";
                data.forEach(turma => {
                    const option = document.createElement("option");
                    option.value = turma._id;
                    option.textContent = turma.codigo;
                    turmaSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Erro ao carregar turmas:", error));
    });
    // Carregar turmas no select do professor
    fetch('http://localhost:9090/turma/listar')
        .then(response => response.json())
        .then(data => {
            const turmaSelectProf = document.getElementById("turma-professor");
            turmaSelectProf.innerHTML = "";
            data.forEach(turma => {
                const option = document.createElement("option");
                option.value = turma._id;
                option.textContent = turma.codigo;
                turmaSelectProf.appendChild(option);
            });
        })
        .catch(error => console.error("Erro ao carregar turmas:", error));

    // No DOMContentLoaded, adicione:
    loadTurmas(); // Carrega turmas na inicialização

    // No event listener da sidebar, adicione:
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.querySelectorAll('.main-content section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(targetId).style.display = 'block';

            // Atualiza menu ativo
            document.querySelectorAll('.sidebar li').forEach(item => {
                item.classList.remove('active');
            });
            link.parentElement.classList.add('active');

            // Recarrega turmas ao navegar para a seção de turmas
            if (targetId === 'turmas') {
                loadTurmas();
            }
        });
    });

    // Carregar turmas e alunos para selects
    async function loadOptionsForReports() {
        const [turmasRes, alunosRes] = await Promise.all([
            fetch(`${api}/turma/listar`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${api}/turma/alunos`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const turmas = await turmasRes.json();
        const alunos = await alunosRes.json();

        // Popular selects de turma
        ['select-turma-desempenho'].forEach(id => {
            const select = document.getElementById(id);
            turmas.forEach(t => {
                const option = document.createElement('option');
                option.value = t._id;
                option.textContent = t.codigo;
                select.appendChild(option);
            });
        });

        // Popular selects de aluno
        ['select-aluno-frequencia', 'select-aluno-desempenho', 'select-aluno-desempenho-frequencia'].forEach(id => {
            const select = document.getElementById(id);
            alunos.forEach(a => {
                const option = document.createElement('option');
                option.value = a._id;
                option.textContent = a.name;
                select.appendChild(option);
            });
        });
    }

    // Função genérica para gerar PDF
    async function generatePDF(urlBase, params = {}) {
        if (!isTokenValid()) {
            alert('Token expirado. Faça login novamente.');
            return;
        }

        const query = new URLSearchParams(params).toString();
        const url = `${api}${urlBase}?${query}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`  // Envia o token
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro ao gerar PDF:', response.status, errorText);
                alert('Erro ao gerar relatório. Verifique os dados e tente novamente.');
                return;
            }

            // Converte resposta em blob (PDF)
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Cria link de download e clica automaticamente
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'relatorio.pdf';  // Nome do arquivo
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Libera o blob URL
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    }

    // Event listeners para botões

    document.getElementById('btn-pdf-frequencia-aluno').addEventListener('click', () => {
        const alunoId = document.getElementById('select-aluno-frequencia').value;
        const startDate = document.getElementById('start-date-frequencia-aluno').value;
        const endDate = document.getElementById('end-date-frequencia-aluno').value;
        if (!alunoId) return alert('Selecione um aluno');
        generatePDF('/relatorios/export/pdf/frequencia/aluno/' + alunoId, { startDate, endDate });
    });

    // Adicionar event listeners para botões de desempenho e dados gerais
    document.getElementById('btn-pdf-desempenho-turma').addEventListener('click', () => {
        const turmaId = document.getElementById('select-turma-desempenho').value;
        const startDate = document.getElementById('start-date-desempenho-turma').value;
        const endDate = document.getElementById('end-date-desempenho-turma').value;
        if (!turmaId) return alert('Selecione uma turma');
        generatePDF('/relatorios/export/pdf/desempenho/turma/' + turmaId, { startDate, endDate });
    });

    document.getElementById('btn-pdf-desempenho-aluno').addEventListener('click', () => {
        const alunoId = document.getElementById('select-aluno-desempenho').value;
        const startDate = document.getElementById('start-date-desempenho-aluno').value;
        const endDate = document.getElementById('end-date-desempenho-aluno').value;
        if (!alunoId) return alert('Selecione um aluno');
        generatePDF('/relatorios/export/pdf/desempenho/aluno/' + alunoId, { startDate, endDate });
    });

    document.getElementById('btn-pdf-dados-gerais').addEventListener('click', () => {
        generatePDF('/relatorios/export/pdf/dados-gerais');
    });

    // Validação adicional: Verificar token antes de fetches
    function isTokenValid() {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000; // Verifica expiração
        } catch {
            return false;
        }
    }

    // Antes de generatePDF, chame if (!isTokenValid()) { alert('Token expirado. Faça login novamente.'); return; }
    loadOptionsForReports(); // Chama para popular selects de relatórios

    // Event listener para exportar relatório de desempenho geral
    document.getElementById('btn-pdf-desempenho').addEventListener('click', () => {
        generatePDF('/relatorios/export/pdf/desempenho');
    });

    // Novo: Desempenho + Frequência (Aluno)
    document.getElementById('btn-pdf-desempenho-frequencia-aluno')?.addEventListener('click', () => {
        const alunoId = document.getElementById('select-aluno-desempenho-frequencia')?.value;
        const startDate = document.getElementById('start-date-desempenho-frequencia-aluno')?.value;
        const endDate = document.getElementById('end-date-desempenho-frequencia-aluno')?.value;
        if (!alunoId) return alert('Selecione um aluno');
        // A rota aceita apenas alunoId; os parâmetros de data serão ignorados se não suportados.
        generatePDF('/relatorios/export/pdf/desempenhofrequencia/aluno/' + alunoId, { startDate, endDate });
    });

    // Novo: renderização da lista de usuários
    function renderUsersList(users) {
        const tbody = document.querySelector('#usuarios .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            const row = document.createElement('tr');
            row.className = 'no-results';
            row.innerHTML = `<td colspan="6">Nenhum usuário encontrado.</td>`;
            tbody.appendChild(row);

            if (!tbody.dataset.bound) {
                tbody.addEventListener('click', async (e) => {
                    const btn = e.target.closest('button[data-action]');
                    if (!btn) return;
                    const id = btn.dataset.id;

                    if (btn.dataset.action === 'view') {
                        if (typeof openUserModal === 'function') openUserModal('view', id);
                        else alert('Visualização não implementada.');
                    }
                    if (btn.dataset.action === 'edit') {
                        if (typeof openUserModal === 'function') openUserModal('edit', id);
                        else alert('Edição não implementada.');
                    }
                    if (btn.dataset.action === 'delete') {


                        openConfirmacaoModal(tipo, id);  // Mude para usar o modal personalizado
                    }
                });
                tbody.dataset.bound = '1';
            }
            return;
        }

        users.forEach((user) => {
            const statusClass = user.active ? 'active' : 'inactive';
            const statusText = user.active ? 'Ativo' : 'Inativo';
            const typeLabel = (user.type || '').charAt(0).toUpperCase() + (user.type || '').slice(1);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || ''}</td>
                <td>${user.email || ''}</td>
                <td>${typeLabel || ''}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-view" data-action="view" data-id="${user._id}"><span class="material-icons">visibility</span></button>
                    <button class="btn-icon btn-edit" data-action="edit" data-id="${user._id}"><span class="material-icons">edit</span></button>
                    <button class="btn-icon danger" data-action="delete" data-id="${user._id}" data-type="${user.type}"><span class="material-icons">delete</span></button>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (!tbody.dataset.bound) {
            tbody.addEventListener('click', async (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                const tipo = btn.dataset.type;

                if (btn.dataset.action === 'view') {
                    if (typeof openUserModal === 'function') openUserModal('view', id);
                    else alert('Visualização não implementada.');
                }
                if (btn.dataset.action === 'edit') {
                    if (typeof openUserModal === 'function') openUserModal('edit', id);
                    else alert('Edição não implementada.');
                }
                if (btn.dataset.action === 'delete') {
                    openConfirmacaoModal(tipo, id);  // Mude para usar o modal personalizado
                }
            });
            tbody.dataset.bound = '1';
        }
    }

    // Novo: carregar usuários
    async function loadUsers() {
        try {
            const res = await fetch(`${api}/administrador/getusers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.msg || `Erro ${res.status}`);
            }
            usersCache = await res.json();
            renderUsersList(usersCache);

            // Busca local por nome/email/tipo/id
            const searchInput = document.querySelector('#usuarios .search-box input');
            if (searchInput && !searchInput.dataset.bound) {
                searchInput.addEventListener('input', debounce(() => {
                    const q = (searchInput.value || '').toLowerCase().trim();
                    const filtered = usersCache.filter(u =>
                        (u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.type || '').toLowerCase().includes(q) ||
                        (u._id || '').toLowerCase().includes(q)
                    );
                    renderUsersList(filtered);
                }, 300));
                searchInput.dataset.bound = '1';
            }
        } catch (e) {
            console.error('Erro ao carregar usuários:', e);
            renderUsersList([]);
        }
    }

    /*
   // Novo: deletar usuário
    async function deleteUser(id) {
        try {
            const res = await fetch(`${api}/administrador/userremove/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.msg || `Erro ${res.status}`);
            usersCache = usersCache.filter(u => u._id !== id);
            renderUsersList(usersCache);
            alert('Usuário deletado com sucesso!');
        } catch (e) {
            console.error('Erro ao deletar usuário:', e);
            alert('Erro ao deletar usuário.');
        }
    }
*/
    // Novo: função para abrir modal de usuário
    function openUserModal(mode, id) {
        const user = usersCache.find(u => String(u._id) === String(id));
        if (!user) return;

        if (mode === 'view') {
            // Código existente para view
            document.getElementById('view-user-nome').textContent = user.name || '-';
            document.getElementById('view-user-email').textContent = user.email || '-';
            document.getElementById('view-user-tipo').textContent = (user.type || '').charAt(0).toUpperCase() + (user.type || '').slice(1) || '-';
            document.getElementById('view-user-status').textContent = user.active ? 'Ativo' : 'Inativo';
            document.getElementById('view-user-created').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-';
            document.getElementById('user-view-modal').classList.remove('hidden');
            document.getElementById('user-view-modal').style.display = 'block';
        } else if (mode === 'edit') {
            // Novo: preencher campos para edição
            document.getElementById('user-edit-id').value = user._id;
            document.getElementById('user-edit-nome').value = user.name || '';
            document.getElementById('user-edit-email').value = user.email || '';
            document.getElementById('user-edit-active').value = user.active ? 'true' : 'false';
            document.getElementById('user-edit-modal').classList.remove('hidden');
            document.getElementById('user-edit-modal').style.display = 'block';
        }
    }

    // Novo: função para salvar usuário (envia PUT para updateAdmin)
    async function saveUser() {
        const id = document.getElementById('user-edit-id').value;
        const name = document.getElementById('user-edit-nome').value.trim();
        const email = document.getElementById('user-edit-email').value.trim();
        const active = document.getElementById('user-edit-active').value === 'true';

        if (!name || !email) {
            alert('Nome e e-mail são obrigatórios.');
            return;
        }

        const payload = { id, name, email, active };

        try {
            const res = await fetch(`${api}/administrador/updateuser`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error('Erro ao salvar usuário:', txt);
                alert('Erro ao salvar usuário. Verifique os dados.');
                return;
            }

            // Atualizar cache e recarregar lista
            await loadUsers();
            closeUserModal();
            alert('Usuário salvo com sucesso!');
        } catch (e) {
            console.error('Erro ao salvar usuário:', e);
            alert('Erro de conexão ao salvar usuário.');
        }
    }

    // Estender closeUserModal para fechar ambos os modais
    function closeUserModal() {
        document.getElementById('user-view-modal').style.display = 'none';
        document.getElementById('user-view-modal').classList.add('hidden');
        document.getElementById('user-edit-modal').style.display = 'none';
        document.getElementById('user-edit-modal').classList.add('hidden');
    }

    // Bind para fechar e salvar modal de usuário (estender existente)
    document.addEventListener('click', (e) => {
        if (e.target?.id === 'user-view-cancel' || e.target?.id === 'user-edit-cancel') closeUserModal();
        if (e.target?.id === 'user-edit-save') saveUser();
        if (e.target === document.getElementById('user-view-modal') || e.target === document.getElementById('user-edit-modal')) closeUserModal(); // clique no backdrop
    });

    (function bindUserSearch() {
        const searchInput = document.querySelector('#usuarios .search-box input');
        const searchIcon = document.querySelector('#usuarios .search-box .material-icons');
        if (!searchInput || searchInput.dataset.bound) return;

        const runSearch = async () => {
            const term = searchInput.value.trim();
            if (!term) {
                // Campo limpo -> recarrega todos os usuários
                renderUsersList(usersCache);
                return;
            }
            if (term.length < 2) return;

            try {
                const res = await fetch(`${api}/administrador/getusersbyname`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: term })
                });

                if (res.status === 404) {
                    renderUsersList([]);
                    return;
                }
                if (!res.ok) {
                    console.error('Erro ao buscar usuários por nome:', res.status);
                    renderUsersList([]);
                    return;
                }

                const users = await res.json();
                renderUsersList(users);
            } catch (err) {
                console.error('Erro ao buscar usuários por nome:', err);
                renderUsersList([]);
            }
        };

        searchInput.addEventListener('input', debounce(runSearch, 300));
        if (searchIcon) {
            searchIcon.addEventListener('click', runSearch);
        }

        searchInput.dataset.bound = '1';
    })();

    (function bindNovoUsuarioButtons() {
        // Defina as funções aqui, dentro da IIFE
        function openNovoUsuarioModal() {
            const modal = document.getElementById('modal-novo-usuario');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        }

        function closeNovoUsuarioModal() {
            const modal = document.getElementById('modal-novo-usuario');
            if (!modal) return;
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }

        // Submeter formulário para adicionar administrador
        const formNovoUsuario = document.getElementById('form-novo-usuario');
        if (formNovoUsuario && !formNovoUsuario.dataset.bound) {
            formNovoUsuario.addEventListener('submit', async (e) => {
                e.preventDefault();
                const usuarioData = {
                    name: formNovoUsuario.name.value,
                    email: formNovoUsuario.email.value,
                    password: formNovoUsuario.password.value,
                    confirmpassword: formNovoUsuario.confirmpassword.value,
                    type: "admin",  // Fixado como administrador
                    active: true  // Administradores ativos por padrão
                };

                try {
                    const res = await fetch(`${api}/auth/register`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(usuarioData),
                    });

                    if (!res.ok) {
                        const error = await res.json();
                        alert(error?.msg || 'Erro ao adicionar administrador.');
                        return;
                    }

                    alert('Administrador adicionado com sucesso!');
                    closeNovoUsuarioModal();
                    formNovoUsuario.reset();
                    await loadUsers();  // Recarrega lista de usuários
                } catch (error) {
                    console.error('Erro ao adicionar administrador:', error);
                    alert('Erro ao adicionar administrador. Tente novamente mais tarde.');
                }
            });
            formNovoUsuario.dataset.bound = '1';
        }



        if (document.body.dataset.boundNovoUsuario) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="novo-usuario"]');
            if (btn) {
                e.preventDefault();
                openNovoUsuarioModal();
            }
            if (e.target?.id === 'close-modal-novo-usuario') {
                closeNovoUsuarioModal();
            }
        });
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-novo-usuario');
            if (e.target === modal) closeNovoUsuarioModal();
        });
        document.body.dataset.boundNovoUsuario = '1';
    })();

    // Em admin.js, na função enviarAviso (dentro do bloco DOMContentLoaded)
    async function enviarAviso(destinatariosInputId, assuntoId, corpoId) {
        const destinatariosInput = document.getElementById(destinatariosInputId).value.trim();
        const assunto = document.getElementById(assuntoId).value.trim();
        const corpo = document.getElementById(corpoId).value.trim();

        if (!destinatariosInput || !assunto || !corpo) {
            alert('Preencha todos os campos.');
            return;
        }

        // Separar destinatários por vírgula e filtrar vazios
        const destinatarios = destinatariosInput.split(',').map(email => email.trim()).filter(email => email);

        if (destinatarios.length === 0) {
            alert('Insira pelo menos um e-mail válido.');
            return;
        }

        try {
            // Usar sendWarn: passar username, para (array), assunto, texto e html
            const res = await fetch(`${api}/email/sendwarn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: `${username}`,  // Nome do remetente
                    para: destinatarios,  // Array de e-mails
                    assunto: assunto,
                    texto: corpo,  // Corpo em texto plano
                    html: `<p>${corpo}</p>`,  // Corpo em HTML para incluir logo
                }),
            });

            if (res.ok) {
                alert('Aviso enviado com sucesso!');
                // Limpar campos
                document.getElementById(destinatariosInputId).value = '';
                document.getElementById(assuntoId).value = '';
                document.getElementById(corpoId).value = '';
            } else {
                const error = await res.json();
                alert(`Erro ao enviar aviso: ${error.msg || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro ao enviar aviso:', error);
            alert('Erro ao enviar aviso.');
        }
    }

    // No event listener para o botão
    document.getElementById('enviar-admin').addEventListener('click', () => enviarAviso('destinatario', 'assunto-admin', 'corpo-admin'));

});

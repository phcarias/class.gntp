document.addEventListener('DOMContentLoaded', function () {

    api = 'http://localhost:9090'; // Defina a URL base da sua API aqui

    const token = localStorage.getItem('token');
    const type = localStorage.getItem('type');


    let alunosCache = [];
    let professoresCache = []; // novo cache

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
    getFrequenciaMedia().catch(console.error);
    loadAlunos();
    loadProfessores(); // novo: carrega professores na inicialização

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
              <td>N/A</td>
              <td><span class="status ${statusClass}">${statusText}</span></td>
              <td class="actions">
                <button class="btn-icon btn-edit" data-action="edit" data-id="${aluno._id || aluno.id}">
                  <span class="material-icons">edit</span>
                </button>
                <button class="btn-icon btn-view" data-action="view" data-id="${aluno._id || aluno.id}">
                  <span class="material-icons">visibility</span>
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

    // Novo: bind da busca (não colapsa a listagem completa)
    (function bindAlunoSearch() {
        // Ajuste o seletor se necessário para o seu HTML
        const searchInput = document.querySelector('.search-box input[placeholder="Buscar aluno..."]');
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
        const searchInput = document.querySelector('#professores .search-box input[placeholder="Buscar professor..."]');
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

    // Modal handling
    function openAlunoModal(mode, id) {
        const aluno = alunosCache.find(a => String(a._id || a.id) === String(id));
        if (!aluno) return;

        // Preenche campos
        document.getElementById('aluno-id').value = aluno._id || aluno.id || '';
        document.getElementById('aluno-nome').value = aluno.name || '';
        document.getElementById('aluno-email').value = aluno.email || '';
        document.getElementById('aluno-matricula').value = aluno.roleData?.matricula || '';
        document.getElementById('aluno-active').value = aluno.active ? 'true' : 'false';

        // Correção: preencher e-mail do responsável
        const respEl = document.getElementById('aluno-responsavel-email');
        if (respEl) respEl.value = aluno.roleData?.responsavelEmail || '';

        // IDs de turmas do aluno
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

        // Popular select múltiplo reutilizando o fetch existente
        loadTurmasSelect('aluno-turmas-select', currentTurmaIds);

        // View vs Edit
        const isView = mode === 'view';
        document.getElementById('aluno-modal-title').textContent = isView ? 'Visualizar aluno' : 'Editar aluno';
        document.getElementById('aluno-save').classList.toggle('hidden', isView);

        // Habilitar/Desabilitar campos
        document.querySelectorAll('#aluno-form input, #aluno-form select, #aluno-form textarea')
            .forEach(el => el.disabled = isView);

        // Abrir modal (mesmo padrão do modal de novo aluno, usando display)
        const modal = document.getElementById('aluno-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }

    function closeAlunoModal() {
        const modal = document.getElementById('aluno-modal');
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
        });
        tbody.dataset.bound = '1';
    })();

    function toggleFormDisabled(formSel, disabled) {
        document.querySelectorAll(`${formSel} input, ${formSel} select, ${formSel} textarea`)
            .forEach(el => el.disabled = disabled);
    }

    // Bind botões do modal (delegado para garantir existência)
    document.addEventListener('click', (e) => {
        if (e.target?.id === 'aluno-cancel') closeAlunoModal();
        if (e.target?.id === 'aluno-save') saveAluno();
        if (e.target === document.getElementById('aluno-modal')) closeAlunoModal(); // clique no backdrop
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Popular o select do "Novo Aluno" (já existente)
        loadTurmasSelect('turma-aluno');
        // Se existir select do professor, reutiliza também
        loadTurmasSelect('turma-professor');
    });
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
    // ...existing code...

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

    // Modal para adicionar novo professor
    // Remova o código antigo:
    // const modalNovoProfessor = document.getElementById('modal-novo-professor');
    // const btnNovoProfessor = document.getElementById('btn-novo-professor');
    // const closeModalNovoProfessor = document.getElementById('close-modal-novo-professor');
    // const formNovoProfessor = document.getElementById('form-novo-professor');

    // btnNovoProfessor.addEventListener('click', () => {
    //     modalNovoProfessor.style.display = 'block';
    // });

    // closeModalNovoProfessor.addEventListener('click', () => {
    //     modalNovoProfessor.style.display = 'none';
    // });

    // window.addEventListener('click', (e) => {
    //     if (e.target === modalNovoProfessor) {
    //         modalNovoProfessor.style.display = 'none';
    //     }
    // });

    // Adicione um listener delegado para "novo-professor"
    (function bindNovoProfessorButtons() {
        if (document.body.dataset.boundNovoProfessor) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="novo-professor"]');
            if (btn) {
                e.preventDefault();
                const modal = document.getElementById('modal-novo-professor');
                if (modal) modal.style.display = 'block';
                loadTurmasSelect('turma-professor', []);
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

    // Abrir modal
    btnNovaTurma.addEventListener('click', () => {
        modalNovaTurma.style.display = 'block';
    });

    // Fechar modal
    closeModalNovaTurma.addEventListener('click', () => {
        modalNovaTurma.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === modalNovaTurma) {
            modalNovaTurma.style.display = 'none';
        }
    });

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

    // Carregar selects ao abrir modal
    btnNovaTurma.addEventListener('click', () => {
        carregarProfessoresTurma();
        carregarAlunosTurma();
    });

    // Adicionar/remover horários
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-add-horario')) {
            const horariosList = document.getElementById('horarios-turma-list');
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

        console.log('Buscando estatísticas de alunos...');

        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/alunosstats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Adiciona o token no cabeçalho
                'Content-Type': 'application/json'
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

        console.log('Buscando número de turmas ativas...');

        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/turmasativas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Adiciona o token no cabeçalho
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }
        const stats = await res.json();
        document.getElementById('total-turmas').textContent = stats.totalTurmas;
        document.getElementById('turmas-change').textContent = "-" + stats.turmasDesativadas + " turma desativada(s)";


    }

    async function getFrequenciaMedia() {

        console.log('Buscando frequência média...');

        // Substitua a URL abaixo pela rota real da sua API
        const res = await fetch(`${api}/administrador/frequenciamedia`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Adiciona o token no cabeçalho
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            console.log('Erro na requisição:', res.status, await res.text());
            return;
        }

        const stats = await res.json();
        console.log('Estatísticas de frequência média:', stats);
        document.getElementById('frequencia-media').textContent = stats.frequenciaMedia + "%";
        document.getElementById('frequencia-anterior').textContent =
            (stats.diferencaFrequencia >= 0 ? "+" : "") + stats.diferencaFrequencia + "% em relação ao mês anterior";
    }


    async function getProfessoresStats() {

        console.log('Buscando estatísticas de professores...');

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
});

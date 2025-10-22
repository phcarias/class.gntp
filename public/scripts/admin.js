
document.addEventListener('DOMContentLoaded', function () {

    api = 'http://localhost:9090'; // Defina a URL base da sua API aqui

    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    const type = localStorage.getItem('type');


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
            console.log(alunos)
            const tbody = document.querySelector('#alunos .data-table tbody');
            tbody.innerHTML = '';
            alunos.forEach(aluno => {
                const turmas = aluno.roleData?.turmas?.map(t => t.turma?.codigo).join(', ') || 'N/A';
                const matricula = aluno.roleData?.matricula || 'N/A';
                
                const statusClass = aluno.active ? 'active' : 'inactive';
                const statusText = aluno.active ? 'Ativo' : 'Inativo';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${matricula}</td>
                    <td>${aluno.name}</td>
                    <td>${turmas}</td>
                    <td>N/A</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn-icon" title="Editar">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="btn-icon" title="Visualizar">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn-icon danger" title="Excluir">
                            <span class="material-icons">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
        }
    }



    // Modal para adicionar novo aluno
    const modalNovoAluno = document.getElementById('modal-novo-aluno');
    const btnNovoAluno = document.getElementById('btn-novo-aluno');
    const closeModalNovoAluno = document.getElementById('close-modal-novo-aluno');
    const formNovoAluno = document.getElementById('form-novo-aluno');

    // Abrir modal
    btnNovoAluno.addEventListener('click', () => {
        modalNovoAluno.style.display = 'block';
    });

    // Fechar modal
    closeModalNovoAluno.addEventListener('click', () => {
        modalNovoAluno.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === modalNovoAluno) {
            modalNovoAluno.style.display = 'none';
        }
    });

    // Submeter formulário para adicionar aluno
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
            turmas: Array.from(document.getElementById('turma-aluno').selectedOptions).map(opt => opt.value)
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
                alert(`Erro ao adicionar aluno: ${error.msg}`);
                return;
            }

            alert('Aluno adicionado com sucesso!');
            modalNovoAluno.style.display = 'none';
            formNovoAluno.reset();
        } catch (error) {
            console.error('Erro ao adicionar aluno:', error);
            alert('Erro ao adicionar aluno. Tente novamente mais tarde.');
        }
    });

    // Modal para adicionar novo professor
    const modalNovoProfessor = document.getElementById('modal-novo-professor');
    const btnNovoProfessor = document.getElementById('btn-novo-professor');
    const closeModalNovoProfessor = document.getElementById('close-modal-novo-professor');
    const formNovoProfessor = document.getElementById('form-novo-professor');

    // Abrir modal
    btnNovoProfessor.addEventListener('click', () => {
        modalNovoProfessor.style.display = 'block';
    });

    // Fechar modal
    closeModalNovoProfessor.addEventListener('click', () => {
        modalNovoProfessor.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === modalNovoProfessor) {
            modalNovoProfessor.style.display = 'none';
        }
    });

    // Submeter formulário para adicionar professor
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
            modalNovoProfessor.style.display = 'none';
            formNovoProfessor.reset();
        } catch (error) {
            console.error('Erro ao adicionar professor:', error);
            alert('Erro ao adicionar professor. Tente novamente mais tarde.');
        }
    });

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



});

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
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.main-content section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        }
    });
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


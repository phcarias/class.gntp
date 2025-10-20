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
    getFrequenciaMedia();




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
            name: formNovoAluno.nome.value,
            email: formNovoAluno.email.value,
            matricula: formNovoAluno.matricula.value,
            curso: formNovoAluno.curso.value,
            periodo: formNovoAluno.periodo.value,
        };

        try {
            const res = await fetch(`${api}/administrador/alunos`, {
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
        document.getElementById('frequencia-media').textContent = stats.frequenciaMedia + "%";
        document.getElementById('frequencia_anterior').textContent = 
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


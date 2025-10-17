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


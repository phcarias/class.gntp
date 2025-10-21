// Navegação simples entre seções
document.querySelectorAll('.menu-lateral a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        document.querySelectorAll('.conteudo-principal section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(targetId).style.display = 'block';

        // Atualiza menu ativo
        document.querySelectorAll('.menu-lateral li').forEach(item => {
            item.classList.remove('ativo');
        });
        link.parentElement.classList.add('ativo');
    });
});

// Mostrar apenas a seção ativa inicialmente
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.conteudo-principal section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        }
    });
});

const weekdayMap = {0:'Dom',1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sab'};
        const btnFiltrar = document.getElementById('btn-filtrar');
        const btnLimpar = document.getElementById('btn-limpar');
        const inputData = document.getElementById('filtro-data');
        const listaTurmas = document.getElementById('lista-turmas');
        const nenhumaTurma = document.getElementById('nenhuma-turma');

        function mostrarTodasTurmas() {
            listaTurmas.querySelectorAll('.cartao-turma').forEach(c => c.style.display = '');
            nenhumaTurma.style.display = 'none';
        }

        function filtrarPorData(dataIso) {
            if (!dataIso) { mostrarTodasTurmas(); return; }
            const d = new Date(dataIso + 'T00:00:00');
            const abreviacao = weekdayMap[d.getDay()];
            const cards = Array.from(listaTurmas.querySelectorAll('.cartao-turma'));
            let encontrados = 0;
            cards.forEach(card => {
                const days = (card.getAttribute('data-days') || '').split(',').map(s => s.trim());
                if (days.includes(abreviacao)) { card.style.display = ''; encontrados++; }
                else { card.style.display = 'none'; }
            });
            nenhumaTurma.style.display = encontrados === 0 ? '' : 'none';
        }

        async function carregarTurmas() {
            console.log("Função carregarTurmas foi chamada"); // Verifica se a função foi chamada
            try {
                // Atualize a URL para o endereço do backend
                const response = await fetch("http://localhost:9090/turma/listar");
                const turmas = await response.json();
                console.log("Dados recebidos do backend:", turmas); // Verifica os dados recebidos
        
                const listaTurmas = document.getElementById("lista-turmas");
                listaTurmas.innerHTML = "";
        
                turmas.forEach(turma => {
                    console.log("Processando turma:", turma); // Verifica cada turma
                    const dias = turma.horarios.map(h => h.diaSemana).join(", ");
                    const horarios = turma.horarios.map(h => `${h.horarioInicio} às ${h.horarioFim}`).join(", ");
        
                    listaTurmas.innerHTML += `
                        <article class="cartao-turma" data-days="${dias}">
                            <header>
                                <h3>${turma.disciplina} - ${turma.codigo}</h3>
                                <p><strong>Horário:</strong> ${dias} - ${horarios}</p>
                            </header>
                            <button class="botao-frequencia">Marcar Frequência</button>
                        </article>
                    `;
                });
            } catch (error) {
                console.error("Erro ao carregar turmas:", error); // Verifica erros
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Você precisa estar logado para acessar esta página.");
                window.location.href = "/public/views/login.html";
            }
        });

    
        document.addEventListener("DOMContentLoaded", carregarTurmas);


        btnFiltrar.addEventListener('click', () => filtrarPorData(inputData.value));
        btnLimpar.addEventListener('click', () => { inputData.value = ''; mostrarTodasTurmas(); });
        inputData.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); filtrarPorData(inputData.value); } });
        module.exports = router;
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

document.addEventListener("DOMContentLoaded", () => {
    const filtroDia = document.getElementById("filtro-dia");
    const btnFiltrar = document.getElementById("btn-filtrar");
    const btnLimpar = document.getElementById("btn-limpar");
    const listaTurmas = document.getElementById("lista-turmas");
    const nenhumaTurma = document.getElementById("nenhuma-turma");

    // Função para exibir turmas
    function exibirTurmas(turmas) {
        listaTurmas.innerHTML = ""; // Limpa a lista de turmas
        if (turmas.length === 0) {
            nenhumaTurma.style.display = "block";
            return;
        }

        nenhumaTurma.style.display = "none";
        turmas.forEach((turma) => {
            const turmaCard = document.createElement("article");
            turmaCard.classList.add("cartao-turma");
            turmaCard.innerHTML = `
                <header>
                    <h3>${turma.codigo} - ${turma.disciplinas.join(", ")}</h3>
                    <p><strong>Horários:</strong> ${turma.horarios
                        .map((h) => `${h.diaSemana} (${h.horarioInicio} - ${h.horarioFim})`)
                        .join(", ")}</p>
                    <p><strong>Professores:</strong> ${turma.professores.map((p) => p.name).join(", ")}</p>
                </header>
            `;
            listaTurmas.appendChild(turmaCard);
        });
    }

    // Função para buscar turmas filtradas
   async function buscarTurmas(diaSemana) {
    try {
        // Atualize a URL para incluir o endereço completo do backend
        const response = await fetch(`http://127.0.0.1:9090/turma/listar?diaSemana=${diaSemana}`);
        if (!response.ok) {
            throw new Error("Erro ao buscar turmas");
        }
        const turmas = await response.json();
        exibirTurmas(turmas);
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar turmas. Tente novamente mais tarde.");
    }
}

    // Evento de filtro
    btnFiltrar.addEventListener("click", () => {
        const diaSemana = filtroDia.value;
        if (!diaSemana) {
            alert("Selecione um dia para filtrar.");
            return;
        }
        buscarTurmas(diaSemana);
    });

    // Evento para limpar filtro
    btnLimpar.addEventListener("click", () => {
        filtroDia.value = "";
        listaTurmas.innerHTML = "";
        nenhumaTurma.style.display = "none";
    });
});
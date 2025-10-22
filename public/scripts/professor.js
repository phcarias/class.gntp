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
            turmaCard.addEventListener("click", () => exibirDetalhesTurma(turma._id)); // Adiciona evento de clique
            listaTurmas.appendChild(turmaCard);
        });
    }

    // Função para buscar detalhes da turma
async function exibirDetalhesTurma(turmaId) {
    try {
        const response = await fetch(`http://127.0.0.1:9090/turma/detalhes/${turmaId}`);
        if (!response.ok) {
            throw new Error("Erro ao buscar detalhes da turma");
        }
        const turma = await response.json();

        // Exibe os detalhes da turma (exemplo: em um modal)
        const detalhesContainer = document.createElement("div");
        detalhesContainer.classList.add("detalhes-turma");
        detalhesContainer.innerHTML = `
            <h3>Detalhes da Turma</h3>
            <p><strong>Código:</strong> ${turma.codigo}</p>
            <p><strong>Disciplina:</strong> ${turma.disciplina}</p>
            <p><strong>Horários:</strong> ${turma.horarios
                .map((h) => `${h.diaSemana} (${h.horarioInicio} - ${h.horarioFim})`)
                .join(", ")}</p>
            <p><strong>Professores:</strong> ${turma.professores
                .map((p) => `${p.name} (${p.email})`)
                .join(", ")}</p>
            <p><strong>Alunos:</strong> ${turma.alunos
                .map((a) => `${a.name} (${a.email})`)
                .join(", ")}</p>
            <button id="fechar-detalhes" class="botao-limpar">Fechar</button>
        `;

        // Adiciona o modal à página
        document.body.appendChild(detalhesContainer);
        document.body.classList.add("modal-aberto"); // Adiciona a classe para o fundo escuro

        // Evento para fechar os detalhes
        document.getElementById("fechar-detalhes").addEventListener("click", () => {
            detalhesContainer.remove();
            document.body.classList.remove("modal-aberto"); // Remove a classe do fundo escuro
        });
    } catch (error) {
        console.error("Erro ao buscar detalhes da turma:", error);
        alert("Erro ao buscar detalhes da turma. Tente novamente mais tarde.");
    }
}

    // Função para buscar turmas filtradas
    async function buscarTurmas(diaSemana) {
        try {
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

document.addEventListener("DOMContentLoaded", () => {
    const turmaSelect = document.getElementById("turma-select");
    const btnCarregarAlunos = document.getElementById("btn-carregar-alunos");
    const listaAlunos = document.getElementById("lista-alunos");
    const btnSalvarFrequencia = document.getElementById("btn-salvar-frequencia");

    // Função para carregar as turmas no dropdown
    async function carregarTurmas() {
        try {
            const response = await fetch("http://127.0.0.1:9090/turma/listar");
            const turmas = await response.json();

            turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
            turmas.forEach(turma => {
                turmaSelect.innerHTML += `<option value="${turma._id}">${turma.codigo} - ${turma.disciplina}</option>`;
            });
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            alert("Erro ao carregar turmas. Tente novamente mais tarde.");
        }
    }

    // Função para carregar os alunos de uma turma
    async function carregarAlunos(turmaId) {
        try {
            const response = await fetch(`http://127.0.0.1:9090/turma/detalhes/${turmaId}`);
            const turma = await response.json();

            listaAlunos.innerHTML = ""; // Limpa a lista de alunos
            turma.alunos.forEach(aluno => {
                listaAlunos.innerHTML += `
                    <div class="aluno-item">
                        <span>${aluno.name} (${aluno._id})</span>
                        <label>
                            <input type="radio" name="frequencia-${aluno._id}" value="presente" /> Presente
                        </label>
                        <label>
                            <input type="radio" name="frequencia-${aluno._id}" value="falta" /> Falta
                        </label>
                    </div>
                `;
            });

            btnSalvarFrequencia.style.display = "block"; // Exibe o botão de salvar
        } catch (error) {
            console.error("Erro ao carregar alunos:", error);
            alert("Erro ao carregar alunos. Tente novamente mais tarde.");
        }
    }

    // Função para salvar a frequência
    async function salvarFrequencia() {
        const frequencia = [];
        listaAlunos.querySelectorAll(".aluno-item").forEach(item => {
            const alunoId = item.querySelector("span").textContent.match(/\(([^)]+)\)/)[1];
            const status = item.querySelector(`input[name="frequencia-${alunoId}"]:checked`);
            if (status) {
                frequencia.push({ alunoId, status: status.value });
            }
        });

        if (frequencia.length === 0) {
            alert("Nenhuma frequência foi marcada.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:9090/turma/salvar-frequencia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ turmaId: turmaSelect.value, frequencia }),
            });

            if (!response.ok) {
                throw new Error("Erro ao salvar frequência");
            }

            alert("Frequência salva com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar frequência:", error);
            alert("Erro ao salvar frequência. Tente novamente mais tarde.");
        }
    }

    // Eventos
    btnCarregarAlunos.addEventListener("click", () => {
        const turmaId = turmaSelect.value;
        if (!turmaId) {
            alert("Selecione uma turma.");
            return;
        }
        carregarAlunos(turmaId);
    });

    btnSalvarFrequencia.addEventListener("click", salvarFrequencia);

    // Carregar as turmas ao carregar a página
    carregarTurmas();
});
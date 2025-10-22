document.addEventListener("DOMContentLoaded", () => {
    const menuLinks = document.querySelectorAll(".menu-lateral a");
    const sections = document.querySelectorAll(".conteudo-principal section");

    // Função para mostrar a seção ativa
    function mostrarSecao(id) {
        sections.forEach(section => {
            section.style.display = section.id === id ? "block" : "none";
        });

        // Atualiza o menu ativo
        menuLinks.forEach(link => {
            link.parentElement.classList.toggle("ativo", link.getAttribute("href") === `#${id}`);
        });
    }

    // Adiciona evento de clique nos links do menu
    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const id = link.getAttribute("href").substring(1); // Obtém o ID da seção
            mostrarSecao(id);

            // Carrega o gráfico ao acessar a seção "resumo-frequencia"
            if (id === "resumo-frequencia") {
                carregarGraficoFrequencia();
            }
        });
    });

    // Mostra a primeira seção ao carregar a página
    const primeiraSecao = sections[0].id;
    mostrarSecao(primeiraSecao);

    // Função para carregar o gráfico de frequência
    async function carregarGraficoFrequencia() {
        const ctx = document.getElementById("grafico-frequencia").getContext("2d");

        // Simulação de dados (substitua pelos dados reais do backend)
        const dadosFrequencia = {
            frequenciaGeral: 85, // Porcentagem de presença geral
            faltasSemana: 2, // Número de faltas na semana
            faltasMes: 5, // Número de faltas no mês
            dias: ["Seg", "Ter", "Qua", "Qui", "Sex"], // Dias da semana
            presencas: [1, 1, 0, 1, 1], // 1 = Presente, 0 = Falta
        };

        // Atualiza as informações de frequência
        document.getElementById("frequencia-geral").textContent = dadosFrequencia.frequenciaGeral;
        document.getElementById("faltas-semana").textContent = dadosFrequencia.faltasSemana;
        document.getElementById("faltas-mes").textContent = dadosFrequencia.faltasMes;

        // Renderiza o gráfico
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: dadosFrequencia.dias,
                datasets: [
                    {
                        label: "Presenças (1 = Presente, 0 = Falta)",
                        data: dadosFrequencia.presencas,
                        backgroundColor: dadosFrequencia.presencas.map(p => (p === 1 ? "#2ecc71" : "#e74c3c")),
                        borderColor: "#34495e",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.raw === 1 ? "Presente" : "Falta";
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    }
});
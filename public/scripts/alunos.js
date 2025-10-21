document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            // Remove a classe ativa de todas as abas e conteúdos
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Adiciona a classe ativa na aba e no conteúdo correspondente
            tab.classList.add("active");
            tabContents[index].classList.add("active");
        });
    });
});
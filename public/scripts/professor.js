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
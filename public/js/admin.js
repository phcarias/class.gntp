document.addEventListener('DOMContentLoaded', function () {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
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

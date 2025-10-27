const API_BASE = "http://localhost:9090";
// Adaptação para o login.html (campos: usuario e senha)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.formulario-login');

    if (!form) return;

        // Inicialização quando a página carrega
      

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuario, password: senha })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data._id);
                localStorage.setItem('username', data.name);
                localStorage.setItem('type', data.type);

                // Redirecionamento baseado no tipo de usuário
                if (data.type === 'admin') {
                    window.location.href = '/admin';
                } else if (data.type === 'professor') {
                    window.location.href = '/professorhtml';
                } else if (data.type === 'aluno') {
                    window.location.href = '/alunohtml';
                } else {
                    alert('Tipo de usuário desconhecido.');
                }
            } else {
                alert(data.msg || 'Falha no login');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    });
});

/*
// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        }); 

        const data = await response.json();

        if (response.ok) {
            // Salvar token e redirecionar
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            if (data.type === 'admin') {
                window.location.href = '/admin';
            }
        } else {
            showMessage(data.msg, 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
    }
});

*/
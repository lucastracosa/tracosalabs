document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita que o formulário seja enviado automaticamente

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Redireciona para a página desejada após o login
            window.location.href = "/dashboard";
        } else {
            // Exibe uma mensagem de erro
            alert("Credenciais inválidas. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao conectar com o servidor.");
    }
});

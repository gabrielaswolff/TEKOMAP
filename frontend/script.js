async function logar(event) {
    event.preventDefault();

    const email = document.getElementById('email_login').value;
    const password = document.getElementById('password_login').value;

    const data = { email, password };
    
    const response = await fetch("http://localhost:3007/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    let results = await response.json();

    if (results.success) {
        let userData = results.data;
        localStorage.setItem('informacoes', JSON.stringify({
            email: userData.email,
            perfil: userData.perfil
        }));

        alert(results.message);
        window.location.href = "/frontend/index.html";
    } else {
        alert(results.message);
    }
}
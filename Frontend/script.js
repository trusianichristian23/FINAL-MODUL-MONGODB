const BACKEND_URL = 'https://final-modulo-mongodb-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // 🌐 CONTROLLO RECOVERY TOKEN DA GOOGLE OAUTH
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');

    if (googleToken) {
        localStorage.setItem('accessToken', googleToken); // Salva il token inviato dal backend
        // Pulisce la barra dell'indirizzo del browser per estetica e sicurezza
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('Login con Google effettuato con successo!');
    }

    checkAuthUI();
    fetchAuthors();
    fetchPosts();
});

// CONTROLLO UI UTENTE E STATO TOKEN (Gestione classi e visibilità pulsante Google)
function checkAuthUI() {
    const token = localStorage.getItem('accessToken');
    const authStatus = document.getElementById('authStatus');
    const loginForm = document.getElementById('loginForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        if (authStatus) {
            authStatus.innerText = "🟢 Stato: Autenticato! Modulo Blog Sbloccato.";
            authStatus.className = "auth-status-bar authenticated"; 
        }
        if (loginForm) loginForm.style.display = 'none';
        if (googleLoginBtn) googleLoginBtn.style.display = 'none'; // Nasconde il tasto Google se già connesso
        if (logoutBtn) logoutBtn.style.display = 'block'; 
    } else {
        if (authStatus) {
            authStatus.innerText = "🔴 Stato: Non Autenticato. Fai il login per vedere o creare i Post.";
            authStatus.className = "auth-status-bar unauthenticated"; 
        }
        if (loginForm) loginForm.style.display = 'flex';
        if (googleLoginBtn) {
            googleLoginBtn.style.display = 'inline-block'; // Mostra il tasto Google se disconnesso
            googleLoginBtn.href = `${BACKEND_URL}/authors/googleLogin`; // 👈 Rende dinamico il link verso Render
        }
        if (logoutBtn) logoutBtn.style.display = 'none'; 
    }
}

// 🔑 COMPITO: Esegue il login classico e memorizza il token nel localStorage
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${BACKEND_URL}/authors/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('accessToken', data.token); 
            alert('Login effettuato con successo!');
            checkAuthUI();
            fetchPosts(); 
        } else {
            alert(`Errore Login: ${data.message}`);
        }
    } catch (error) {
        console.error("Errore login:", error);
    }
});

// LOGOUT UTENTE
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    alert('Disconnesso correttamente.');
    checkAuthUI();
    fetchPosts();
});

// GET AUTORI (Accessibile liberamente)
async function fetchAuthors() {
    try {
        const response = await fetch(`${BACKEND_URL}/authors`);
        const data = await response.json();
        const container = document.getElementById('authorsList');
        if (!container) return;
        container.innerHTML = '';
        
        if (data.authors && data.authors.length > 0) {
            data.authors.forEach(author => {
                let nome = author.nome || 'Autore';
                let cognome = author.cognome || '';
                container.innerHTML += `
                    <div class="item-box">
                        <strong>👤 ${nome} ${cognome}</strong>
                        <p>Email: ${author.email}</p>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>Nessun autore trovato.</p>';
        }
    } catch (error) {
        console.error("Errore caricamento autori:", error);
    }
}

// POST REGISTRAZIONE AUTORE
document.getElementById('authorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('authNome').value,
        cognome: document.getElementById('authCognome').value,
        email: document.getElementById('authEmail').value,
        password: document.getElementById('authPassword').value,
        dataDiNascita: document.getElementById('authData').value,
        avatar: document.getElementById('authAvatar').value
    };

    try {
        const response = await fetch(`${BACKEND_URL}/authors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('Autore registrato con successo! Ora effettua il login sopra.');
            fetchAuthors();
        } else {
            const errData = await response.json();
            alert(`Errore registrazione: ${errData.message}`);
        }
    } catch (error) {
        console.error("Errore registrazione autore:", error);
    }
});

// 🔒 GET POST (Usa il token nell'header)
async function fetchPosts() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('postsList');
    if (!container) return;

    if (!token) {
        container.innerHTML = '<p style="color: grey; font-style: italic;">Sblocca questa sezione eseguendo il login in alto.</p>';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/blogPosts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        if (response.status === 401) {
            container.innerHTML = '<p style="color: red;">Sessione non valida. Riesegui il login.</p>';
            return;
        }

        const data = await response.json();
        container.innerHTML = '';

        if (data.blogPosts && data.blogPosts.length > 0) {
            data.blogPosts.forEach(post => {
                const readVal = post.readTime ? post.readTime.value : 5;
                const readUnit = post.readTime ? post.readTime.unit : 'min';
                container.innerHTML += `
                    <div class="item-box">
                        <strong>📝 ${post.title}</strong> (${post.category})
                        <p>Autore: ${post.author}</p>
                        <p><small>Lettura: ${readVal} ${readUnit}</small></p>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>Nessun post trovato.</p>';
        }
    } catch (error) {
        console.error("Errore caricamento post:", error);
    }
}

// 🔒 POST CREAZIONE BLOG POST (Usa il token nell'header)
document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    if (!token) {
        alert("Devi effettuare il login per poter pubblicare un post!");
        return;
    }

    const payload = {
        category: document.getElementById('postCategory').value,
        title: document.getElementById('postTitle').value,
        cover: document.getElementById('postCover').value,
        author: document.getElementById('postAuthor').value,
        readTime: {
            value: Number(document.getElementById('postReadValue').value),
            unit: document.getElementById('postReadUnit').value
        },
        content: document.getElementById('postContent').value
    };

    try {
        const response = await fetch(`${BACKEND_URL}/blogPosts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            document.getElementById('postForm').reset();
            alert('Post pubblicato!');
            fetchPosts();
        } else {
            const errData = await response.json();
            alert(`Errore pubblicazione: ${errData.message}`);
        }
    } catch (error) {
        console.error("Errore salvataggio post:", error);
    }
});
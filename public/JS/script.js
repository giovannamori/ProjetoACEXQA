// Configuração do Firebase (substitua com suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyC0FPLJlifyJImPS8hNXnifEQPDXAnGuW8",
  authDomain: "qabazar-ffe21.firebaseapp.com",
  projectId: "qabazar-ffe21",
  storageBucket: "qabazar-ffe21.firebasestorage.app",
  messagingSenderId: "183120823667",
  appId: "1:183120823667:web:b4563c32a6f1046003f106"
};

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        // Autenticação com Firebase
        const userCredential = await firebase.auth().signInWithEmailAndPassword(username, password);
        
        messageDiv.textContent = 'Login bem-sucedido! Redirecionando...';
        messageDiv.style.color = 'green';
        
        setTimeout(() => {
            window.location.href = '/public/docs/inicio.html';
        }, 1000);
        
    } catch (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Senha incorreta';
        }
        
        messageDiv.textContent = errorMessage;
        messageDiv.style.color = 'red';
        console.error('Erro:', error);
    }
});
// Configuração do Firebase
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
const db = firebase.firestore();

// Elementos da UI
const statusMessage = document.getElementById('statusMessage');
const form = document.getElementById('itemForm');

// Função para mostrar mensagens de status
function showStatus(message, type, details = '') {
    statusMessage.innerHTML = message + (details ? `<div class="error-details">${details}</div>` : '');
    statusMessage.className = 'status-message ' + type;
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Função para traduzir erros comuns do Firebase
function translateFirebaseError(error) {
    const errorMap = {
        'permission-denied': 'Permissão negada: Você não tem acesso ao banco de dados',
        'unauthenticated': 'Não autenticado: Faça login novamente',
        'invalid-argument': 'Dados inválidos foram enviados',
        'not-found': 'Coleção não encontrada',
        'already-exists': 'Documento já existe',
        'resource-exhausted': 'Limite de cota excedido',
        'failed-precondition': 'Operação não permitida no estado atual',
        'aborted': 'Operação abortada',
        'unavailable': 'Serviço indisponível no momento',
        'internal': 'Erro interno do servidor'
    };
    return errorMap[error.code] || error.message;
}

// Adiciona evento de submit ao formulário
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    showStatus("🔌 Conectando ao banco de dados...", "connecting");
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        // Captura os valores dos campos
        const valor = parseFloat(document.getElementById('itemValor').value.replace(/\./g,'').replace(',','.'));
        const quantidadeitens = parseFloat(document.getElementById('itemQuantidade').value);
        const formaPagamento = document.getElementById('formaPagamento').value || '';
        const data = document.getElementById('itemData').value;
        const comprador = document.getElementById('itemComprador').value || 'Anônimo';
        const telefone = document.getElementById('itemTelefone').value || '';
        const email = document.getElementById('itemEmail').value || '';

        // Validação avançada
        if (isNaN(valor) || valor <= 0) throw new Error('O valor deve ser um número maior que zero');
        if (!data) throw new Error('A data é obrigatória');

        showStatus("📤 Enviando dados para o servidor...", "connecting");

        // Salva no Firestore
        await db.collection('vendas').add({
            valor: valor,
            quantidadeitens: quantidadeitens,
            formaPagamento: formaPagamento,
            data: data,
            comprador: comprador,
            telefone: telefone,
            email: email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showStatus("Venda registrada com sucesso!", "success");
        form.reset();
        document.getElementById('itemData').value = getCurrentDate();

        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error("Erro detalhado:", error);
        let errorMessage = "❌ Erro ao registrar venda";
        let errorDetails = error.message || '';
        if (error.code) {
            errorMessage = translateFirebaseError(error);
            errorDetails = `Código: ${error.code}\nMensagem: ${error.message}`;
        }
        showStatus(errorMessage, "error", errorDetails);
    } finally {
        submitButton.disabled = false;
    }
});

// Funções auxiliares
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}
document.getElementById('itemData').value = getCurrentDate();

// Logout
function sair() {
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '/index.html';
        });
    }
}

// Máscara do valor
const itemValorInput = document.getElementById('itemValor');
itemValorInput.addEventListener('input', () => {
    let valor = itemValorInput.value.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2);
    valor = valor.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    itemValorInput.value = valor;
});

// Máscara do telefone
const telefoneInput = document.getElementById('itemTelefone');
telefoneInput.addEventListener('input', () => {
    let valor = telefoneInput.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length <= 10) valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    else valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
    telefoneInput.value = valor;
});

// Monitoramento de conexão e autenticação
firebase.firestore().enableNetwork()
    .then(() => console.log("Online"))
    .catch(err => console.error("Erro de conexão:", err));

firebase.auth().onAuthStateChanged((user) => {
    if (!user) window.location.href = '/index.html';
    else {
        db.collection('vendas').limit(1).get()
            .then(() => console.log("Permissões OK"))
            .catch(err => showStatus("Verifique suas permissões de acesso", "warning", translateFirebaseError(err)));
    }
});

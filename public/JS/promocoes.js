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

// Inicialize o EmailJS com seu User ID
emailjs.init("o8OaWiUUX69SlxnTY");

// Função para extrair e-mails únicos da coleção "vendas"
async function extrairEmailsUnicos() {
    try {
        console.log("Iniciando extração de e-mails...");
        const snapshot = await db.collection("vendas").get();
        console.log(`Encontradas ${snapshot.size} vendas`);

        const emailsSet = new Set();

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.email) {
                emailsSet.add(data.email.trim().toLowerCase());
                console.log(`E-mail encontrado: ${data.email}`);
            }
        });

        console.log(`Total de e-mails únicos: ${emailsSet.size}`);
        return Array.from(emailsSet);
    } catch (error) {
        console.error("Erro ao extrair e-mails:", error);
        return [];
    }
}

// Função para enviar e-mails de promoção
async function enviarPromocoes(dataFormatada, discount, categoriasSelecionadas) {
    try {
        console.log("Iniciando envio de promoções...");
        const emails = await extrairEmailsUnicos();
        
        if (emails.length === 0) {
            console.warn("Nenhum e-mail encontrado para enviar promoções");
            return { success: false, message: "Nenhum e-mail encontrado para enviar promoções" };
        }

        console.log(`Enviando promoções para ${emails.length} e-mails`);

        let emailsEnviados = 0;
        let emailsComErro = 0;

        // Enviar e-mail para cada endereço
        for (const email of emails) {
            try {
                const templateParams = {
                    to_email: email,
                    data_promocao: dataFormatada,
                    desconto: discount + "%",
                    categorias: categoriasSelecionadas.join(", "),
                    message: `Aproveite nosso desconto de ${discount}% nas categorias: ${categoriasSelecionadas.join(", ")}!`
                };

                console.log(`Enviando e-mail para: ${email}`);
                
                const response = await emailjs.send(
                    "service_b2g2ngc",
                    "template_bikz46i",
                    templateParams
                );
                
                console.log(`E-mail enviado para ${email}:`, response.status, response.text);
                emailsEnviados++;
                
            } catch (error) {
                console.error(`Erro ao enviar para ${email}:`, error);
                emailsComErro++;
            }
        }

        console.log(`Resumo: ${emailsEnviados} e-mails enviados, ${emailsComErro} com erro`);
        return { 
            success: true, 
            message: `Promoções enviadas com sucesso! ${emailsEnviados} e-mails enviados.`,
            detalhes: { enviados: emailsEnviados, erros: emailsComErro }
        };

    } catch (error) {
        console.error("Erro geral no envio de promoções:", error);
        return { success: false, message: "Erro ao enviar promoções: " + error.message };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const db = firebase.firestore();
    const categoriasRef = db.collection("categorias");

    const categoriasContainer = document.getElementById("categoriasContainer");
    const btnAddCategoria = document.getElementById("btnAddCategoria");
    const novaCategoriaDiv = document.getElementById("novaCategoriaDiv");
    const novaCategoriaInput = document.getElementById("novaCategoriaInput");
    const salvarCategoria = document.getElementById("salvarCategoria");
    const fecharCategoria = document.getElementById("fecharCategoria");
    const toggleCategorias = document.getElementById("toggleCategorias");
    const categoriasContent = document.getElementById("categoriasContent");
    const toggleIcon = document.getElementById("toggleIcon");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const btnEnviarPromocao = document.getElementById("btnEnviarPromocao");

    // Toggle para minimizar/maximizar categorias
    toggleCategorias.addEventListener("click", () => {
        categoriasContent.classList.toggle("collapsed");
        toggleIcon.classList.toggle("fa-chevron-down");
        toggleIcon.classList.toggle("fa-chevron-up");
    });

    // Mostrar campo para adicionar nova categoria
    btnAddCategoria.addEventListener("click", () => {
        novaCategoriaDiv.style.display = "block";
    });

    // Fechar campo de nova categoria
    fecharCategoria.addEventListener("click", () => {
        novaCategoriaDiv.style.display = "none";
        novaCategoriaInput.value = "";
    });

    // Função para carregar categorias do Firestore
    async function carregarCategorias() {
        try {
            categoriasContainer.innerHTML = ""; // limpa antes de recarregar
            const snapshot = await categoriasRef.get();
            console.log(`Carregadas ${snapshot.size} categorias`);

            snapshot.forEach(doc => {
                const id = doc.id;
                const nome = doc.data().nome;
                const categoriaItem = document.createElement("div");
                categoriaItem.className = "categoria-item";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = nome;
                checkbox.id = `categoria-${id}`;

                const label = document.createElement("label");
                label.htmlFor = `categoria-${id}`;
                label.textContent = nome;
                label.style.cursor = "pointer";
                label.style.marginLeft = "5px";

                // Botão de excluir
                const btnExcluir = document.createElement("button");
                btnExcluir.type = "button";
                btnExcluir.className = "btn-excluir";
                btnExcluir.innerHTML = '<i class="fas fa-trash"></i>';
                btnExcluir.title = "Excluir categoria";
                
                // Evento para excluir categoria
                btnExcluir.addEventListener("click", async () => {
                    if(confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
                        try {
                            await categoriasRef.doc(id).delete();
                            carregarCategorias(); // Recarrega a lista
                            console.log(`Categoria "${nome}" excluída com sucesso`);
                        } catch (error) {
                            console.error("Erro ao excluir categoria:", error);
                            alert("Erro ao excluir categoria: " + error.message);
                        }
                    }
                });

                categoriaItem.appendChild(checkbox);
                categoriaItem.appendChild(label);
                categoriaItem.appendChild(btnExcluir);
                categoriasContainer.appendChild(categoriaItem);
            });
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    }

    // Função para excluir categoria
    async function excluirCategoria(id, nome) {
        if(confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
            try {
                await categoriasRef.doc(id).delete();
                carregarCategorias();
                console.log(`Categoria "${nome}" excluída com sucesso`);
            } catch (error) {
                console.error("Erro ao excluir categoria:", error);
                alert("Erro ao excluir categoria: " + error.message);
            }
        }
    }

    // Salvar nova categoria no banco
    salvarCategoria.addEventListener("click", async () => {
        const nome = novaCategoriaInput.value.trim();
        if (nome) {
            try {
                await categoriasRef.add({ nome });
                novaCategoriaInput.value = "";
                novaCategoriaDiv.style.display = "none";
                carregarCategorias();
                console.log(`Categoria "${nome}" adicionada com sucesso`);
            } catch (error) {
                console.error("Erro ao salvar categoria:", error);
                alert("Erro ao salvar categoria: " + error.message);
            }
        }
    });

    // Captura o envio do formulário
    document.getElementById("promoForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // Validação básica
        const date = document.getElementById("promoDate").value;
        const discount = document.getElementById("promoDiscount").value;
        
        if (!date || !discount) {
            alert("Por favor, preencha todos os campos obrigatórios!");
            return;
        }

        // Pega as categorias marcadas
        const categoriasSelecionadas = Array.from(categoriasContainer.querySelectorAll("input[type=checkbox]:checked"))
            .map(cb => cb.value);

        if (categoriasSelecionadas.length === 0) {
            alert("Selecione pelo menos uma categoria!");
            return;
        }

        // Converte a data para o formato brasileiro
        const [ano, mes, dia] = date.split("-");
        const dataFormatada = `${dia}/${mes}/${ano}`;

        console.log("Dados da promoção:", {
            data: dataFormatada,
            desconto: discount,
            categorias: categoriasSelecionadas
        });

        // Mostra indicador de carregamento
        loadingIndicator.style.display = "block";
        btnEnviarPromocao.disabled = true;

        try {
            // 1. Salvar promoção no Firestore
            await db.collection("promocoes").add({
                data: dataFormatada,
                desconto: discount,
                categorias: categoriasSelecionadas,
                dataCriacao: new Date()
            });
            console.log("Promoção salva no Firestore");

            // 2. Enviar e-mails
            const resultado = await enviarPromocoes(dataFormatada, discount, categoriasSelecionadas);
            
            if (resultado.success) {
                alert(resultado.message);
                // Limpar formulário
                document.getElementById("promoForm").reset();
                // Desmarcar todas as categorias
                categoriasContainer.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
            } else {
                alert(resultado.message);
            }

        } catch (error) {
            console.error("Erro ao processar promoção:", error);
            alert("Erro ao processar promoção: " + error.message);
        } finally {
            // Esconde indicador de carregamento
            loadingIndicator.style.display = "none";
            btnEnviarPromocao.disabled = false;
        }
    });

    // Carregar categorias ao abrir a página
    carregarCategorias();
});

function sair() {
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '/index.html';
        });
    }
}

// Verifica se o usuário está autenticado
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        console.log("Usuário logado:", user.email);
    } else {
        console.log("Nenhum usuário logado, redirecionando...");
        window.location.href = "/index.html";
    }
});


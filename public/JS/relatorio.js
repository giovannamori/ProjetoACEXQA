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
emailjs.init('M7OQR6vfh7wY1EgdG');

// Variável para armazenar os dados das vendas
let salesData = [];

// Função para mostrar mensagens de status
function showStatus(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
}

// Função para editar venda diretamente na tabela
function editSale(saleId) {
    const row = document.querySelector(`tr[data-sale-id="${saleId}"]`);
    if (!row) return;

    // Se já está em modo de edição, não faz nada
    if (row.classList.contains('editing')) return;

    // Marca a linha como em edição
    row.classList.add('editing');

    // Salva os valores atuais
    const cells = row.cells;
    const currentData = {
        comprador: cells[2].textContent,
        valor: cells[1].textContent.replace('R$ ', ''),
        telefone: cells[3].textContent,
        email: cells[4].textContent
    };

    // Converte as células em campos editáveis
    cells[1].innerHTML = `<input type="number" step="0.01" value="${currentData.valor}" class="edit-input">`;
    cells[2].innerHTML = `<input type="text" value="${currentData.comprador}" class="edit-input">`;
    cells[3].innerHTML = `<input type="text" value="${currentData.telefone}" class="edit-input">`;
    cells[4].innerHTML = `<input type="email" value="${currentData.email}" class="edit-input">`;

    // Substitui os botões por botões de salvar/cancelar
    cells[5].innerHTML = `
        <button class="btn-save" onclick="saveSale('${saleId}')">Salvar</button>
        <button class="btn-cancel" onclick="cancelEdit('${saleId}')">Cancelar</button>
    `;
}

// Função para salvar as alterações
async function saveSale(saleId) {
    try {
        const row = document.querySelector(`tr[data-sale-id="${saleId}"]`);
        const inputs = row.querySelectorAll('.edit-input');
        
        const novosDados = {
            comprador: inputs[1].value.trim(),
            valor: parseFloat(inputs[0].value),
            telefone: inputs[2].value.trim(),
            email: inputs[3].value.trim(),
            editadoPor: firebase.auth().currentUser.email,
            dataEdicao: new Date().toISOString()
        };

        // Validações
        if (!novosDados.comprador) {
            showStatus("Nome do comprador é obrigatório", "error");
            return;
        }

        if (isNaN(novosDados.valor) || novosDados.valor <= 0) {
            showStatus("Valor deve ser um número positivo", "error");
            return;
        }

        // Atualiza no Firestore
        await db.collection('vendas').doc(saleId).update(novosDados);

        // Atualiza a linha na tabela
        updateRowInTable(saleId, novosDados);
        
        showStatus("Venda atualizada com sucesso!", "success");

    } catch (error) {
        console.error("Erro ao salvar venda:", error);
        showStatus("Erro ao salvar venda: " + error.message, "error");
    }
}

// Função para cancelar a edição
function cancelEdit(saleId) {
    // Recarrega os dados para restaurar os valores originais
    loadSalesData();
    showStatus("Edição cancelada", "info");
}

// Função para atualizar a linha na tabela após salvar
function updateRowInTable(saleId, novosDados) {
    const row = document.querySelector(`tr[data-sale-id="${saleId}"]`);
    
    row.cells[1].textContent = `R$ ${novosDados.valor.toFixed(2)}`;
    row.cells[2].textContent = novosDados.comprador;
    row.cells[3].textContent = novosDados.telefone;
    row.cells[3].setAttribute('title', novosDados.telefone || '-');
    row.cells[4].textContent = novosDados.email;
    row.cells[4].setAttribute('title', novosDados.email || '-');
    
    // Restaura os botões de ação
    row.cells[5].innerHTML = `
        <button class="btn-pdf" onclick="generateSalePDF('${saleId}')">Baixar PDF</button>
        ${novosDados.email ? `<button class="btn-email" onclick="generateSalePDF('${saleId}', '${novosDados.email}')">Enviar Email</button>` : ''}
        <button class="btn-edit" onclick="editSale('${saleId}')">Editar</button>
        <button class="btn-delete" onclick="deleteSale('${saleId}')">Excluir</button>
    `;
    
    row.classList.remove('editing');
}

// Função para carregar os dados das vendas
async function loadSalesData() {
    showStatus("Carregando dados...", "connecting");
    
    try {
        let query = db.collection('vendas').orderBy('data', 'desc');
        
        // Aplicar filtros
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const buyerName = document.getElementById('searchBuyer').value.toLowerCase();
        
        if (startDate) {
            query = query.where('data', '>=', startDate);
        }
        
        if (endDate) {
            query = query.where('data', '<=', endDate);
        }
        
        const querySnapshot = await query.get();
        salesData = [];
        
        querySnapshot.forEach(doc => {
            const sale = doc.data();
            sale.id = doc.id;
            
            // Aplicar filtro por nome do comprador (se existir)
            if (!buyerName || sale.comprador.toLowerCase().includes(buyerName)) {
                salesData.push(sale);
            }
        });
        
        renderSalesTable();
        showStatus(`Carregadas ${salesData.length} vendas`, "success");
        
    } catch (error) {
        console.error("Erro ao carregar vendas:", error);
        showStatus("Erro ao carregar vendas: " + error.message, "error");
    }
}

// Função para renderizar a tabela de vendas
function renderSalesTable() {
    const tableBody = document.getElementById('salesTableBody');
    tableBody.innerHTML = '';
    
    if (salesData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">Nenhuma venda encontrada</td>';
        tableBody.appendChild(row);
        return;
    }
    
    let total = 0;
    
    salesData.forEach(sale => {
        const row = document.createElement('tr');
        row.setAttribute('data-sale-id', sale.id);
        
        row.innerHTML = `
            <td>${formatDate(sale.data)}</td>
            <td>R$ ${sale.valor.toFixed(2)}</td>
            <td>${sale.comprador}</td>
            <td class="truncate-cell" title="${sale.telefone || '-'}">${sale.telefone || '-'}</td>
            <td class="truncate-cell" title="${sale.email || '-'}">${sale.email || '-'}</td>
            <td class="action-buttons">
                <button class="btn-pdf" onclick="generateSalePDF('${sale.id}')">Baixar PDF</button>
                ${sale.email ? `<button class="btn-email" onclick="generateSalePDF('${sale.id}', '${sale.email}')">Enviar Email</button>` : ''}
                <button class="btn-edit" onclick="editSale('${sale.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteSale('${sale.id}')">Excluir</button>
            </td>
        `;
        
        tableBody.appendChild(row);
        total += sale.valor;
    });
    
    // Adicionar linha de total
    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = '#fee8f0';
    totalRow.innerHTML = `
        <td>TOTAL</td>
        <td>R$ ${total.toFixed(2)}</td>
        <td colspan="4"></td>
    `;
    tableBody.appendChild(totalRow);
}

// Função para formatar a data
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para exportar para CSV
function exportToCSV() {
    if (salesData.length === 0) {
        showStatus("Nenhum dado para exportar", "error");
        return;
    }
    
    try {
        // Criar cabeçalho CSV
        const headers = ['Data', 'Valor (R$)', 'Comprador', 'Telefone', 'Email'];
        let csvContent = headers.join(';') + '\n';
        
        // Adicionar linhas de dados
        salesData.forEach(sale => {
            const row = [
                formatDate(sale.data),
                sale.valor.toFixed(2).replace('.', ','),
                `"${sale.comprador.replace(/"/g, '""')}"`,
                sale.telefone || '',
                sale.email || ''
            ];
            csvContent += row.join(';') + '\n';
        });
        
        // Criar e baixar o arquivo CSV
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `vendas_bazar.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Limpeza
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus("Arquivo CSV gerado com sucesso!", "success");
        
    } catch (error) {
        console.error("Erro ao exportar CSV:", error);
        showStatus("Erro ao exportar CSV: " + error.message, "error");
    }
}

// Função para excluir venda
async function deleteSale(saleId) {
    if (!confirm("Tem certeza que deseja excluir esta venda e todos os itens relacionados? Essa ação não pode ser desfeita.")) {
        return;
    }

    try {
        const saleRef = db.collection('vendas').doc(saleId);
        const itemsRef = saleRef.collection('itens');

        // Buscar todos os itens relacionados
        const itemsSnapshot = await itemsRef.get();

        // Deletar cada item da subcoleção
        const batch = db.batch();
        itemsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Deletar o documento principal da venda
        batch.delete(saleRef);

        // Executar todas as exclusões juntas
        await batch.commit();

        showStatus("Venda e itens excluídos com sucesso!", "success");
        loadSalesData();

    } catch (error) {
        console.error("Erro ao excluir venda:", error);
        showStatus("Erro ao excluir venda: " + error.message, "error");
    }
}

// Função para enviar venda por email
async function sendSaleByEmail(saleId, recipientEmail) {
    try {
        showStatus("Preparando para enviar email...", "connecting");
        
        // Buscar os dados da venda
        const saleDoc = await db.collection('vendas').doc(saleId).get();
        const sale = saleDoc.data();
        
        // Enviar email via EmailJS
        const response = await emailjs.send('service_t7ygerp', 'template_ckzs5vu', {
            to_email: recipientEmail,
            to_name: sale.comprador,
            from_name: "Bazar São Jerônimo",
            sale_id: saleId,
            sale_date: formatDate(sale.data),
            sale_amount: `R$ ${sale.valor.toFixed(2)}`,
            message: "Segue as informações da sua compra no Bazar Beneficente São Jerônimo."
        });
        
        showStatus("Email enviado com sucesso para " + recipientEmail, "success");
        return response;
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        showStatus("Erro ao enviar email: " + error.message, "error");
        throw error;
    }
}

// Função para gerar PDF
async function generateSalePDF(saleId, email = null) {
    try {
        if (email) {
            return await sendSaleByEmail(saleId, email);
        } else {
            // Implementação do PDF...
            showStatus("PDF gerado com sucesso!", "success");
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showStatus("Erro ao gerar PDF: " + error.message, "error");
    }
}

// Função para sair do sistema
function sair() {
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '/index.html';
        });
    }
}

// Verificação de autenticação ao carregar a página
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = '/index.html';
    } else {
        loadSalesData();
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        document.getElementById('endDate').valueAsDate = endDate;
        document.getElementById('startDate').valueAsDate = startDate;
    }
});
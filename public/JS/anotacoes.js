// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC0FPLJlifyJImPS8hNXnifEQPDXAnGuW8",
    authDomain: "qabazar-ffe21.firebaseapp.com",
    projectId: "qabazar-ffe21",
    storageBucket: "qabazar-ffe21.firebasestorage.app",
    messagingSenderId: "183120823667",
    appId: "1:183120823667:web:b4563c32a6f1046003f106"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variáveis globais
let notes = [];
let tasks = [];
let currentFilter = 'all';
let editingNoteId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  initCalendar();
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log("Usuário logado:", user.email);
      loadData();
    } else {
      console.log("Nenhum usuário logado, redirecionando...");
      window.location.href = "/index.html";
    }
  });
});

// Carrega dados do Firestore
function loadData() {
  db.collection("anotacoes").doc("dados").get().then(doc => {
    if (doc.exists) {
      notes = doc.data().notes || [];
      tasks = doc.data().tasks || [];
      renderContent();
    }
  }).catch(error => {
    console.error("Erro ao carregar dados:", error);
  });
}

// Salva dados no Firestore
function saveData() {
  db.collection("anotacoes").doc("dados").set({ notes, tasks })
    .catch(error => {
      console.error("Erro ao salvar dados:", error);
      showToast("Erro ao salvar dados. Tente novamente.");
    });
}

// Renderiza o conteúdo com base no filtro atual
function renderContent() {
  renderNotes();
  renderTasks();
  checkEmptyState();
}

// Verifica se deve mostrar o estado vazio
function checkEmptyState() {
  const emptyState = document.getElementById('empty-state');
  const hasNotes = document.getElementById('notes').children.length > 0;
  const hasTasks = document.getElementById('tasks').children.length > 0;
  
  if (!hasNotes && !hasTasks) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }
}

// Renderiza as anotações
function renderNotes() {
  const container = document.getElementById("notes");
  container.innerHTML = "";

  // Filtra as anotações conforme o filtro atual
  let filteredNotes = notes;
  if (currentFilter === 'important') {
    filteredNotes = notes.filter(note => note.important);
  } else if (currentFilter === 'tasks') {
    // Não mostrar anotações quando o filtro é de tarefas
    return;
  }

  // Ordena por importância e depois por data (mais recente primeiro)
  filteredNotes.sort((a, b) => {
    if (a.important !== b.important) {
      return b.important - a.important;
    }
    return new Date(b.date) - new Date(a.date);
  });

  filteredNotes.forEach(note => {
    const noteEl = createNoteElement(note);
    container.appendChild(noteEl);
  });
}

// Cria elemento de anotação - VERSÃO CORRIGIDA
function createNoteElement(note) {
  const noteEl = document.createElement("div");
  noteEl.className = "note";
  if (note.important) noteEl.classList.add("important");
  noteEl.setAttribute("data-id", note.id);

  const noteHeader = document.createElement("div");
  noteHeader.className = "note-header";

  const title = document.createElement("h3");
  title.className = "note-title";
  title.textContent = note.title;

  const actions = document.createElement("div");
  actions.className = "note-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "note-action-btn";
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    editNote(note.id);
  };

  const starBtn = document.createElement("button");
  starBtn.className = "note-action-btn";
  starBtn.innerHTML = note.important ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
  starBtn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleImportant(note.id);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "note-action-btn";
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteNote(note.id);
  };

  actions.appendChild(editBtn);
  actions.appendChild(starBtn);
  actions.appendChild(deleteBtn);

  noteHeader.appendChild(title);
  noteHeader.appendChild(actions);

  const content = document.createElement("div");
  content.className = "note-content";
  content.textContent = note.content;

  const date = document.createElement("div");
  date.className = "note-date";
  date.textContent = formatDate(note.date);

  noteEl.appendChild(noteHeader);
  noteEl.appendChild(content);
  noteEl.appendChild(date);

  return noteEl;
}

// Renderiza as tarefas
function renderTasks() {
  const container = document.getElementById("tasks");
  container.innerHTML = "";

  // Se o filtro atual é apenas para anotações, não mostrar tarefas
  if (currentFilter === 'notes') return;

  // Filtra tarefas se necessário
  let filteredTasks = tasks;
  if (currentFilter === 'important') {
    // Para tarefas, não temos o conceito de importante, então não mostrar
    return;
  }

  // Ordena por data (mais recente primeiro)
  filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));

  filteredTasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.setAttribute("data-id", task.id);

    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "note-action-btn";
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      editTask(task.id);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "note-action-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteTask(task.id);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    taskHeader.appendChild(title);
    taskHeader.appendChild(actions);

    const checklist = document.createElement("div");
    checklist.className = "task-checklist";

    task.tasks.forEach((item, index) => {
      const taskItem = document.createElement("div");
      taskItem.className = `task-item ${item.completed ? 'completed' : ''}`;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.onchange = () => toggleTask(task.id, index);
      
      const span = document.createElement("span");
      span.textContent = item.text;
      
      taskItem.appendChild(checkbox);
      taskItem.appendChild(span);
      checklist.appendChild(taskItem);
    });

    const addTaskBtn = document.createElement("button");
    addTaskBtn.className = "btn-primary-custom";
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Subtarefa';
    addTaskBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      addSubtask(task.id);
    };

    const date = document.createElement("div");
    date.className = "note-date";
    date.textContent = formatDate(task.date);

    taskEl.appendChild(taskHeader);
    taskEl.appendChild(checklist);
    taskEl.appendChild(addTaskBtn);
    taskEl.appendChild(date);

    container.appendChild(taskEl);
  });
}

// Formata data para exibição
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Adiciona nova anotação
function addNote() {
  editingNoteId = null;
  document.getElementById('modalTitle').textContent = 'Nova Anotação';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteImportant').checked = false;
  document.getElementById('noteModal').style.display = 'block';
}

// Edita anotação existente
function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    editingNoteId = id;
    document.getElementById('modalTitle').textContent = 'Editar Anotação';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteImportant').checked = note.important;
    document.getElementById('noteModal').style.display = 'block';
  }
}

// Salva anotação (nova ou editada)
function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const important = document.getElementById('noteImportant').checked;

  if (!title) {
    showToast('Por favor, informe um título para la anotação.');
    return;
  }

  if (editingNoteId) {
    // Editar anotação existente
    const noteIndex = notes.findIndex(n => n.id === editingNoteId);
    if (noteIndex !== -1) {
      notes[noteIndex].title = title;
      notes[noteIndex].content = content;
      notes[noteIndex].important = important;
      showToast('Anotação atualizada com sucesso!');
    }
  } else {
    // Nova anotação
    const id = Date.now();
    notes.push({
      id,
      title,
      content,
      important,
      date: new Date().toISOString()
    });
    showToast('Anotação criada com sucesso!');
  }

  saveData();
  renderContent();
  closeModal();
}

// Fecha o modal
function closeModal() {
  document.getElementById('noteModal').style.display = 'none';
}

// Alterna importância da anotação - VERSÃO CORRIGIDA
function toggleImportant(id) {
  console.log("Tentando favoritar anotação com ID:", id);
  
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex !== -1) {
    notes[noteIndex].important = !notes[noteIndex].important;
    console.log("Anotação atualizada:", {
      id: notes[noteIndex].id,
      title: notes[noteIndex].title,
      important: notes[noteIndex].important
    });
    
    saveData();
    renderContent();
    showToast(notes[noteIndex].important ? 'Marcada como importante.' : 'Desmarcada como importante.');
  } else {
    console.error("Anotação não encontrada com ID:", id);
    console.log("IDs disponíveis:", notes.map(n => n.id));
    showToast('Erro: Anotação não encontrada.');
  }
}

// Exclui anotação
function deleteNote(id) {
  if (confirm('Tem certeza que deseja excluir esta anotação?')) {
    notes = notes.filter(n => n.id !== id);
    saveData();
    renderContent();
    showToast('Anotação excluída.');
  }
}

// Mostra formulário para nova tarefa
function showNewTask() {
  const id = Date.now();
  const task = {
    id,
    title: 'Nova Lista de Tarefas',
    tasks: [],
    date: new Date().toISOString()
  };
  tasks.push(task);
  saveData();
  renderContent();
  editTask(id);
}

// Edita tarefa existente
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    const newTitle = prompt('Digite o novo título para a lista de tarefas:', task.title);
    if (newTitle !== null) {
      task.title = newTitle.trim();
      saveData();
      renderContent();
    }
  }
}

// Adiciona subtarefa
function addSubtask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const subtaskText = prompt('Digite a nova subtarefa:');
    if (subtaskText && subtaskText.trim()) {
      task.tasks.push({
        text: subtaskText.trim(),
        completed: false
      });
      saveData();
      renderContent();
      showToast('Subtarefa adicionada.');
    }
  }
}

// Alterna estado da subtarefa (concluída/não concluída)
function toggleTask(taskId, index) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.tasks[index]) {
    task.tasks[index].completed = !task.tasks[index].completed;
    saveData();
    renderContent();
  }
}

// Exclui tarefa
function deleteTask(id) {
  if (confirm('Tem certeza que deseja excluir esta lista de tarefas?')) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    renderContent();
    showToast('Lista de tarefas excluída.');
  }
}

// Pesquisa nas anotações e tarefas
function searchNotes() {
  const keyword = document.getElementById("search").value.toLowerCase().trim();
  
  if (!keyword) {
    renderContent();
    return;
  }

  // Filtra anotações
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(keyword) || 
    n.content.toLowerCase().includes(keyword)
  );

  // Filtra tarefas
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(keyword) ||
    t.tasks.some(task => task.text.toLowerCase().includes(keyword))
  );

  // Renderiza resultados
  renderSearchResults(filteredNotes, filteredTasks);
}

// Renderiza resultados da pesquisa
function renderSearchResults(filteredNotes, filteredTasks) {
  const notesContainer = document.getElementById("notes");
  const tasksContainer = document.getElementById("tasks");
  
  notesContainer.innerHTML = "";
  tasksContainer.innerHTML = "";

  // Renderiza anotações filtradas
  filteredNotes.forEach(note => {
    const noteEl = createNoteElement(note);
    notesContainer.appendChild(noteEl);
  });

  // Renderiza tarefas filtradas
  filteredTasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.setAttribute("data-id", task.id);

    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    taskHeader.appendChild(title);

    const checklist = document.createElement("div");
    checklist.className = "task-checklist";

    task.tasks.forEach((item, index) => {
      const taskItem = document.createElement("div");
      taskItem.className = `task-item ${item.completed ? 'completed' : ''}`;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.disabled = true;
      
      const span = document.createElement("span");
      span.textContent = item.text;
      
      taskItem.appendChild(checkbox);
      taskItem.appendChild(span);
      checklist.appendChild(taskItem);
    });

    const date = document.createElement("div");
    date.className = "note-date";
    date.textContent = formatDate(task.date);

    taskEl.appendChild(taskHeader);
    taskEl.appendChild(checklist);
    taskEl.appendChild(date);

    tasksContainer.appendChild(taskEl);
  });

  checkEmptyState();
}

// Altera o filtro atual
function changeFilter(filter) {
  currentFilter = filter;
  
  // Atualiza botões de filtro
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
  
  // Renderiza conteúdo com o novo filtro
  renderContent();
}

// Mostra notificação toast
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Inicializa o calendário
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  const savedEvents = JSON.parse(localStorage.getItem('meusEventos')) || [];

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    editable: true,
    selectable: true,
    events: savedEvents,

    dateClick: function(info) {
      const title = prompt('Digite o título do evento:');
      if (title) {
        const newEvent = {
          title: title,
          start: info.dateStr,
          allDay: true,
        };
        calendar.addEvent(newEvent);
        savedEvents.push(newEvent);
        localStorage.setItem('meusEventos', JSON.stringify(savedEvents));
      }
    },

    eventClick: function(info) {
      if (confirm(`Deseja remover o evento "${info.event.title}"?`)) {
        info.event.remove();
        const updatedEvents = savedEvents.filter(e =>
          !(e.title === info.event.title && e.start === info.event.startStr)
        );
        localStorage.setItem('meusEventos', JSON.stringify(updatedEvents));
      }
    }
  });

  calendar.render();
}

// Função de logout
function sair() {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    firebase.auth().signOut().then(() => {
      window.location.href = '/index.html';
    }).catch(error => {
      console.error("Erro ao sair:", error);
    });
  }
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
  const modal = document.getElementById('noteModal');
  if (event.target === modal) {
    closeModal();
  }
};
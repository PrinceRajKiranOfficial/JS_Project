// Smart Task Manager JavaScript

// Select DOM elements
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const clockGreeting = document.getElementById('clock-greeting');

let tasks = [];
let currentFilter = 'all';
let dragSrcEl = null;

// Initialize app
function init() {
    loadTasksFromStorage();
    renderTasks();
    updateClockGreeting();
    setInterval(updateClockGreeting, 30000); // Update every 30 seconds
}

// Load tasks from localStorage
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem('smartTaskManagerTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Save tasks to localStorage
function saveTasksToStorage() {
    localStorage.setItem('smartTaskManagerTasks', JSON.stringify(tasks));
}

// Render tasks based on current filter
function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'pending') return !task.completed;
    });

    filteredTasks.forEach(task => {
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
    });
}

// Create a task DOM element
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    if (task.completed) taskItem.classList.add('completed');
    taskItem.setAttribute('draggable', 'true');
    taskItem.dataset.id = task.id;

    // Drag and drop event handlers
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragover', handleDragOver);
    taskItem.addEventListener('drop', handleDrop);
    taskItem.addEventListener('dragend', handleDragEnd);

    // Main container for title, description, checkbox, and actions
    const taskMain = document.createElement('div');
    taskMain.className = 'task-main';

    // Checkbox to mark complete/pending
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    // Title and description container
    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;

    const descEl = document.createElement('div');
    descEl.className = 'task-desc';
    descEl.textContent = task.description;

    textContainer.appendChild(titleEl);
    textContainer.appendChild(descEl);

    // Actions container
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit Task';
    editBtn.addEventListener('click', () => editTask(task.id, taskItem));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Task';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    taskMain.appendChild(checkbox);
    taskMain.appendChild(textContainer);
    taskMain.appendChild(actions);

    taskItem.appendChild(taskMain);

    return taskItem;
}

// Add new task
function addTask() {
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();

    if (!title) {
        alert('Task title cannot be empty.');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title,
        description,
        completed: false,
    };

    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
    clearInputs();
}

// Clear input fields
function clearInputs() {
    taskTitleInput.value = '';
    taskDescInput.value = '';
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
    }
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasksToStorage();
        renderTasks();
    }
}

// Edit task inline
function editTask(taskId, taskItem) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Prevent multiple edits
    if (taskItem.classList.contains('editing')) return;

    taskItem.classList.add('editing');

    const titleEl = taskItem.querySelector('.task-title');
    const descEl = taskItem.querySelector('.task-desc');

    // Create input fields for editing
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'task-title editing-input';
    titleInput.value = task.title;
    titleInput.maxLength = 100;

    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'task-desc editing-input';
    descInput.value = task.description;
    descInput.maxLength = 250;

    // Replace text with inputs
    titleEl.replaceWith(titleInput);
    descEl.replaceWith(descInput);

    // Focus title input
    titleInput.focus();

    // Save changes on blur or Enter key
    function saveEdit() {
        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();

        if (!newTitle) {
            alert('Task title cannot be empty.');
            titleInput.focus();
            return;
        }

        task.title = newTitle;
        task.description = newDesc;
        saveTasksToStorage();
        renderTasks();
    }

    titleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            descInput.focus();
        } else if (e.key === 'Escape') {
            renderTasks();
        }
    });

    descInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            renderTasks();
        }
    });

    titleInput.addEventListener('blur', () => {
        // Delay to allow descInput focus if clicked
        setTimeout(() => {
            if (document.activeElement !== descInput) {
                saveEdit();
            }
        }, 150);
    });

    descInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== titleInput) {
                saveEdit();
            }
        }, 150);
    });
}

// Filter tasks
function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

// Update clock and greeting
function updateClockGreeting() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${hour12}:${minuteStr} ${ampm}`;

    let greeting = 'Hello';
    if (hours >= 5 && hours < 12) {
        greeting = 'Good Morning';
    } else if (hours >= 12 && hours < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    clockGreeting.textContent = `${timeStr} | ${greeting}!`;
}

// Drag and drop handlers
function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    e.stopPropagation();

    if (dragSrcEl !== this) {
        const srcId = dragSrcEl.dataset.id;
        const targetId = this.dataset.id;

        const srcIndex = tasks.findIndex(t => t.id === srcId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        // Swap tasks positions
        tasks.splice(targetIndex, 0, tasks.splice(srcIndex, 1)[0]);

        saveTasksToStorage();
        renderTasks();
    }
    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

// Event listeners
addTaskBtn.addEventListener('click', addTask);
taskTitleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
});
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init);

import { format } from 'date-fns';
import ListContainer from './list-container.js';
import { generateTimeOptions, formatDeadlineFromDate, formatDateTime, convertTimeFormat } from '../utils/date-time-utils.js';
import StorageManager from '../managers/storage-manager.js';
import ListManager from '../managers/list-manager.js';
import ViewManager from '../managers/view-manager.js';
import VisibilityManager from '../managers/visibility-manager.js';

export default class DialogManager {
  constructor() {
    this.createBtn = document.querySelector('#createBtn');
    this.taskContainer = document.querySelector('.task-container');
    this.createListDialog = null;
    this.createListBtn = document.querySelector('#createNewListBtn');
    this.showListBtn = document.querySelector('#showListBtn');
    this.listContent = document.querySelector('.listContent');
    
    this.lists = [];
    this.currentListId = null;
    this.sortOrder = {};
    
    // We need to initialize the managers in this order: storageManager, visibilityManager, viewManager, listManager okieee?
    this.storageManager = new StorageManager();
    this.visibilityManager = new VisibilityManager(this.lists, this.listContent, this.showListBtn);
    
    const sharedCallbacks = {
      onAddTask: (listId) => {
        this.currentListId = listId;
        this.open();
      },
      onTaskStarred: (taskId, starred) => {
        if (this.viewManager) {
          if (this.viewManager.getCurrentView() === 'starred') {
            this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
          } else if (this.viewManager.getCurrentView() === 'all') {
            this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
          }
        }
        this.saveToLocalStorage();
      },
      onTaskCompleted: (taskId, completed) => {
        if (this.viewManager) {
          if (this.viewManager.getCurrentView() === 'all') {
            this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
          } else if (this.viewManager.getCurrentView() === 'starred') {
            this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
          }
        }
        this.saveToLocalStorage();
      },
      onDateClick: (taskId, listId) => {
        this.openDateModal(taskId, listId);
      },
      onListOptionsClick: (listId) => {
        this.showListOptionsMenu(listId);
      }
    };
    
    this.viewManager = new ViewManager(this.lists, this.taskContainer, sharedCallbacks);
    this.listManager = new ListManager(this.lists, sharedCallbacks);
    
    this.createTaskDialog();
    this.init();
    this.loadFromLocalStorage();
  }

  init() {
    this.dialog = document.querySelector('#createDialog');
    this.form = document.querySelector('#createTaskForm');
    this.closeBtn = document.querySelector('#closeDialog');
    this.cancelBtn = document.querySelector('#cancelDialog');
    this.allDayCheckbox = document.querySelector('#allDay');
    this.timeSelect = document.querySelector('#taskTime');
    this.dateInput = document.querySelector('#taskDate');
    this.repeatSelect = document.querySelector('#repeatOption');
    
    const today = new Date();
    this.dateInput.value = format(today, 'yyyy-MM-dd');
    
    this.updateRepeatOptions();
    
    this.createBtn.addEventListener('click', () => {
      const visibleListContainer = Array.from(document.querySelectorAll('.list-container[data-list-id]')).find(
        container => {
          const style = window.getComputedStyle(container);
          return container.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
      
      if (visibleListContainer) {
        const listId = visibleListContainer.dataset.listId;
        if (listId && this.lists.find(l => l.id === listId)) {
          this.currentListId = listId;
        }
      }
      this.open();
    });
    this.closeBtn.addEventListener('click', () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    this.allDayCheckbox.addEventListener('change', (e) => {
      this.timeSelect.disabled = e.target.checked;
      if (e.target.checked) {
        this.timeSelect.value = '';
      }
    });

    this.createListBtn.addEventListener('click', () => this.openCreateListDialog());
    this.showListBtn.addEventListener('click', () => this.visibilityManager.toggleListExpansion());

    this.taskContainer.addEventListener('click', (e) => {
      if (e.target.closest('.addTaskBtn')) {
        const listId = e.target.closest('.addTaskBtn').dataset.listId;
        this.currentListId = listId;
        this.open();
      }
    });

    // This is for the All Tasks and Starred buttons
    const allTasksBtn = document.querySelector('#allTasksBtn');
    const starredBtn = document.querySelector('#starredBtn');
    if (allTasksBtn) {
      allTasksBtn.addEventListener('click', () => {
        this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
        this.visibilityManager.updateSidebarLists(this.viewManager.getCurrentView(), () => this.saveToLocalStorage());
      });
    }
    if (starredBtn) {
      starredBtn.addEventListener('click', () => {
        this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
        this.visibilityManager.updateSidebarLists(this.viewManager.getCurrentView(), () => this.saveToLocalStorage());
      });
    }

    // Only create default list if localStorage is empty (first time user opens the app lmao if there's one)
    if (!this.storageManager.hasSavedData()) {
      this.listManager.createDefaultList(formatDeadlineFromDate);
      this.visibilityManager.lists = this.lists;
    }
    this.createCreateListDialog();
    this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
    this.visibilityManager.updateSidebarLists(this.viewManager.getCurrentView(), () => this.saveToLocalStorage());
  }

  updateRepeatOptions() {
    const today = new Date();
    const currentDay = format(today, 'EEEE');
    const currentDate = today.getDate();
    const fullDate = format(today, 'MMMM d');

    const options = this.repeatSelect.querySelectorAll('option');
    options[2].textContent = `Weekly on ${currentDay}`;
    options[3].textContent = `Monthly on ${currentDate}`;
    options[4].textContent = `Annually on ${fullDate}`;
  }

  createTaskDialog() {
    const timeOptions = generateTimeOptions();
    const timeOptionsHTML = timeOptions.map(opt => 
      `<option value="${opt.value}">${opt.label}</option>`
    ).join('');

    const dialog = document.createElement('div');
    dialog.className = 'dialog-backdrop';
    dialog.id = 'createDialog';
    dialog.innerHTML = `
      <div class="dialog-container">
        <button class="dialog-close" id="closeDialog">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <form class="dialog-form" id="createTaskForm">
          <input type="text" id="taskTitle" class="dialog-input" placeholder="Add title" required>
          
          <div class="datetime-container">
            <input type="date" id="taskDate" class="dialog-date">
            <select id="taskTime" class="dialog-time">
              ${timeOptionsHTML}
            </select>
          </div>

          <div class="checkbox-container">
            <input type="checkbox" id="allDay" class="dialog-checkbox">
            <label for="allDay">All day</label>
          </div>

          <select id="repeatOption" class="dialog-select">
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly on {day}</option>
            <option value="monthly">Monthly on {date}</option>
            <option value="annually">Annually on {date}</option>
          </select>

          <textarea id="taskDescription" class="dialog-textarea" placeholder="Description" rows="4"></textarea>

          <select id="taskList" class="dialog-select">
            <option value="My Tasks">My Tasks</option>
          </select>

          <div class="dialog-actions">
            <button type="button" class="dialog-cancel" id="cancelDialog">Cancel</button>
            <button type="submit" class="dialog-submit">Create</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  createCreateListDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-backdrop';
    dialog.id = 'createListDialog';
    dialog.innerHTML = `
      <div class="dialog-container">
        <button class="dialog-close" id="closeListDialog">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2 style="margin-bottom: 20px; font-size: 1.5rem;">Create new list</h2>
        <form id="createListForm">
          <input type="text" id="listNameInput" class="dialog-input" placeholder="Enter name" required>
          <div class="dialog-actions" style="margin-top: 20px;">
            <button type="button" class="dialog-cancel" id="cancelListDialog">Cancel</button>
            <button type="submit" class="dialog-submit">Done</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(dialog);
    this.createListDialog = dialog;

    const closeBtn = dialog.querySelector('#closeListDialog');
    const cancelBtn = dialog.querySelector('#cancelListDialog');
    const form = dialog.querySelector('#createListForm');

    closeBtn.addEventListener('click', () => this.closeCreateListDialog());
    cancelBtn.addEventListener('click', () => this.closeCreateListDialog());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.closeCreateListDialog();
      }
    });
    form.addEventListener('submit', (e) => this.handleCreateListSubmit(e));
  }

  openCreateListDialog() {
    if (this.createListDialog) {
      this.createListDialog.classList.add('active');
      document.getElementById('listNameInput').focus();
    }
  }

  closeCreateListDialog() {
    if (this.createListDialog) {
      this.createListDialog.classList.remove('active');
      document.getElementById('createListForm').reset();
    }
  }

  handleCreateListSubmit(e) {
    e.preventDefault();
    const listName = document.getElementById('listNameInput').value.trim();
    if (listName) {
      this.createNewList(listName);
      this.closeCreateListDialog();
    }
  }


  createNewList(name) {
    const newList = this.listManager.createNewList(name);
    this.visibilityManager.lists = this.lists;
    this.visibilityManager.setInitialVisibility(newList.id, this.viewManager.getCurrentView());
    
    if (this.viewManager.getCurrentView() === 'all') {
      this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
    } else if (this.viewManager.getCurrentView() === 'starred') {
      this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
    } else {
      newList.render(this.taskContainer);
    }
    
    this.visibilityManager.updateSidebarLists(this.viewManager.getCurrentView(), () => this.saveToLocalStorage());
  }

  open(listId = null) {
    this.listManager.updateListDropdown();
    
    this.dialog.classList.add('active');
    this.updateRepeatOptions();
    const today = new Date();
    this.dateInput.value = format(today, 'yyyy-MM-dd');
    
    let targetListId = listId || this.currentListId;
    
    if (!targetListId) {
      const visibleListContainer = Array.from(document.querySelectorAll('.list-container[data-list-id]')).find(
        container => {
          const style = window.getComputedStyle(container);
          return container.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
      if (visibleListContainer) {
        targetListId = visibleListContainer.dataset.listId;
      }
    }
    
    if (targetListId) {
      const targetList = this.lists.find(l => l.id === targetListId);
      if (targetList) {
        const listSelect = document.getElementById('taskList');
        if (listSelect) {
          listSelect.value = targetList.name;
        }
      }
    }
  }

  close() {
    this.dialog.classList.remove('active');
    this.form.reset();

    const today = new Date();
    this.dateInput.value = format(today, 'yyyy-MM-dd');
    this.allDayCheckbox.checked = false;
    this.timeSelect.disabled = false;
    this.currentListId = null;
  }


  handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
      title: document.getElementById('taskTitle').value,
      date: this.dateInput.value,
      time: this.allDayCheckbox.checked ? '' : this.timeSelect.value,
      allDay: this.allDayCheckbox.checked,
      repeat: this.repeatSelect.value,
      description: document.getElementById('taskDescription').value,
      list: document.getElementById('taskList').value
    };

    let targetList = null;
    if (this.currentListId) {
      targetList = this.lists.find(l => l.id === this.currentListId);
    }
    
    if (!targetList) {
      targetList = this.lists.find(l => l.name === formData.list);
    }
    
    const isNewList = !targetList;
    if (!targetList) {
      targetList = this.listManager.createNewList(formData.list);
      this.visibilityManager.lists = this.lists;
      this.visibilityManager.setInitialVisibility(targetList.id, this.viewManager.getCurrentView());
    }

    let dueDate = formData.date;
    if (dueDate) {
      const dateObj = new Date(dueDate);
      if (!isNaN(dateObj.getTime())) {
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = dateObj.getFullYear();
        dueDate = `${month}/${day}/${year}`;
      }
    }

    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      description: formData.description || '',
      dueDate: dueDate,
      date: formData.date,
      time: formData.time || (formData.allDay ? 'N/A' : ''),
      allDay: formData.allDay,
      repeat: formData.repeat,
      dateTime: formatDateTime(formData.date, formData.time || '00:00', formData.allDay),
      deadline: formData.date ? formatDateTime(formData.date, formData.time || '00:00', formData.allDay) : 'No date',
      starred: false,
      completed: false
    };

    targetList.addTask(task);
    this.saveToLocalStorage();

    if (this.viewManager.getCurrentView() === 'all') {
      this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
    } else if (this.viewManager.getCurrentView() === 'starred') {
      this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
    }

    this.close();
  }

  openDateModal(taskId, listId) {
    const list = this.lists.find(l => l.id === listId);
    if (!list) return;
    
    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    let dateModal = document.getElementById('dateModal');
    if (!dateModal) {
      dateModal = document.createElement('div');
      dateModal.className = 'dialog-backdrop';
      dateModal.id = 'dateModal';
      dateModal.innerHTML = `
        <div class="dialog-container">
          <button class="dialog-close" id="closeDateModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h2 style="margin-bottom: 20px; font-size: 1.5rem;">Edit Task</h2>
          <form id="dateModalForm" class="edit-task-form">
            <input type="text" id="modalTaskTitle" class="edit-task-input" placeholder="Task title" required>
            
            <div class="edit-task-datetime-container">
              <input type="date" id="modalTaskDate" class="edit-task-date">
              <select id="modalTaskTime" class="edit-task-time">
                ${generateTimeOptions().map(opt => 
                  `<option value="${opt.value}">${opt.label}</option>`
                ).join('')}
              </select>
            </div>
            <div class="edit-task-checkbox-container">
              <input type="checkbox" id="modalAllDay" class="edit-task-checkbox">
              <label for="modalAllDay">All day</label>
            </div>
            
            <textarea id="modalTaskDescription" class="edit-task-textarea" placeholder="Description" rows="4"></textarea>
            
            <div class="edit-task-actions">
              <button type="button" class="edit-task-delete" id="removeDateBtn">Delete</button>
              <button type="button" class="edit-task-cancel" id="cancelDateModal">Cancel</button>
              <button type="submit" class="edit-task-submit">Save</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(dateModal);

      const closeBtn = dateModal.querySelector('#closeDateModal');
      const cancelBtn = dateModal.querySelector('#cancelDateModal');
      const removeBtn = dateModal.querySelector('#removeDateBtn');
      const form = dateModal.querySelector('#dateModalForm');
      const allDayCheckbox = dateModal.querySelector('#modalAllDay');
      const timeSelect = dateModal.querySelector('#modalTaskTime');

      closeBtn.addEventListener('click', () => this.closeDateModal());
      cancelBtn.addEventListener('click', () => this.closeDateModal());
      removeBtn.addEventListener('click', () => {
        const currentTaskId = dateModal.dataset.taskId;
        const currentListId = dateModal.dataset.listId;
        if (currentTaskId && currentListId) {
          this.deleteTask(currentTaskId, currentListId);
        }
      });
      
      allDayCheckbox.addEventListener('change', (e) => {
        timeSelect.disabled = e.target.checked;
        if (e.target.checked) {
          timeSelect.value = '';
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTaskId = dateModal.dataset.taskId;
        const currentListId = dateModal.dataset.listId;
        if (currentTaskId && currentListId) {
          this.saveTaskDate(currentTaskId, currentListId);
        }
      });

      dateModal.addEventListener('click', (e) => {
        if (e.target === dateModal) {
          this.closeDateModal();
        }
      });
    }

    const dateInput = dateModal.querySelector('#modalTaskDate');
    const timeSelect = dateModal.querySelector('#modalTaskTime');
    const allDayCheckbox = dateModal.querySelector('#modalAllDay');
    const titleInput = dateModal.querySelector('#modalTaskTitle');
    const descriptionTextarea = dateModal.querySelector('#modalTaskDescription');

    if (titleInput) {
      titleInput.value = task.title || '';
    }
    if (descriptionTextarea) {
      descriptionTextarea.value = task.description || '';
    }

    if (task.date) {
      dateInput.value = task.date;
    } else if (task.dueDate) {
      const [month, day, year] = task.dueDate.split('/');
      dateInput.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      const today = new Date();
      dateInput.value = format(today, 'yyyy-MM-dd');
    }

    if (task.allDay) {
      allDayCheckbox.checked = true;
      timeSelect.disabled = true;
      timeSelect.value = '';
    } else {
      allDayCheckbox.checked = false;
      timeSelect.disabled = false;
        if (task.time && task.time !== 'N/A') {
          const convertedTime = convertTimeFormat(task.time);
          if (convertedTime) {
            timeSelect.value = convertedTime;
          } else {
            timeSelect.value = task.time;
          }
        }
    }

    dateModal.dataset.taskId = taskId;
    dateModal.dataset.listId = listId;
    dateModal.classList.add('active');
  }

  closeDateModal() {
    const dateModal = document.getElementById('dateModal');
    if (dateModal) {
      dateModal.classList.remove('active');
    }
  }

  saveTaskDate(taskId, listId) {
    const dateModal = document.getElementById('dateModal');
    if (!dateModal) return;

    const list = this.lists.find(l => l.id === listId);
    if (!list) return;

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateInput = dateModal.querySelector('#modalTaskDate');
    const timeSelect = dateModal.querySelector('#modalTaskTime');
    const allDayCheckbox = dateModal.querySelector('#modalAllDay');
    const titleInput = dateModal.querySelector('#modalTaskTitle');
    const descriptionTextarea = dateModal.querySelector('#modalTaskDescription');

    if (titleInput) {
      task.title = titleInput.value.trim();
    }
    if (descriptionTextarea) {
      task.description = descriptionTextarea.value.trim() || '';
    }

    const dateValue = dateInput.value;
    const timeValue = allDayCheckbox.checked ? '' : timeSelect.value;
    const allDay = allDayCheckbox.checked;

    if (dateValue) {
      const dateObj = new Date(dateValue);
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = dateObj.getFullYear();
      const dueDate = `${month}/${day}/${year}`;

      task.dueDate = dueDate;
      task.date = dateValue;
      task.time = timeValue || (allDay ? 'N/A' : '');
      task.allDay = allDay;
      task.deadline = formatDateTime(dateValue, timeValue || '00:00', allDay);
    } else {
      task.dueDate = null;
      task.date = null;
      task.time = '';
      task.allDay = false;
      task.deadline = 'No date';
    }

    list.update();
    this.saveToLocalStorage();
    this.closeDateModal();

    if (this.viewManager.getCurrentView() === 'all') {
      this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
    } else if (this.viewManager.getCurrentView() === 'starred') {
      this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
    }
  }

  removeTaskDate(taskId, listId) {
    const list = this.lists.find(l => l.id === listId);
    if (!list) return;

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.dueDate = null;
    task.date = null;
    task.time = '';
    task.allDay = false;
    task.deadline = 'No date';

    list.update();
    this.saveToLocalStorage();
    this.closeDateModal();

    if (this.viewManager.getCurrentView() === 'starred') {
      this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
    }
  }

  deleteTask(taskId, listId) {
    const list = this.lists.find(l => l.id === listId);
    if (!list) return;

    const taskIndex = list.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    list.tasks.splice(taskIndex, 1);
    list.update();
    this.saveToLocalStorage();
    this.closeDateModal();

    if (this.viewManager.getCurrentView() === 'all') {
      this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
    } else if (this.viewManager.getCurrentView() === 'starred') {
      this.viewManager.showStarredTasks(this.visibilityManager.getListVisibility());
    }
  }

  saveToLocalStorage() {
    this.storageManager.saveToLocalStorage(
      this.lists,
      this.visibilityManager.getListVisibility(),
      this.sortOrder
    );
  }

  loadFromLocalStorage() {
    const data = this.storageManager.loadFromLocalStorage();
    if (!data || !data.lists || data.lists.length === 0) {
      return;
    }

    this.lists = [];
    this.taskContainer.innerHTML = '';

    data.lists.forEach(listData => {
      const processedTasks = listData.tasks.map(task => {
        const taskCopy = { ...task };
        if (task.dueDate) {
          const dateStr = task.dueDate;
          const timeStr = task.time && task.time !== 'N/A' ? task.time : '';
          taskCopy.deadline = formatDeadlineFromDate(dateStr, timeStr, task.allDay);
        } else {
          taskCopy.deadline = 'No date';
        }
        return taskCopy;
      });

      const list = new ListContainer({
        id: listData.id,
        name: listData.name,
        tasks: processedTasks
      });
      
      this.listManager.setupListCallbacks(list);
      this.lists.push(list);
    });

    this.listManager.lists = this.lists;
    this.viewManager.lists = this.lists;
    this.visibilityManager.lists = this.lists;

    if (data.listVisibility) {
      this.visibilityManager.setListVisibility(data.listVisibility);
    }
    if (data.sortOrder) {
      this.sortOrder = data.sortOrder;
      Object.entries(this.sortOrder).forEach(([listId, sortType]) => {
        if (sortType !== 'none') {
          this.sortListTasks(listId, sortType);
        }
      });
    }

    this.listManager.updateListDropdown();
    this.visibilityManager.updateSidebarLists(this.viewManager.getCurrentView(), () => this.saveToLocalStorage());
    this.viewManager.showAllTasks(this.visibilityManager.getListVisibility());
  }
}


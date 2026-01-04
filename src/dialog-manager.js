import { format } from 'date-fns';
import ListContainer from './list-container.js';
import dummyData from './dummy-data.json';

export default class DialogManager {
  constructor() {
    this.createBtn = document.querySelector('#createBtn');
    this.taskContainer = document.querySelector('.task-container');
    this.createListDialog = null;
    this.createListBtn = document.querySelector('#createNewListBtn');
    this.showListBtn = document.querySelector('#showListBtn');
    this.listContent = document.querySelector('.listContent');
    this.isListExpanded = true;
    
    this.lists = [];
    this.currentListId = null;
    this.currentView = 'all';
    this.starredTasksContainer = null;
    this.listVisibility = {};
    
    this.createTaskDialog();
    this.init();
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
    
    this.createBtn.addEventListener('click', () => this.open());
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
    this.showListBtn.addEventListener('click', () => this.toggleListExpansion());

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
      allTasksBtn.addEventListener('click', () => this.showAllTasks());
    }
    if (starredBtn) {
      starredBtn.addEventListener('click', () => this.showStarredTasks());
    }

    this.createDefaultList();
    this.createCreateListDialog();
    this.showAllTasks();
    this.updateSidebarLists();
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

  generateTimeOptions() {
    const times = [];

    for (let hour = 1; hour <= 11; hour++) {
      const value = `${String(hour).padStart(2, '0')}:00`;
      times.push({ value, label: `${hour}:00 AM` });
    }

    times.push({ value: '12:00', label: '12:00 PM' });

    for (let hour = 1; hour <= 11; hour++) {
      const value = `${String(hour + 12).padStart(2, '0')}:00`;
      times.push({ value, label: `${hour}:00 PM` });
    }

    times.push({ value: '00:00', label: '12:00 AM' });
    return times;
  }

  createTaskDialog() {
    const timeOptions = this.generateTimeOptions();
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

  toggleListExpansion() {
    this.isListExpanded = !this.isListExpanded;
    const listContent = document.querySelector('.listContent');
    if (this.isListExpanded) {
      listContent.style.display = 'block';
      this.showListBtn.querySelector('img').style.transform = 'rotate(0deg)';
    } else {
      listContent.style.display = 'none';
      this.showListBtn.querySelector('img').style.transform = 'rotate(-180deg)';
    }
  }

  createDefaultList() {
    if (dummyData.lists && dummyData.lists.length > 0) {
      dummyData.lists.forEach(listData => {
        const processedTasks = listData.tasks.map(task => {
          const taskCopy = { ...task };
          if (task.dueDate) {
            const dateStr = task.dueDate;
            const timeStr = task.time && task.time !== 'N/A' ? task.time : '';
            taskCopy.deadline = this.formatDeadlineFromDate(dateStr, timeStr, task.allDay);
          } else {
            taskCopy.deadline = 'No date';
          }
          return taskCopy;
        });

        const list = new ListContainer({
          id: listData.id,
          name: listData.title,
          tasks: processedTasks
        });
        list.onAddTask = (listId) => {
          this.currentListId = listId;
          this.open();
        };
        list.onTaskStarred = (taskId, starred) => {
          if (this.currentView === 'starred') {
            this.showStarredTasks();
          }
        };
        this.lists.push(list);
        this.listVisibility[list.id] = true;
      });
    } else {
      const defaultList = new ListContainer({ name: 'My Tasks' });
      defaultList.onAddTask = (listId) => {
        this.currentListId = listId;
        this.open();
      };
      defaultList.onTaskStarred = (taskId, starred) => {
        if (this.currentView === 'starred') {
          this.showStarredTasks();
        }
      };
      this.lists.push(defaultList);
      this.listVisibility[defaultList.id] = true;
    }
    
    this.updateListDropdown();
    this.updateSidebarLists();
  }

  showAllTasks() {
    this.currentView = 'all';
    this.taskContainer.innerHTML = '';
    
    this.lists.forEach(list => {
      list.render(this.taskContainer);
      const listElement = document.querySelector(`.list-container[data-list-id="${list.id}"]`);
      if (listElement) {
        if (this.listVisibility[list.id] === undefined) {
          this.listVisibility[list.id] = true;
        }
        listElement.style.display = this.listVisibility[list.id] ? 'block' : 'none';
      }
    });
    
    this.updateSidebarLists();
  }

  showStarredTasks() {
    this.currentView = 'starred';
    this.taskContainer.innerHTML = '';
    
    const starredTasks = [];
    this.lists.forEach(list => {
      list.tasks.forEach(task => {
        if (task.starred === true) {
          const taskCopy = { ...task };
          starredTasks.push(taskCopy);
        }
      });
    });

    this.starredTasksContainer = new ListContainer({
      id: 'starred-tasks',
      name: 'Starred Tasks',
      tasks: starredTasks
    });
    this.starredTasksContainer.onAddTask = (listId) => {
      this.currentListId = null;
      this.open();
    };
    this.starredTasksContainer.onTaskStarred = (taskId, starred) => {
      this.lists.forEach(list => {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          task.starred = starred;
          list.update();
        }
      });
      this.showStarredTasks();
    };
    this.starredTasksContainer.render(this.taskContainer);
    
    this.updateSidebarLists();
  }

  formatDeadlineFromDate(dateStr, timeStr, allDay) {
    const [month, day, year] = dateStr.split('/');
    const dateObj = new Date(`${year}-${month}-${day}`);
    
    return format(dateObj, 'EEE, MMM d');
  }

  createNewList(name) {
    const newList = new ListContainer({ name, tasks: [] });
    newList.onAddTask = (listId) => {
      this.currentListId = listId;
      this.open();
    };
    newList.onTaskStarred = (taskId, starred) => {
      if (this.currentView === 'starred') {
        this.showStarredTasks();
      } else if (this.currentView === 'all') {
        this.showAllTasks();
      }
    };
    this.lists.push(newList);
    
    this.listVisibility[newList.id] = this.currentView === 'all';
    
    if (this.currentView === 'all') {
      this.showAllTasks();
    } else if (this.currentView === 'starred') {
      this.showStarredTasks();
    } else {
      newList.render(this.taskContainer);
    }
    
    this.updateListDropdown();
    this.updateSidebarLists();
  }

  updateSidebarLists() {
    const listContent = document.querySelector('.listContent');
    if (!listContent) return;

    listContent.innerHTML = '';
    
    this.lists.forEach(list => {
      const listItem = document.createElement('div');
      listItem.className = 'sidebar-list-item';
      listItem.dataset.listId = list.id;
      
      if (this.listVisibility[list.id] === undefined) {
        this.listVisibility[list.id] = this.currentView === 'all';
      }
      
      listItem.innerHTML = `
        <input type="checkbox" class="list-checkbox" data-list-id="${list.id}" ${this.listVisibility[list.id] ? 'checked' : ''}>
        <span class="list-item-name">${list.name}</span>
      `;
      
      const checkbox = listItem.querySelector('.list-checkbox');
      const listItemName = listItem.querySelector('.list-item-name');
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleListVisibility(list.id, e.target.checked);
      });
      
      listItemName.addEventListener('click', (e) => {
        e.stopPropagation();
        checkbox.checked = !checkbox.checked;
        this.toggleListVisibility(list.id, checkbox.checked);
      });
      
      listContent.appendChild(listItem);
    });
  }

  isListVisible(listId) {
    if (this.listVisibility[listId] !== undefined) {
      return this.listVisibility[listId];
    }
    const listElement = document.querySelector(`.list-container[data-list-id="${listId}"]`);
    if (listElement) {
      return listElement.style.display !== 'none';
    }
    return this.currentView === 'all';
  }

  toggleListVisibility(listId, show) {
    this.listVisibility[listId] = show;
    
    const listElement = document.querySelector(`.list-container[data-list-id="${listId}"]`);
    if (listElement) {
      listElement.style.display = show ? 'block' : 'none';
    }
  }

  updateListDropdown() {
    const listSelect = document.getElementById('taskList');
    listSelect.innerHTML = '';
    
    this.lists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.name;
      option.textContent = list.name;
      listSelect.appendChild(option);
    });
  }

  open(listId = null) {
    this.dialog.classList.add('active');
    this.updateRepeatOptions();
    const today = new Date();
    this.dateInput.value = format(today, 'yyyy-MM-dd');
    
    if (listId) {
      const targetList = this.lists.find(l => l.id === listId);
      if (targetList) {
        document.getElementById('taskList').value = targetList.name;
      }
    } else if (this.currentListId) {
      const targetList = this.lists.find(l => l.id === this.currentListId);
      if (targetList) {
        document.getElementById('taskList').value = targetList.name;
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

  formatDateTime(date, time, allDay) {
    if (!date) {
      return 'No date';
    }
    
    const dateObj = new Date(date);
    
    // Format as "Weekday, Date" (e.g., "Thu, Jan 15")
    return format(dateObj, 'EEE, MMM d');
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
      targetList = new ListContainer({ name: formData.list });
      targetList.onAddTask = (listId) => {
        this.currentListId = listId;
        this.open();
      };
      targetList.onTaskStarred = (taskId, starred) => {
        if (this.currentView === 'starred') {
          this.showStarredTasks();
        }
      };
      this.lists.push(targetList);
      this.listVisibility[targetList.id] = this.currentView === 'all';
      this.updateListDropdown();
      this.updateSidebarLists();
    }

    const task = {
      id: `task-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      allDay: formData.allDay,
      repeat: formData.repeat,
      dateTime: this.formatDateTime(formData.date, formData.time || '00:00', formData.allDay),
      deadline: formData.date ? this.formatDateTime(formData.date, formData.time || '00:00', formData.allDay) : 'No date',
      starred: false,
      completed: false
    };

    targetList.addTask(task);

    if (this.currentView === 'all' && isNewList) {
      this.showAllTasks();
    } else if (this.currentView === 'starred') {
      this.showStarredTasks();
    }

    this.close();
  }
}


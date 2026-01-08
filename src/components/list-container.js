import { format, parse, compareAsc, isValid } from 'date-fns';
import { formatTimeTo12Hour } from '../utils/date-time-utils.js';
import dummyData from '../data/dummy-data.json';
import List from '/public/images/list.png';
import AddTaskIcon from '/public/images/add-task-icon.png';
import CompleteIcon from '/public/images/right-arrow.png';
import CheckIcon from '/public/images/circle.png';
import CalendarIcon from '/public/images/calendar.png';
import StarIcon from '/public/images/star.png';
import StarCompletedIcon from '/public/images/star-completed.png';

export default class ListContainer {
  constructor(data = {}) {
    this.id = data.id || `list-${Date.now()}`;
    this.name = data.name || (dummyData.lists && dummyData.lists[0] ? dummyData.lists[0].title : 'My Tasks');
    this.tasks = data.tasks || (dummyData.lists && dummyData.lists[0] ? dummyData.lists[0].tasks : []);
    this.dueDate = data.dueDate || null;
    if (data.completedCount !== undefined) {
      this.completedCount = data.completedCount;
    } else {
      this.completedCount = this.tasks.filter(task => task.completed === true).length;
    }
    this.onAddTask = null;
    this.onTaskStarred = null;
    this.onTaskCompleted = null;
    this.onDateClick = null;
    this.showCompleted = false;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'list-container';
    container.dataset.listId = this.id;

    container.innerHTML = `
      <div class="list-heading">
        <div class="list-name">
          <p id="listName">${this.name}</p>
          <button id="listOptions">
            <img src="${List}" alt="List button">
          </button>
        </div>
        <button class="addTaskBtn" data-list-id="${this.id}">
          <img src="${AddTaskIcon}" alt="Add Icon">
          <span>Add a task</span>
        </button>
      </div>
      <div class="list-task">
        ${this.renderTasks()}
      </div>
      <button class="completed-btn" data-list-id="${this.id}">
        <img src="${CompleteIcon}" alt="Complete button" class="${this.showCompleted ? 'rotated' : ''}">
        <p>Completed (${this.completedCount})</p>
      </button>
      ${this.showCompleted ? `<div class="completed-task">${this.renderCompletedTasks()}</div>` : ''}
    `;
    
    const addTaskBtn = container.querySelector('.addTaskBtn');
    if (addTaskBtn && this.onAddTask) {
      addTaskBtn.addEventListener('click', () => {
        this.onAddTask(this.id);
      });
    }
    
    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const button = e.currentTarget.closest('.star-btn') || e.currentTarget;
        const taskId = button.dataset.taskId;
        if (taskId) {
          this.toggleStar(taskId);
        }
      });
    });

    container.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const taskId = btn.dataset.taskId;
        if (taskId) {
          this.toggleComplete(taskId);
        }
      });
    });

    container.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const taskId = btn.dataset.taskId;
        if (taskId && this.onDateClick) {
          this.onDateClick(taskId, this.id);
        }
      });
    });

    container.querySelectorAll('.completed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCompleted();
      });
    });

    return container;
  }

  renderTasks() {
    if (!this.tasks || this.tasks.length === 0) {
      return '';
    }

    const incompleteTasks = this.tasks.filter(task => !task.completed);
    
    const sortedIncompleteTasks = [...incompleteTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      const dateA = parse(a.dueDate, 'MM/dd/yyyy', new Date());
      const dateB = parse(b.dueDate, 'MM/dd/yyyy', new Date());

      const validA = isValid(dateA);
      const validB = isValid(dateB);

      if (!validA && !validB) return 0;
      if (!validA) return 1;
      if (!validB) return -1;

      return compareAsc(dateA, dateB);
    });

    const groupedIncompleteTasks = {};
    sortedIncompleteTasks.forEach(task => {
      if (!task.id) {
        task.id = `task-${Date.now()}-${Math.random().toString(36)}`;
      }
      const deadline = task.deadline || (task.dueDate ? this.formatDeadlineFromDate(task.dueDate, task.time || '', task.allDay) : 'No date');
      if (!groupedIncompleteTasks[deadline]) {
        groupedIncompleteTasks[deadline] = [];
      }
      groupedIncompleteTasks[deadline].push(task);
    });

    let html = Object.entries(groupedIncompleteTasks).map(([deadline, tasks]) => {
      return `
        <span class="task-deadline">${deadline}</span>
        ${tasks.map(task => this.renderTask(task)).join('')}
      `;
    }).join('');

    return html;
  }

  renderTask(task, isCompleted = false) {
    const deadline = task.deadline || (task.dueDate ? this.formatDeadlineFromDate(task.dueDate, task.time || '', task.allDay) : 'No date');
    const displayTime = task.time && task.time !== 'N/A' && !task.allDay ? formatTimeTo12Hour(task.time) : null;
    const completedClass = isCompleted ? 'completed' : '';
    
    return `
      <div class="task-details ${completedClass}" data-task-id="${task.id}">
        <button class="check-btn" data-task-id="${task.id}">
          <img src="${CheckIcon}" alt="check button">
        </button>
        <div class="task-name">
          <p>${task.title}</p>
          ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
          ${task.dueDate || task.date ? `
            <button class="date-btn" data-task-id="${task.id}">
              <img src="${CalendarIcon}" alt="calendar icon">
              ${deadline}${displayTime ? ` ${displayTime}` : ''}
            </button>
          ` : ''}
        </div>
        <button class="star-btn" data-task-id="${task.id}" title="${task.starred === true ? 'Unstar' : 'Star'}">
          <img src="${task.starred === true ? StarCompletedIcon : StarIcon}" alt="star icon" class="${task.starred === true ? 'starred' : ''}">
        </button>
      </div>
    `;
  }

  renderCompletedTasks() {
    if (!this.tasks || this.tasks.length === 0) {
      return '';
    }

    const completedTasks = this.tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0 || !this.showCompleted) {
      return '';
    }

    const groupedCompletedTasks = {};
    completedTasks.forEach(task => {
      if (!task.id) {
        task.id = `task-${Date.now()}-${Math.random().toString(36)}`;
      }
      const deadline = task.deadline || (task.dueDate ? this.formatDeadlineFromDate(task.dueDate, task.time || '', task.allDay) : 'No date');
      if (!groupedCompletedTasks[deadline]) {
        groupedCompletedTasks[deadline] = [];
      }
      groupedCompletedTasks[deadline].push(task);
    });

    let completedTasksHTML = Object.entries(groupedCompletedTasks).map(([deadline, tasks]) => {
      return `
        <span class="task-deadline">${deadline}</span>
        ${tasks.map(task => this.renderTask(task, true)).join('')}
      `;
    }).join('');

    return completedTasksHTML;
  }

  formatDeadlineFromDate(dateStr) {
    if (!dateStr) return 'No date';
    
    let dateObj;
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      dateObj = new Date(dateStr);
    }
    
    if (isNaN(dateObj.getTime())) return 'No date';
    
    return format(dateObj, 'EEE, MMM d');
  }

  addTask(task) {
    this.tasks.push(task);
    this.update();
  }

  toggleStar(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.starred = !(task.starred === true);
      
      this.update();
      
      if (this.onTaskStarred) {
        this.onTaskStarred(taskId, task.starred);
      }
    } else {
      console.warn(`Task with id ${taskId} not found in list ${this.id}`);
    }
  }

  toggleCompleted() {
    this.showCompleted = !this.showCompleted;
    this.update();
  }

  toggleComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !(task.completed === true);
      this.completedCount = this.tasks.filter(t => t.completed === true).length;
      this.update();
      
      if (this.onTaskCompleted) {
        this.onTaskCompleted(taskId, task.completed);
      }
    }
  }

  update() {
    const container = document.querySelector(`[data-list-id="${this.id}"]`);
    if (container) {
      this.completedCount = this.tasks.filter(task => task.completed === true).length;
      
      const listTask = container.querySelector('.list-task');
      if (listTask) {
        listTask.innerHTML = this.renderTasks();
      }
      
      const completedBtn = container.querySelector('.completed-btn');
      if (completedBtn) {
        const completedBtnText = completedBtn.querySelector('p');
        if (completedBtnText) {
          completedBtnText.textContent = `Completed (${this.completedCount})`;
        }
      }
      
      // Update the completed tasks section if it exists
      const completedTaskSection = container.querySelector('.completed-task');
      if (this.showCompleted) {
        if (completedTaskSection) {
          completedTaskSection.innerHTML = this.renderCompletedTasks();
        } else {
          // Create completed tasks section if it doesn't exist but should
          const completedBtn = container.querySelector('.completed-btn');
          if (completedBtn) {
            const completedTaskDiv = document.createElement('div');
            completedTaskDiv.className = 'completed-task';
            completedTaskDiv.innerHTML = this.renderCompletedTasks();
            completedBtn.insertAdjacentElement('afterend', completedTaskDiv);
          }
        }
      } else if (completedTaskSection) {
        // Remove completed tasks section if it exists but shouldn't
        completedTaskSection.remove();
      }
      
      // Reattach event listeners
      this.attachEventListeners(container);
    }
  }

  attachEventListeners(container) {
    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const button = e.currentTarget.closest('.star-btn') || e.currentTarget;
        const taskId = button.dataset.taskId;
        if (taskId) {
          this.toggleStar(taskId);
        }
      });
    });

    container.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const taskId = btn.dataset.taskId;
        if (taskId) {
          this.toggleComplete(taskId);
        }
      });
    });

    container.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const taskId = btn.dataset.taskId;
        if (taskId && this.onDateClick) {
          this.onDateClick(taskId, this.id);
        }
      });
    });
    
    const addTaskBtn = container.querySelector('.addTaskBtn');
    if (addTaskBtn && this.onAddTask) {
      addTaskBtn.addEventListener('click', () => {
        this.onAddTask(this.id);
      });
    }

    container.querySelectorAll('.completed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCompleted();
      });
    });
  }

  render(container) {
    const element = this.createElement();
    container.appendChild(element);
  }
}

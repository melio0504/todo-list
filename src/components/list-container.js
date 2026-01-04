import { format } from 'date-fns';
import List from '/public/images/list.png';
import AddTaskIcon from '/public/images/add-task-icon.png';
import CompleteIcon from '/public/images/right-arrow.png';
import CheckIcon from '/public/images/circle.png';
import CalendarIcon from '/public/images/calendar.png';
import StarIcon from '/public/images/star.png';
import StarCompletedIcon from '/public/images/star-completed.png';
import dummyData from '../data/dummy-data.json';
import { formatTimeTo12Hour } from '../utils/date-time-utils.js';

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
        <img src="${this.showCompleted ? DownwardArrowIcon : CompleteIcon}" alt="Complete button">
        <p>Completed (${this.completedCount})</p>
      </button>
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

    const completedBtn = container.querySelector('.completed-btn');
    if (completedBtn) {
      completedBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggleCompleted();
      };
    }

    return container;
  }

  renderTasks() {
    if (!this.tasks || this.tasks.length === 0) {
      return '';
    }

    const incompleteTasks = this.tasks.filter(task => !task.completed);
    const completedTasks = this.tasks.filter(task => task.completed);

    const groupedIncompleteTasks = {};
    incompleteTasks.forEach(task => {
      if (!task.id) {
        task.id = `task-${Date.now()}-${Math.random().toString(36)}`;
      }
      const deadline = task.deadline || 'No date';
      if (!groupedIncompleteTasks[deadline]) {
        groupedIncompleteTasks[deadline] = [];
      }
      groupedIncompleteTasks[deadline].push(task);
    });

    const groupedCompletedTasks = {};
    completedTasks.forEach(task => {
      if (!task.id) {
        task.id = `task-${Date.now()}-${Math.random().toString(36)}`;
      }
      const deadline = task.deadline || 'No date';
      if (!groupedCompletedTasks[deadline]) {
        groupedCompletedTasks[deadline] = [];
      }
      groupedCompletedTasks[deadline].push(task);
    });

    let html = Object.entries(groupedIncompleteTasks).map(([deadline, tasks]) => {
      return `
        <span class="task-deadline">${deadline}</span>
        ${tasks.map(task => this.renderTask(task)).join('')}
      `;
    }).join('');

    if (this.showCompleted && completedTasks.length > 0) {
      html += Object.entries(groupedCompletedTasks).map(([deadline, tasks]) => {
        return `
          <span class="task-deadline">${deadline}</span>
          ${tasks.map(task => this.renderTask(task, true)).join('')}
        `;
      }).join('');
    }

    return html;
  }

  renderTask(task, isCompleted = false) {
    const taskIsCompleted = task.completed === true || isCompleted;
    const deadline = task.deadline || (task.dueDate ? this.formatDeadlineFromDate(task.dueDate, task.time || '', task.allDay) : 'No date');
    const displayTime = task.time && task.time !== 'N/A' && !task.allDay ? formatTimeTo12Hour(task.time) : null;
    return `
      <div class="task-details ${taskIsCompleted ? 'completed' : ''}" data-task-id="${task.id}">
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
        const completedBtnIcon = completedBtn.querySelector('img');
        if (completedBtnIcon) {
          completedBtnIcon.src = this.showCompleted ? DownwardArrowIcon : CompleteIcon;
        }
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
      
      const addTaskBtn = container.querySelector('.addTaskBtn');
      if (addTaskBtn && this.onAddTask) {
        addTaskBtn.addEventListener('click', () => {
          this.onAddTask(this.id);
        });
      }

      const completedBtnForListener = container.querySelector('.completed-btn');
      if (completedBtnForListener) {
        completedBtnForListener.onclick = (e) => {
          e.stopPropagation();
          this.toggleCompleted();
        };
      }
    }
  }

  render(container) {
    const element = this.createElement();
    container.appendChild(element);
  }
}

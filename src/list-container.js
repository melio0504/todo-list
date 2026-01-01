import List from '/public/images/list.png';
import AddTaskIcon from '/public/images/add-task-icon.png';
import CompleteIcon from '/public/images/right-arrow.png';
import CheckIcon from '/public/images/circle.png';
import CalendarIcon from '/public/images/calendar.png';

export default class ListContainer {
  constructor(data = {}) {
    this.id = data.id || `list-${Date.now()}`;
    this.name = data.name || 'My Tasks';
    this.tasks = data.tasks || [];
    this.completedCount = data.completedCount || 0;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'list-container';
    container.dataset.listId = this.id;

    container.innerHTML = `
      <div class="list-heading">
        <div class="list-name">
          <p id="listName">My Tasks</p>
          <button id="listOptions">
            <img src="${List}" alt="List button">
          </button>
        </div>
        <button id="addTaskBtn">
          <img src="${AddTaskIcon}" alt="Add Icon">
          <span>Add a task</span>
        </button>
      </div>
      <div class="list-task">
        <span id="taskDeadline">Today</span>
        <div class="task-details">
          <button id="checkBtn">
            <img src="${CheckIcon}" alt="check button">
          </button>
          <div class="task-name">
            <p>Eat Breakfast</p>
            <button id="dateBtn">
              <img src="${CalendarIcon}" alt="calendar icon">
              Today, 7:00am
            </button>
          </div>
        </div>
      </div>
      <button id="completedBtn">
        <img src="${CompleteIcon}" alt="Complete button">
        <p>Completed (20)</p>
      </button>
    `;

    return container;
  }

  renderTasks() {
    const groupedTasks = {};
    this.tasks.forEach(task => {
      const deadline = task.deadline || 'Today';
      if (!groupedTasks[deadline]) {
        groupedTasks[deadline] = [];
      }
      groupedTasks[deadline].push(task);
    });

    return Object.entries(groupedTasks).map(([deadline, tasks]) => {
      return `
        <span class="task-deadline">${deadline}</span>
        ${tasks.map(task => `
          <div class="task-details">
            <button class="check-btn">
              <img src="/public/images/circle.png" alt="check button">
            </button>
            <div class="task-name">
              <p>${task.title}</p>
              ${task.dateTime ? `
                <button class="date-btn">
                  <img src="/public/images/calendar.png" alt="calendar icon">
                  ${task.dateTime}
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      `;
    }).join('');
  }

  addTask(task) {
    this.tasks.push(task);
    this.update();
  }

  update() {
    const container = document.querySelector(`[data-list-id="${this.id}"]`);
    if (container) {
      const listTask = container.querySelector('.list-task');
      listTask.innerHTML = this.renderTasks();
      
      const completedBtn = container.querySelector('.completed-btn p');
      if (completedBtn) {
        completedBtn.textContent = `Completed (${this.completedCount})`;
      }
    }
  }

  render(container) {
    const element = this.createElement();
    container.appendChild(element);
  }
}

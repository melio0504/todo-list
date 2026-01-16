import ListContainer from '../components/list-container.js';

export default class ViewManager {
  constructor(lists, taskContainer, callbacks) {
    this.lists = lists;
    this.taskContainer = taskContainer;
    this.callbacks = callbacks;
    this.currentView = 'all';
    this.starredTasksContainer = null;
  }

  /**
   * @param {Object} listVisibility
   */
  showAllTasks(listVisibility) {
    this.currentView = 'all';
    this.taskContainer.innerHTML = '';
    
    this.lists.forEach(list => {
      const listElement = list.createElement();
      this.taskContainer.appendChild(listElement);
      
      if (listVisibility[list.id] === undefined) {
        listVisibility[list.id] = true;
      }
    });
  }

  /**
   * @param {Object} listVisibility
   */
  showStarredTasks(listVisibility) {
    this.currentView = 'starred';
    this.taskContainer.innerHTML = '';
    
    const starredTasks = [];
    this.lists.forEach(list => {
      list.tasks.forEach(task => {
        if (task.starred === true) {
          starredTasks.push({ ...task, listId: list.id });
        }
      });
    });

    this.starredTasksContainer = new ListContainer({
      id: 'starred-tasks',
      name: 'Starred Tasks',
      tasks: starredTasks
    });
    
    if (this.callbacks.onAddTask) {
      this.starredTasksContainer.onAddTask = this.callbacks.onAddTask;
    }
    
    this.starredTasksContainer.onTaskStarred = (taskId, starred) => {
      this.lists.forEach(list => {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          task.starred = starred;
          list.update();
        }
      });
      if (this.callbacks.onTaskStarred) {
        this.callbacks.onTaskStarred(taskId, starred);
      }
      this.showStarredTasks(listVisibility);
    };
    
    this.starredTasksContainer.onTaskCompleted = (taskId, completed) => {
      const starredTask = this.starredTasksContainer.tasks.find(t => t.id === taskId);
      if (starredTask && starredTask.listId) {
        const list = this.lists.find(l => l.id === starredTask.listId);
        if (list) {
          const task = list.tasks.find(t => t.id === taskId);
          if (task) {
            task.completed = completed;
            list.update();
          }
        }
      }
      if (this.callbacks.onTaskCompleted) {
        this.callbacks.onTaskCompleted(taskId, completed);
      }
      const anyStarred = this.lists.some(list => list.tasks.some(task => task.starred && !task.completed));
      if (anyStarred) {
        this.showStarredTasks(listVisibility);
      } else {
        this.taskContainer.innerHTML = '<div class="empty-message">No starred tasks left!</div>';
      }
    };
    
    this.starredTasksContainer.onDateClick = (taskId, listId) => {
      for (const list of this.lists) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          if (this.callbacks.onDateClick) {
            this.callbacks.onDateClick(taskId, list.id);
          }
          break;
        }
      }
    };
    
    this.starredTasksContainer.onListOptionsClick = (listId) => {
    };
    
    const starredElement = this.starredTasksContainer.createElement();
    this.taskContainer.appendChild(starredElement);
  }

  /**
   * @returns {string}
   */
  getCurrentView() {
    return this.currentView;
  }
}

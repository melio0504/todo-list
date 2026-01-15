import ListContainer from '../components/list-container.js';
import dummyData from '../data/dummy-data.json';

export default class ListManager {
  constructor(lists, callbacks) {
    this.lists = lists;
    this.callbacks = callbacks;
  }

  /**
   * @param {Function} formatDeadlineFromDate
   */
  createDefaultList(formatDeadlineFromDate) {
    if (dummyData.lists && dummyData.lists.length > 0) {
      dummyData.lists.forEach(listData => {
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
          name: listData.title,
          tasks: processedTasks
        });
        
        this.setupListCallbacks(list);
        this.lists.push(list);
      });
    } else {
      const defaultList = new ListContainer({ name: 'My Tasks' });
      this.setupListCallbacks(defaultList);
      this.lists.push(defaultList);
    }
  }

  /**
   * @param {ListContainer} list
   */
  setupListCallbacks(list) {
    if (this.callbacks.onAddTask) {
      list.onAddTask = this.callbacks.onAddTask;
    }
    if (this.callbacks.onTaskStarred) {
      list.onTaskStarred = this.callbacks.onTaskStarred;
    }
    if (this.callbacks.onTaskCompleted) {
      list.onTaskCompleted = this.callbacks.onTaskCompleted;
    }
    if (this.callbacks.onDateClick) {
      list.onDateClick = this.callbacks.onDateClick;
    }
    if (this.callbacks.onListOptionsClick) {
      list.onListOptionsClick = this.callbacks.onListOptionsClick;
    }
  }

  updateListDropdown() {
    const listSelect = document.getElementById('taskList');
    if (!listSelect) return;
    
    listSelect.innerHTML = '';
    
    this.lists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.name;
      option.textContent = list.name;
      listSelect.appendChild(option);
    });
  }

  /**
   * @param {string} name
   * @returns {ListContainer}
   */
  createNewList(name) {
    const newList = new ListContainer({ name, tasks: [] });
    this.setupListCallbacks(newList);
    this.lists.push(newList);
    this.updateListDropdown();
    return newList;
  }
}

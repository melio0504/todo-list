export default class StorageManager {
  constructor() {
    this.storageKey = 'todoListData';
  }

  /**
   * @param {Array} lists
   * @param {Object} listVisibility
   */
  saveToLocalStorage(lists, listVisibility) {
    try {
      const data = {
        lists: lists.map(list => ({
          id: list.id,
          name: list.name,
          tasks: list.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate || null,
            time: task.time || '',
            allDay: task.allDay || false,
            repeat: task.repeat || 'none',
            starred: task.starred === true,
            completed: task.completed === true,
            deadline: task.deadline || 'No date'
          }))
        })),
        listVisibility: listVisibility,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * @returns {Object|null}
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (!savedData) {
        return null;
      }

      return JSON.parse(savedData);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  /**
   * @returns {boolean}
   */
  hasSavedData() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

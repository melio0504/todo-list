export default class VisibilityManager {
  constructor(lists, listContent, showListBtn) {
    this.lists = lists;
    this.listContent = listContent;
    this.showListBtn = showListBtn;
    this.listVisibility = {};
    this.isListExpanded = true;
  }

  toggleListExpansion() {
    this.isListExpanded = !this.isListExpanded;
    if (this.isListExpanded) {
      this.listContent.style.display = 'block';
      if (this.showListBtn) {
        const img = this.showListBtn.querySelector('img');
        if (img) img.style.transform = 'rotate(0deg)';
      }
    } else {
      this.listContent.style.display = 'none';
      if (this.showListBtn) {
        const img = this.showListBtn.querySelector('img');
        if (img) img.style.transform = 'rotate(-180deg)';
      }
    }
  }

  /**
   * @param {string} currentView
   * @param {Function} onToggleVisibility
   */
  updateSidebarLists(currentView, onToggleVisibility) {
    if (!this.listContent) return;

    this.listContent.innerHTML = '';
    
    this.lists.forEach(list => {
      const listItem = document.createElement('div');
      listItem.className = 'sidebar-list-item';
      listItem.dataset.listId = list.id;
      
      if (this.listVisibility[list.id] === undefined) {
        this.listVisibility[list.id] = currentView === 'all';
      }
      
      listItem.innerHTML = `
        <input type="checkbox" class="list-checkbox" data-list-id="${list.id}" ${this.listVisibility[list.id] ? 'checked' : ''}>
        <span class="list-item-name">${list.name}</span>
      `;
      
      const checkbox = listItem.querySelector('.list-checkbox');
      const listItemName = listItem.querySelector('.list-item-name');
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleListVisibility(list.id, e.target.checked, onToggleVisibility);
      });
      
      listItemName.addEventListener('click', (e) => {
        e.stopPropagation();
        checkbox.checked = !checkbox.checked;
        this.toggleListVisibility(list.id, checkbox.checked, onToggleVisibility);
      });
      
      this.listContent.appendChild(listItem);
    });
  }

  /**
   * @param {string} listId
   * @param {string} currentView
   * @returns {boolean}
   */
  isListVisible(listId, currentView) {
    if (this.listVisibility[listId] !== undefined) {
      return this.listVisibility[listId];
    }
    const listElement = document.querySelector(`.list-container[data-list-id="${listId}"]`);
    if (listElement) {
      return listElement.style.display !== 'none';
    }
    return currentView === 'all';
  }

  /**
   * @param {string} listId
   * @param {boolean} show
   * @param {Function} onToggleVisibility
   */
  toggleListVisibility(listId, show, onToggleVisibility) {
    this.listVisibility[listId] = show;

    const list = this.lists.find(l => l.id === listId);
    const parent = document.querySelector('.task-container');
    const selector = `.list-container[data-list-id="${listId}"]`;
    const listElement = document.querySelector(selector);

    if (show) {
      if (!listElement && list && parent) {
        const newElement = list.createElement();
        parent.appendChild(newElement);
      }
    } else {
      if (listElement) {
        listElement.remove();
      }
    }

    if (onToggleVisibility) {
      onToggleVisibility();
    }
  }

  /**
   * @returns {Object}
   */
  getListVisibility() {
    return this.listVisibility;
  }

  /**
   * @param {Object} listVisibility
   */
  setListVisibility(listVisibility) {
    this.listVisibility = listVisibility || {};
  }

  /**
   * @param {string} listId
   * @param {string} currentView
   */
  setInitialVisibility(listId, currentView) {
    this.listVisibility[listId] = currentView === 'all';
  }
}

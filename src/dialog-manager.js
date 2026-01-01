import ListContainer from './list-container.js';

export default class DialogManager {
  constructor() {
    this.dialog = document.getElementById('createDialog');
    this.form = document.getElementById('createTaskForm');
    this.closeBtn = document.getElementById('closeDialog');
    this.cancelBtn = document.getElementById('cancelDialog');
    this.createBtn = document.getElementById('createBtn');
    this.taskContainer = document.querySelector('.task-container');
    this.allDayCheckbox = document.getElementById('allDay');
    this.timeSelect = document.getElementById('taskTime');
    this.dateInput = document.getElementById('taskDate');
    this.repeatSelect = document.getElementById('repeatOption');
    
    this.lists = [];
    this.init();
  }

  init() {
    const today = new Date();
    this.dateInput.value = today.toISOString().split('T')[0];
    
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

    this.createDefaultList();
  }

  updateRepeatOptions() {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[today.getDay()];
    const currentDate = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' });
    const fullDate = `${month} ${currentDate}`;

    const options = this.repeatSelect.querySelectorAll('option');
    options[2].textContent = `Weekly on ${currentDay}`;
    options[3].textContent = `Monthly on ${currentDate}`;
    options[4].textContent = `Annually on ${fullDate}`;
  }

  createDefaultList() {
    const defaultList = new ListContainer({ name: 'My Tasks' });
    this.lists.push(defaultList);
    defaultList.render(this.taskContainer);
    
    this.updateListDropdown();
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

  open() {
    this.dialog.classList.add('active');
    this.updateRepeatOptions();
    const today = new Date();
    this.dateInput.value = today.toISOString().split('T')[0];
  }

  close() {
    this.dialog.classList.remove('active');
    this.form.reset();

    const today = new Date();
    this.dateInput.value = today.toISOString().split('T')[0];
    this.allDayCheckbox.checked = false;
    this.timeSelect.disabled = false;
  }

  formatDateTime(date, time, allDay) {
    if (allDay) {
      const dateObj = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      
      const diffTime = dateObj - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const dateObj = new Date(`${date}T${time}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    const diffTime = dateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateStr = '';
    if (diffDays === 0) dateStr = 'Today';
    else if (diffDays === 1) dateStr = 'Tomorrow';
    else if (diffDays === -1) dateStr = 'Yesterday';
    else dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const timeStr = this.formatTime(time);
    return `${dateStr}, ${timeStr}`;
  }

  formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm.toLowerCase()}`;
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

    let targetList = this.lists.find(l => l.name === formData.list);
    
    if (!targetList) {
      targetList = new ListContainer({ name: formData.list });
      this.lists.push(targetList);
      targetList.render(this.taskContainer);
      this.updateListDropdown();
    }

    const task = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      allDay: formData.allDay,
      repeat: formData.repeat,
      dateTime: this.formatDateTime(formData.date, formData.time || '00:00', formData.allDay),
      deadline: this.formatDateTime(formData.date, formData.time || '00:00', formData.allDay)
    };

    targetList.addTask(task);

    this.close();
  }
}


'use strict'
const { format, differenceInCalendarDays, lightFormat } = require("date-fns");
const taskContainer = document.querySelector('#task-list-container');
const overlay = document.querySelector('#overlay');
const taskForm = document.querySelector('#add-task-form');
const addTaskDiv = document.querySelector('#add-new-task-div');
const taskListTitle = document.querySelector('#header-task');

// TASKS BEGIN
class Task {
    constructor(name, details, dueDate, project) {
        this.name = name;
        this.details = details;
        this.dueDate = dueDate;
        this.project = project;
        this.completed = false;
        this.id = name + new Date().getTime();
    }
};

// Task UI 
class TaskUI {
    // Creating list view DOM element
    static createElement(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('data-id', task.id);
        taskElement.innerHTML = `
            <div class="task-row-1">
                <div class="task-info">
                    <input type="checkbox" class="complete-task" ${task.completed && "checked"}>
                    <p class="task-name ${task.completed && "complete"}">${task.name}</p>
                </div>
                <div class="task-options">
                    <p class="edit-task">&#9998;</p>
                    <p class="delete-task">x</p>
                </div>
            </div>
            <div class="task-row-2">
                <p class="task-project">${task.project}</p>
                <p class="task-date">${task.dueDate}</p>
            </div>
        `
        return taskElement
        // taskContainer.appendChild(taskElement);
    }

    // Delete task from DOM
    static deleteElement(element) {
        element.remove();
    }

    static clearView() {
        const taskList = document.querySelector('#task-list-container');
        while (taskList.firstChild) {
            taskList.removeChild(taskList.lastChild);
          }
    }

    static clearTaskForm() {
        const taskName = document.querySelector('#new-task-name');
        const taskDetails = document.querySelector('#new-task-details');
        const taskDate = document.querySelector('#new-due-date');
        const taskProject = document.querySelector('#new-task-project');
        taskName.value = '';
        taskDetails.value = '';
        taskDate.value = '';
        taskProject.textContent = 'General Tasks';
        const errorMessage = document.querySelector('#new-task-error');
        errorMessage.style.display = 'none';
    }
};

class EditTask extends TaskUI {
    constructor(name, details, dueDate, project, id) {
        this.name = name;
        this.details = details;
        this.dueDate = dueDate;
        this.project = project;
        this.id = id;
    }

    static completeTask(taskId) {
        const tasks = TaskLocalStorage.getTasks();
        const taskIndex = tasks.findIndex(task => task.id == taskId)
        const matchingTask = tasks[taskIndex];
        matchingTask.completed == false ? matchingTask.completed = true : matchingTask.completed = false;
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    static createEditForm(task) {
        const editForm = document.createElement('div')
        editForm.classList.add('edit-task-form');
        editForm.setAttribute('data-id', task.id)
        editForm.innerHTML = `
            <form>
                <div class="edit-task-row-1">
                    <input type="text" placeholder="Name" class="edit-task-name" value="${task.name}">
                    <div id="edit-task-error">Please enter a task name</div>
                    <textarea class="edit-task-details" name="" id="" cols="30" rows="3" placeholder="Description">${task.details}</textarea>
                </div>
                <div class="edit-task-row-2">
                    <div>
                        <p>Due Date</p>
                        <input type="date" class="edit-due-date" value="${task.dueDate}">
                    </div>
                    <div>
                        <p>Project</p>
                        <div class="edit-task-project">${task.project || "General Tasks"}</div>
                        <div>
                            <ul class="edit-task-project-list project-dropdown">
                                <li class="project-option edit-project-option">General Tasks</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="edit-task-row-3">
                    <button class="edit-task-add">Save Task</button>
                    <button class="edit-task-cancel">Cancel</button>
                </div>
            </form>
        `
        return editForm
    }

    static flipEditView(task, taskId) {
        const tasks = TaskLocalStorage.getTasks();
        const taskIndex = tasks.findIndex(task => task.id == taskId)
        const matchingTask = tasks[taskIndex];
        const editView = this.createEditForm(matchingTask);
        task.replaceWith(editView)
        ProjectUI.createProjectDropdown();
    }

    static flipTaskView(task, taskId) {
        const tasks = TaskLocalStorage.getTasks();
        const taskIndex = tasks.findIndex(task => task.id == taskId)
        const matchingTask = tasks[taskIndex];
        const taskView = this.createElement(matchingTask);
        task.replaceWith(taskView)
    }

    static editTask(taskId, taskName, taskDetails, taskDueDate, taskProject) {
        const tasks = TaskLocalStorage.getTasks();
        const taskIndex = tasks.findIndex(task => task.id == taskId)
        const matchingTask = tasks[taskIndex];
        matchingTask.name = taskName;
        matchingTask.details = taskDetails;
        matchingTask.dueDate = taskDueDate;
        matchingTask.project = taskProject;
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// Task Count Class
class TaskCounts {
    static updateAllCount() {
        const allTasks = document.querySelector('#all-tasks');
        allTasks.textContent = TaskLocalStorage.getTasks().length;
    }

    static updateDayCounts() {
        const getAllTasks = TaskLocalStorage.getTasks();
        const todayCount = document.querySelector('#today-tasks');
        const weekCount = document.querySelector('#week-tasks');
        todayCount.textContent = getAllTasks.filter(Filters.filterDay, 0).length;
        weekCount.textContent = getAllTasks.filter(Filters.filterDay, 7).length
    }
};

// Task Local storage class
class TaskLocalStorage {
    // get tasks from local storage
    static getTasks() {
        let tasks;
        if (localStorage.getItem('tasks') === null) {
            tasks = [];
        } else {
            tasks = JSON.parse(localStorage.getItem('tasks'));
        }
        return tasks;
    }

    // add task to local storage
    static addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        ProjectCount.updateProjectCounts();
    }

    // remove class from local storage
    static removeTask(task) {
        const tasks = this.getTasks();
        tasks.forEach((storageTask, index) => {
            if (task.getAttribute('data-id') === storageTask.id) tasks.splice(index, 1);
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        ProjectCount.updateProjectCounts();
    }
}
// TASKS END

// PROJECTS BEGIN
class Project {
    constructor(name) {
        this.name = name;
        this.tasks = [];
    }
};

// Project UI
class ProjectUI {
    static createProjectElement(project) {
        const projectsContainer = document.querySelector('#projects-inbox');
        const projectElement = document.createElement('div');
        projectElement.innerHTML = 
        `
            <div class="sidebar-item project" id="${project.name}">
                <p class="project-name">${project.name}</p>
                <p id="${project.name}-count">${project.tasks.length}</p>
            </div>
        `
        projectsContainer.appendChild(projectElement);
    }

    static addProjectDropdown(project) {
        const projectDropdowns = document.querySelector('#new-task-project-list');
        const projectOption = document.createElement('li');
        projectOption.classList.add('project-option')
        projectOption.textContent = project.name;
        projectDropdowns.appendChild(projectOption);
    }

    static createProjectDropdown() {
        const projects = ProjectLocalStorage.getProjects();
        const projectDropdowns = document.querySelector('.edit-task-project-list');
        projects.forEach(proj => {
            const projectOption = document.createElement('li');
            projectOption.classList.add('project-option', 'edit-project-option')
            projectOption.textContent = proj.name;
            projectDropdowns.appendChild(projectOption);
        })
    }
};

// Project Local storage class
class ProjectLocalStorage {
    // get projects from local storage
    static getProjects() {
        let projects;
        if (localStorage.getItem('projects') === null) {
            projects = [];
        } else {
            projects = JSON.parse(localStorage.getItem('projects'));
        }
        return projects;
    }

    // add project to local storage
    static addProject(project) {
        const projects = this.getProjects();
        projects.push(project);
        localStorage.setItem('projects', JSON.stringify(projects));
    }
};

// Project Count Class
class ProjectCount {
    static removeProjectCount(id) {
        const taskId = id;
        const tasks = TaskLocalStorage.getTasks();
        const taskProject = tasks.find(task => task.id == taskId).project
        if (taskProject.length > 0) {
            const projects = ProjectLocalStorage.getProjects();
            const matchingProject = projects.findIndex(proj => proj.name == taskProject);
            const matchingProjectTasks = projects[matchingProject].tasks;
            matchingProjectTasks.splice(matchingProjectTasks.findIndex(task => task.id == taskId), 1)
            localStorage.setItem('projects', JSON.stringify(projects));
        }  
    }

    static updateProjectCounts() {
        const projects = ProjectLocalStorage.getProjects();
        const tasks = TaskLocalStorage.getTasks();
        projects.forEach(project => {
            const projectCount = tasks.filter(task => task.project == project.name)
            project.tasks = projectCount.map(proj => proj)
            const domProjectCount = document.querySelector(`#${project.name}-count`);
            domProjectCount.textContent = projectCount.length
        })
        localStorage.setItem('projects', JSON.stringify(projects));
    }
}

// PROJECTS END

// FILTERS BEGIN

class Filters {
    static filterToday() {
        const getAllTasks = TaskLocalStorage.getTasks();
        const todayTasks = getAllTasks.filter(Filters.filterDay, 0);
        todayTasks.forEach(task => taskContainer.appendChild(TaskUI.createElement(task)));
    }

    static filterWeek() {
        const getAllTasks = TaskLocalStorage.getTasks();
        const weekTasks = getAllTasks.filter(Filters.filterDay, 7);
        weekTasks.forEach(task => taskContainer.appendChild(TaskUI.createElement(task)));
    }

    static filterAll() {
        const getAllTasks = TaskLocalStorage.getTasks();
        getAllTasks.forEach(task => taskContainer.appendChild(TaskUI.createElement(task)));
    }

    static filterDay(task) {
        const taskDate = task.dueDate;
        const todayObj = format(new Date(), "yyyy-MM-dd")
        const dayDiff = differenceInCalendarDays(
            new Date(todayObj),
            new Date(taskDate)
            )
        // return (dayDiff <= this && dayDiff > -1); 
         return (dayDiff <= this && dayDiff > -1); 
    }

    static filterProject(project) {
        const projects = ProjectLocalStorage.getProjects();
        const projectTasks = projects.find(proj => proj.name == project).tasks
        projectTasks.forEach(project => taskContainer.appendChild(TaskUI.createElement(project)))
    }
}

// FILTERS END

// EVENT LISTENERS - Tasks

// Adding a task to UI
document.querySelector('#add-task').addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.querySelector('#new-task-name').value;
    const details = document.querySelector('#new-task-details').value;
    const dueDate = document.querySelector('#new-due-date').value;
    let project = document.querySelector('#new-task-project').textContent;
    if (project == 'General Tasks') project = ''
    if (name == '') {
        const errorMessage = document.querySelector('#new-task-error');
        errorMessage.style.display = 'block';
    } else {
        const task = new Task(name, details, dueDate, project);
        if (checkFilter(task)) {taskContainer.appendChild(TaskUI.createElement(task));}
        const errorMessage = document.querySelector('#new-task-error');
        errorMessage.style.display = 'none';
        TaskLocalStorage.addTask(task);
        TaskCounts.updateAllCount();
        TaskCounts.updateDayCounts();
        taskForm.style.display = 'none';
        addTaskDiv.style.display = 'block';
        overlay.classList.remove('active-overlay');
        TaskUI.clearTaskForm();
    }
});

// Complete task
document.querySelector('#task-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('complete-task')) {
        const taskId = e.target.closest('[data-id]');
        const taskName = e.target.nextElementSibling;
        taskName.classList.toggle('complete');
        EditTask.completeTask(taskId.getAttribute('data-id'));
    }
});

// Delete element from UI
document.querySelector('#task-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-task')) {
        const task = e.target.parentElement.parentElement.parentElement;
        TaskUI.deleteElement(task);
        ProjectCount.removeProjectCount(task.getAttribute('data-id'))
        TaskLocalStorage.removeTask(task);
        TaskCounts.updateAllCount();
        TaskCounts.updateDayCounts();
    }
});

// Edit tasks
document.querySelector('#task-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-task')) {
        const task = e.target.closest('[data-id]');
        const taskId = task.getAttribute('data-id');
        EditTask.flipEditView(task, taskId);
        overlay.classList.add('active-overlay');
    }
});


// Create elements from local storage on load
document.addEventListener('DOMContentLoaded', () => {
    // Load Tasks from local storage
    const tasks = TaskLocalStorage.getTasks();
    tasks.forEach(task => {taskContainer.appendChild(TaskUI.createElement(task))});
    tasks.forEach(task => TaskCounts.updateDayCounts(task));
    // Load Projects from local storage
    const projects = ProjectLocalStorage.getProjects();
    projects.forEach(project => ProjectUI.createProjectElement(project));
    projects.forEach(project => ProjectUI.addProjectDropdown(project));
    TaskCounts.updateAllCount();
    ProjectCount.updateProjectCounts();
});

// EVENT LISTENERS - Tasks

// Today Task Filter
document.querySelector('#today-filter').addEventListener('click', () => {
    TaskUI.clearView();
    Filters.filterToday();
})

document.querySelector('#week-filter').addEventListener('click', () => {
    TaskUI.clearView();
    Filters.filterWeek();
})

document.querySelector('#all-filter').addEventListener('click', () => {
    TaskUI.clearView();
    Filters.filterAll();
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-task-add')) {
        e.preventDefault();
        const editForm = document.querySelector('.edit-task-form')
        const task = e.target.closest('[data-id]');
        const taskId = editForm.closest('[data-id]').getAttribute('data-id');
        const taskName = document.querySelector('.edit-task-name');
        const taskDetails = document.querySelector('.edit-task-details');
        const taskDueDate = document.querySelector('.edit-due-date');
        let taskProject = document.querySelector('.edit-task-project').textContent;

        if (document.querySelector('.edit-task-name').value == '') {
            document.querySelector('#edit-task-error').style.display = 'block';
        } else {
            if (taskProject == 'General Tasks') taskProject = '';
            document.querySelector('#edit-task-error').style.display = 'none';
            EditTask.editTask(taskId,taskName.value, taskDetails.value, taskDueDate.value, taskProject);
            EditTask.flipTaskView(task, taskId)
            TaskCounts.updateAllCount();
            TaskCounts.updateDayCounts();
            ProjectCount.updateProjectCounts();
            overlay.classList.remove('active-overlay');
        }
        
        
    }
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-task-cancel')) {
        e.preventDefault();
        const task = e.target.closest('[data-id]');
        const taskId = task.getAttribute('data-id');
        EditTask.flipTaskView(task, taskId);
        overlay.classList.remove('active-overlay');
    }
});


// EVENT LISTENERS - Projects
// Adding a project to UI
document.querySelector('#create-project').addEventListener('click', () => {
    const projectName = document.querySelector('#add-project-input');
    if (projectName.value == '') {
        document.querySelector('#new-project-error').style.display = 'block';
    } else {
        const project = new Project(projectName.value);
        ProjectUI.createProjectElement(project);
        ProjectLocalStorage.addProject(project);
        ProjectUI.addProjectDropdown(project);
        document.querySelector('#new-project-error').style.display = 'none';
        projectName.value = '';
        document.querySelector('#project-input-div').style.display = 'none';
        document.querySelector('#add-new-project-div').style.display = 'block';
        document.querySelector('#new-project-error').style.display = 'none';
    }
});

// Filtering view for certain project
document.querySelector('#projects-inbox').addEventListener('click', (e) => {
    if (e.target.classList.contains('project')) {
        TaskUI.clearView();
        Filters.filterProject(e.target.getAttribute('id'));
    }
})

// Display add tasks inputs
document.querySelector('#add-new-task-div').addEventListener('click', () => {
    taskForm.style.display = 'flex';
    addTaskDiv.style.display = 'none';
    overlay.classList.add('active-overlay');
})

document.querySelector('#cancel-task').addEventListener('click', (e) => {
    e.preventDefault();
    taskForm.style.display = 'none';
    addTaskDiv.style.display = 'block';
    overlay.classList.remove('active-overlay');
    TaskUI.clearTaskForm();
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('project-option')) {
        document.querySelector('#new-task-project').textContent = e.target.textContent
        document.querySelector('#new-task-project-list').style.display = 'none';
    }
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-project-option')) {
        document.querySelector('.edit-task-project').textContent = e.target.textContent
        document.querySelector('.edit-task-project-list').style.display = 'none';
    }
})


document.querySelector('#new-task-project').addEventListener('click', () => {
    const projectList = document.querySelector('#new-task-project-list');
    if (projectList.style.display !== 'block') {
        projectList.style.display = 'block'
    } else {
        projectList.style.display = 'none'
    }
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-task-project')) {
        const projectList = document.querySelector('.edit-task-project-list');
        if (projectList.style.display !== 'block') {
            projectList.style.display = 'block'
        } else {
            projectList.style.display = 'none'
        }
    }
})


// Display add project inputs
document.querySelector('#add-new-project-div').addEventListener('click', () => {
    const projectInput = document.querySelector('#project-input-div');
    projectInput.style.display = 'block';
    document.querySelector('#add-new-project-div').style.display = 'none';
})

document.querySelector('#cancel-project').addEventListener('click', () => {
    document.querySelector('#project-input-div').style.display = 'none';
    document.querySelector('#add-new-project-div').style.display = 'block';
    document.querySelector('#new-project-error').style.display = 'none';
})

document.querySelector('#sidebar-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('sidebar-item')) {
        taskListTitle.textContent = e.target.firstElementChild.textContent
        activeSidebar();
        e.target.classList.add('sidebar-active');
    }
})

const activeSidebar = () => {
    document.querySelectorAll('.sidebar-item').forEach(ele => {
        if (ele.classList.contains('sidebar-active')) {
            ele.classList.remove('sidebar-active')
        }
    })
}

const checkFilter = (task) => {
    const taskProject = document.querySelector('#new-task-project').textContent;
    const currentFilter = document.querySelector('#header-task').textContent;

    switch(currentFilter) {
        case 'All Tasks':
            return true;
        case 'Today':
            if (filterDay(task, 0)) return true;
            case 'Week':
                if (filterDay(task, 7)) return true;
        default:
            if (taskProject == currentFilter) {
                return true;
            }
    }

    function filterDay(task, numDays) {
        const taskDate = task.dueDate;
        const todayObj = format(new Date(), "yyyy-MM-dd")
        const dayDiff = differenceInCalendarDays(
            new Date(todayObj),
            new Date(taskDate)
            )
         return (dayDiff <= numDays && dayDiff > -1); 
    }
}

document.querySelector('#menu').addEventListener('click', () => {
    const sidebar = document.querySelector('#sidebar')
    if (sidebar.offsetHeight == 0) {
        sidebar.style.height = '100vh';
    } else {
        sidebar.style.height = 0;
    }
})

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay')) alert('overlay')
})

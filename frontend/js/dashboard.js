/* =========================================================
   NEXUS DASHBOARD
   Dashboard functionality
========================================================= */


/* =========================================================
   STATE
========================================================= */

let projects = [];
let tasks = [];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const projectsContainer =
    document.getElementById("projectsContainer");

const tasksContainer =
    document.getElementById("tasksContainer");


/* =========================================================
   STATISTICS
========================================================= */

const totalProjects =
    document.getElementById("totalProjects");

const totalTasks =
    document.getElementById("totalTasks");

const completedTasks =
    document.getElementById("completedTasks");

const activeProjects =
    document.getElementById("activeProjects");


/* =========================================================
   PROJECT MODAL
========================================================= */

const projectModal =
    document.getElementById("projectModal");

const projectForm =
    document.getElementById("projectForm");

const projectName =
    document.getElementById("projectName");

const projectDescription =
    document.getElementById("projectDescription");

const projectColor =
    document.getElementById("projectColor");

const newProjectBtn =
    document.getElementById("newProjectBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelProjectModalBtn =
    document.getElementById(
        "cancelProjectModalBtn"
    );


/* =========================================================
   TASK MODAL
========================================================= */

const taskModal =
    document.getElementById("taskModal");

const taskForm =
    document.getElementById("taskForm");

const taskProject =
    document.getElementById("taskProject");

const taskTitle =
    document.getElementById("taskTitle");

const taskDescription =
    document.getElementById("taskDescription");

const taskPriority =
    document.getElementById("taskPriority");

const taskDueDate =
    document.getElementById("taskDueDate");

const taskSearch =
    document.getElementById("taskSearch");

const taskStatusFilter =
    document.getElementById("taskStatusFilter");

const taskPriorityFilter =
    document.getElementById("taskPriorityFilter");

const taskDueFilter =
    document.getElementById("taskDueFilter");

const productivitySummary =
    document.getElementById("productivitySummary");

const productivityMeter =
    document.getElementById("productivityMeter");

const dueSoonSummary =
    document.getElementById("dueSoonSummary");

const logoutBtn =
    document.getElementById("logoutBtn");

const newTaskBtn =
    document.getElementById("newTaskBtn");

const closeTaskModalBtn =
    document.getElementById("closeTaskModalBtn");

const cancelTaskModalBtn =
    document.getElementById(
        "cancelTaskModalBtn"
    );


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        showProjectLoading();

        showTaskLoading();


        const [
            projectData,
            taskData
        ] = await Promise.all([
            getProjects(),
            getTasks()
        ]);


        projects =
            Array.isArray(projectData)
                ? projectData
                : [];


        tasks =
            Array.isArray(taskData)
                ? taskData
                : [];


        updateStatistics();

        renderProjects();

        renderTasks();

        populateProjectSelect();


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showDashboardError(
            error.message
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const completed =
        tasks.filter(
            task =>
                task.status === "completed"
        ).length;


    const active =
        projects.filter(
            project =>
                project.status !== "completed"
        ).length;


    if (totalProjects) {
        totalProjects.textContent =
            projects.length;
    }


    if (totalTasks) {
        totalTasks.textContent =
            tasks.length;
    }


    if (completedTasks) {
        completedTasks.textContent =
            completed;
    }


    if (activeProjects) {
        activeProjects.textContent =
            active;
    }

    updateProductivitySummary();

}


function updateProductivitySummary() {

    const completed =
        tasks.filter(task => task.status === "completed").length;

    const completion =
        tasks.length > 0
            ? Math.round((completed / tasks.length) * 100)
            : 0;

    const dueSoon =
        tasks.filter(task => isDueSoon(task)).length;

    if (productivitySummary) {
        productivitySummary.textContent =
            tasks.length === 0
                ? "Ready for your first task"
                : `${completion}% of tasks completed`;
    }

    if (productivityMeter) {
        productivityMeter.style.width = `${completion}%`;
    }

    if (dueSoonSummary) {
        dueSoonSummary.textContent =
            dueSoon === 1
                ? "1 task due soon"
                : `${dueSoon} tasks due soon`;
    }

}


/* =========================================================
   PROJECTS
========================================================= */

function renderProjects() {

    if (!projectsContainer) {
        return;
    }


    if (projects.length === 0) {

        projectsContainer.innerHTML = `

            <div class="loading">

                <p>
                    No projects yet.
                </p>

                <button
                    type="button"
                    class="primary-button"
                    id="emptyProjectBtn"
                >
                    Create your first project
                </button>

            </div>

        `;


        const emptyProjectBtn =
            document.getElementById(
                "emptyProjectBtn"
            );


        if (emptyProjectBtn) {

            emptyProjectBtn.addEventListener(
                "click",
                openProjectModal
            );

        }


        return;

    }


    projectsContainer.innerHTML =
        projects
            .map(
                project =>
                    createProjectCard(project)
            )
            .join("");


    document
        .querySelectorAll(
            ".project-open-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const projectId =
                        button.dataset.projectId;


                    openProject(projectId);

                }
            );

        });

}


/* =========================================================
   PROJECT CARD
========================================================= */

function createProjectCard(project) {

    const projectTasks =
        tasks.filter(
            task =>
                Number(task.project_id) ===
                Number(project.id)
        );


    const completed =
        projectTasks.filter(
            task =>
                task.status === "completed"
        ).length;


    const progress =
        projectTasks.length > 0
            ? Math.round(
                (
                    completed /
                    projectTasks.length
                ) * 100
            )
            : 0;


    return `

        <article class="project-card">

            <div
                class="project-color"
                style="
                    background:
                    ${escapeHTML(
                        project.color ||
                        "#4f46e5"
                    )};
                "
            ></div>


            <h3>
                ${escapeHTML(
                    project.name
                )}
            </h3>


            <p>
                ${escapeHTML(
                    project.description ||
                    "No description provided."
                )}
            </p>


            <span class="project-status">

                ${escapeHTML(
                    formatStatus(
                        project.status ||
                        "active"
                    )
                )}

            </span>


            <div
                style="
                    margin-top:16px;
                    height:6px;
                    background:#eeeeee;
                    border-radius:10px;
                    overflow:hidden;
                "
            >

                <div
                    style="
                        width:${progress}%;
                        height:100%;
                        background:#4f46e5;
                    "
                ></div>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-top:16px;
                "
            >

                <span
                    style="
                        color:#737373;
                        font-size:0.8rem;
                    "
                >

                    ${completed}/${projectTasks.length}
                    completed

                </span>


                <button
                    type="button"
                    class="
                        project-open-button
                        secondary-button
                    "
                    data-project-id="${project.id}"
                >

                    Open →

                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   OPEN PROJECT
========================================================= */

function openProject(projectId) {

    window.location.href =
        `/project/${projectId}`;

}


/* =========================================================
   TASKS
========================================================= */

function renderTasks() {

    if (!tasksContainer) {
        return;
    }


    const visibleTasks = getVisibleTasks();

    if (tasks.length === 0) {

        tasksContainer.innerHTML = `

            <div class="loading">

                <p>
                    No tasks yet.
                </p>

                <button
                    type="button"
                    class="primary-button"
                    id="emptyTaskBtn"
                >
                    Create your first task
                </button>

            </div>

        `;


        const emptyTaskBtn =
            document.getElementById(
                "emptyTaskBtn"
            );


        if (emptyTaskBtn) {

            emptyTaskBtn.addEventListener(
                "click",
                openTaskModal
            );

        }


        return;

    }

    if (visibleTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state task-filter-empty">
                No tasks match these filters.
            </div>
        `;
        return;
    }


    tasksContainer.innerHTML =
        visibleTasks
            .map(
                task =>
                    createTaskRow(task)
            )
            .join("");


    attachTaskStatusListeners();

}


function getVisibleTasks() {

    const search =
        (taskSearch?.value || "").trim().toLowerCase();

    const status =
        taskStatusFilter?.value || "all";

    const priority =
        taskPriorityFilter?.value || "all";

    const due =
        taskDueFilter?.value || "all";

    return tasks.filter(task => {
        const matchesSearch =
            !search ||
            `${task.title} ${task.description || ""}`
                .toLowerCase()
                .includes(search);

        const matchesStatus =
            status === "all" || task.status === status;

        const matchesPriority =
            priority === "all" || task.priority === priority;

        const matchesDue =
            due === "all" ||
            (due === "overdue" && isOverdue(task)) ||
            (due === "upcoming" && isDueSoon(task)) ||
            (due === "none" && !task.due_date);

        return matchesSearch && matchesStatus && matchesPriority && matchesDue;
    });

}


/* =========================================================
   TASK ROW
========================================================= */

function createTaskRow(task) {

    const project =
        projects.find(
            project =>
                Number(project.id) ===
                Number(task.project_id)
        );


    const projectName =
        project
            ? project.name
            : "Unknown project";


    const status =
        task.status || "todo";

    const dueLabel =
        task.due_date
            ? formatDueDate(task.due_date)
            : "No deadline";

    const dueClass =
        isOverdue(task) ? " task-overdue" : "";


    return `

        <div
            class="task-row${dueClass}"
            data-task-id="${task.id}"
        >

            <div>

                <div class="task-title">

                    ${escapeHTML(
                        task.title
                    )}

                </div>


                <div class="task-description">

                    ${escapeHTML(
                        task.description ||
                        "No description"
                    )}

                </div>

            </div>


            <div>

                <div
                    style="
                        color:#737373;
                        font-size:0.75rem;
                        margin-bottom:6px;
                    "
                >

                    ${escapeHTML(
                        projectName
                    )}

                </div>


                <select
                    class="task-status-select"
                    data-task-id="${task.id}"
                    aria-label="Change task status"
                >

                    <option
                        value="todo"
                        ${status === "todo"
                            ? "selected"
                            : ""}
                    >
                        Todo
                    </option>


                    <option
                        value="in_progress"
                        ${status === "in_progress"
                            ? "selected"
                            : ""}
                    >
                        In Progress
                    </option>


                    <option
                        value="completed"
                        ${status === "completed"
                            ? "selected"
                            : ""}
                    >
                        Completed
                    </option>

                </select>

            </div>


            <div class="task-priority">

                ${escapeHTML(
                    formatStatus(
                        task.priority ||
                        "medium"
                    )
                )}

            </div>

            <div class="task-due-date">
                ${escapeHTML(dueLabel)}
            </div>

        </div>

    `;

}


/* =========================================================
   TASK STATUS LISTENERS
========================================================= */

function attachTaskStatusListeners() {

    const statusSelects =
        document.querySelectorAll(
            ".task-status-select"
        );


    statusSelects.forEach(select => {

        select.addEventListener(
            "change",
            async function () {

                const taskId =
                    Number(
                        this.dataset.taskId
                    );


                const newStatus =
                    this.value;


                await changeTaskStatus(
                    taskId,
                    newStatus,
                    this
                );

            }
        );

    });

}


/* =========================================================
   CHANGE TASK STATUS
========================================================= */

async function changeTaskStatus(
    taskId,
    newStatus,
    selectElement
) {

    const task =
        tasks.find(
            item =>
                Number(item.id) ===
                Number(taskId)
        );


    if (!task) {

        console.error(
            "Task not found:",
            taskId
        );

        return;

    }


    const previousStatus =
        task.status;


    /*
     * Disable the select while the
     * request is being processed.
     */

    if (selectElement) {
        selectElement.disabled = true;
    }


    try {

        /*
         * Send the complete task object.
         * The backend currently uses TaskCreate
         * for PUT /tasks/{task_id}.
         */

        const updatedTask =
            await updateTask(
                taskId,
                {
                    project_id:
                        task.project_id,

                    title:
                        task.title,

                    description:
                        task.description,

                    due_date:
                        task.due_date || null,

                    status:
                        newStatus,

                    priority:
                        task.priority
                }
            );


        /*
         * Use the backend response as the
         * source of truth.
         */

        task.project_id =
            updatedTask.project_id;

        task.title =
            updatedTask.title;

        task.description =
            updatedTask.description;

        task.due_date =
            updatedTask.due_date;

        task.status =
            updatedTask.status;

        task.priority =
            updatedTask.priority;


        /*
         * Update statistics.
         */

        updateStatistics();


        /*
         * Update project progress.
         */

        renderProjects();


        /*
         * Do NOT call renderTasks().
         *
         * The existing select already has
         * the correct value.
         */

        showMessage(
            "Task status updated successfully."
        );


    } catch (error) {

        console.error(
            "Could not update task status:",
            error
        );


        /*
         * Restore the previous value.
         */

        if (selectElement) {

            selectElement.value =
                previousStatus;

        }


        alert(
            `Could not update task status: ${error.message}`
        );


    } finally {

        if (selectElement) {
            selectElement.disabled = false;
        }

    }

}


/* =========================================================
   PROJECT SELECT FOR TASK FORM
========================================================= */

function populateProjectSelect() {

    if (!taskProject) {
        return;
    }


    const currentValue =
        taskProject.value;


    taskProject.innerHTML = `

        <option value="">
            Select a project
        </option>

    `;


    projects.forEach(project => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            project.id;


        option.textContent =
            project.name;


        taskProject.appendChild(
            option
        );

    });


    if (
        currentValue &&
        projects.some(
            project =>
                String(project.id) ===
                String(currentValue)
        )
    ) {

        taskProject.value =
            currentValue;

    }

}


/* =========================================================
   CREATE PROJECT
========================================================= */

async function handleProjectSubmit(event) {

    event.preventDefault();


    const name =
        projectName.value.trim();


    const description =
        projectDescription.value.trim();


    const color =
        projectColor.value ||
        "#4f46e5";


    if (!name) {

        alert(
            "Please enter a project name."
        );

        return;

    }


    try {

        await createProject({
            name:
                name,

            description:
                description ||
                null,

            status:
                "active",

            color:
                color
        });


        closeProjectModal();

        await loadDashboard();


        showMessage(
            "Project created successfully."
        );


    } catch (error) {

        console.error(
            "Project creation error:",
            error
        );


        alert(
            `Could not create project: ${error.message}`
        );

    }

}


/* =========================================================
   CREATE TASK
========================================================= */

async function handleTaskSubmit(event) {

    event.preventDefault();


    const projectId =
        Number(
            taskProject.value
        );


    const title =
        taskTitle.value.trim();


    const description =
        taskDescription.value.trim();


    const priority =
        taskPriority.value;


    if (!projectId) {

        alert(
            "Please select a project."
        );

        return;

    }


    if (!title) {

        alert(
            "Please enter a task title."
        );

        return;

    }


    try {

        await createTask({

            project_id:
                projectId,

            title:
                title,

            description:
                description ||
                null,

            status:
                "todo",

            priority:
                priority,

            due_date:
                taskDueDate?.value || null

        });


        closeTaskModal();

        await loadDashboard();


        showMessage(
            "Task created successfully."
        );


    } catch (error) {

        console.error(
            "Task creation error:",
            error
        );


        alert(
            `Could not create task: ${error.message}`
        );

    }

}


/* =========================================================
   PROJECT MODAL
========================================================= */

function openProjectModal() {

    if (!projectModal) {
        return;
    }


    projectModal.classList.remove(
        "hidden"
    );


    projectModal.setAttribute(
        "aria-hidden",
        "false"
    );


    if (projectName) {
        projectName.focus();
    }

}


function closeProjectModal() {

    if (!projectModal) {
        return;
    }


    projectModal.classList.add(
        "hidden"
    );


    projectModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (projectForm) {
        projectForm.reset();
    }

}


/* =========================================================
   TASK MODAL
========================================================= */

function openTaskModal() {

    if (!taskModal) {
        return;
    }


    populateProjectSelect();


    taskModal.classList.remove(
        "hidden"
    );


    taskModal.setAttribute(
        "aria-hidden",
        "false"
    );


    if (taskTitle) {
        taskTitle.focus();
    }

}


function closeTaskModal() {

    if (!taskModal) {
        return;
    }


    taskModal.classList.add(
        "hidden"
    );


    taskModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (taskForm) {
        taskForm.reset();
    }

}


/* =========================================================
   LOADING STATES
========================================================= */

function showProjectLoading() {

    if (!projectsContainer) {
        return;
    }


    projectsContainer.innerHTML = `

        <div class="loading">
            Loading projects...
        </div>

    `;

}


function showTaskLoading() {

    if (!tasksContainer) {
        return;
    }


    tasksContainer.innerHTML = `

        <div class="loading">
            Loading tasks...
        </div>

    `;

}


/* =========================================================
   ERROR
========================================================= */

function showDashboardError(message) {

    if (!projectsContainer) {
        return;
    }


    projectsContainer.innerHTML = `

        <div class="loading">

            <p>
                Unable to load dashboard.
            </p>

            <br>

            <p>
                ${escapeHTML(message)}
            </p>

            <br>

            <button
                id="retryDashboardBtn"
                type="button"
                class="primary-button"
            >
                Try Again
            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryDashboardBtn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadDashboard
        );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

    let messageBox =
        document.getElementById(
            "dashboardMessage"
        );


    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );


        messageBox.id =
            "dashboardMessage";


        messageBox.style.position =
            "fixed";

        messageBox.style.bottom =
            "24px";

        messageBox.style.right =
            "24px";

        messageBox.style.padding =
            "12px 18px";

        messageBox.style.background =
            "#171717";

        messageBox.style.color =
            "#ffffff";

        messageBox.style.borderRadius =
            "8px";

        messageBox.style.fontSize =
            "14px";

        messageBox.style.zIndex =
            "9999";

        messageBox.style.boxShadow =
            "0 8px 30px rgba(0,0,0,0.15)";


        document.body.appendChild(
            messageBox
        );

    }


    messageBox.textContent =
        message;


    clearTimeout(
        messageBox._timeout
    );


    messageBox._timeout =
        setTimeout(
            () => {

                if (messageBox.parentNode) {
                    messageBox.remove();
                }

            },
            2500
        );

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return String(status)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


function getDateOnly(value) {

    if (!value) {
        return null;
    }

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;

}


function startOfToday() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;

}


function isOverdue(task) {

    const dueDate = getDateOnly(task.due_date);

    return Boolean(
        dueDate &&
        task.status !== "completed" &&
        dueDate < startOfToday()
    );

}


function isDueSoon(task) {

    const dueDate = getDateOnly(task.due_date);
    const today = startOfToday();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return Boolean(
        dueDate &&
        task.status !== "completed" &&
        dueDate >= today &&
        dueDate <= nextWeek
    );

}


function formatDueDate(value) {

    const dueDate = getDateOnly(value);

    return dueDate
        ? `Due ${new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric"
        }).format(dueDate)}`
        : "No deadline";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */


/* New project */

if (newProjectBtn) {

    newProjectBtn.addEventListener(
        "click",
        openProjectModal
    );

}


/* Close project modal */

if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeProjectModal
    );

}


/* Cancel project */

if (cancelProjectModalBtn) {

    cancelProjectModalBtn.addEventListener(
        "click",
        closeProjectModal
    );

}


/* Project form */

if (projectForm) {

    projectForm.addEventListener(
        "submit",
        handleProjectSubmit
    );

}


/* New task */

if (newTaskBtn) {

    newTaskBtn.addEventListener(
        "click",
        openTaskModal
    );

}


/* Close task modal */

if (closeTaskModalBtn) {

    closeTaskModalBtn.addEventListener(
        "click",
        closeTaskModal
    );

}


/* Cancel task */

if (cancelTaskModalBtn) {

    cancelTaskModalBtn.addEventListener(
        "click",
        closeTaskModal
    );

}


/* Task form */

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        handleTaskSubmit
    );

}


[taskSearch, taskStatusFilter, taskPriorityFilter, taskDueFilter]
    .filter(Boolean)
    .forEach(control => {
        control.addEventListener("input", renderTasks);
        control.addEventListener("change", renderTasks);
    });


/* =========================================================
   CLOSE MODALS BY CLICKING OUTSIDE
========================================================= */

if (projectModal) {

    projectModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                projectModal
            ) {

                closeProjectModal();

            }

        }
    );

}


if (taskModal) {

    taskModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                taskModal
            ) {

                closeTaskModal();

            }

        }
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeProjectModal();

            closeTaskModal();

        }

    }
);


if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await fetch("/auth/logout", {
            method: "POST",
            credentials: "same-origin"
        });
        window.location.href = "/auth";
    });
}


/* =========================================================
   START DASHBOARD
========================================================= */

loadDashboard();
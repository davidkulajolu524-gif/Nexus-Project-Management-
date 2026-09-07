/* =====================================================
   NEXUS PROJECT WORKSPACE
   ===================================================== */

/* =====================================================
   PROJECT ID
   ===================================================== */

const params = new URLSearchParams(window.location.search);

const projectId =
    Number(
        params.get("id") ||
        window.location.pathname.match(
            /\/project\/(\d+)\/?$/
        )?.[1]
    );


/* =====================================================
   STATE
   ===================================================== */

let project = null;
let projectTasks = [];


/* =====================================================
   DOM
   ===================================================== */

const projectHeader =
    document.getElementById("projectHeader");

const tasksContainer =
    document.getElementById("tasksContainer");

const totalTasks =
    document.getElementById("totalTasks");

const todoTasks =
    document.getElementById("todoTasks");

const inProgressTasks =
    document.getElementById("inProgressTasks");

const completedTasks =
    document.getElementById("completedTasks");

const progressPercentage =
    document.getElementById("progressPercentage");

const progressBar =
    document.getElementById("progressBar");

const refreshBtn =
    document.getElementById("refreshBtn");


/* =====================================================
   MODAL
   ===================================================== */

const taskModal =
    document.getElementById("taskModal");

const taskForm =
    document.getElementById("taskForm");

const newTaskBtn =
    document.getElementById("newTaskBtn");

const closeTaskModalBtn =
    document.getElementById("closeTaskModalBtn");

const cancelTaskModalBtn =
    document.getElementById("cancelTaskModalBtn");

const taskTitle =
    document.getElementById("taskTitle");

const taskDescription =
    document.getElementById("taskDescription");

const taskPriority =
    document.getElementById("taskPriority");


/* =====================================================
   LOAD PROJECT
   ===================================================== */

async function loadProject() {

    if (!projectId) {
        showError("No project was selected.");
        return;
    }

    try {

        project =
            await getProject(projectId);

        const allTasks =
            await getTasks();

        projectTasks =
            allTasks.filter(
                task =>
                    Number(task.project_id) === projectId
            );

        renderProject();
        renderStats();
        renderTasks();
        renderProgress();

    } catch (error) {

        console.error(error);

        showError(error.message);
    }
}


/* =====================================================
   PROJECT HEADER
   ===================================================== */

function renderProject() {

    const color =
        project.color || "#4f46e5";

    const status =
        project.status || "active";

    projectHeader.innerHTML = `

        <div class="project-header-top">

            <div class="project-title-area">

                <div
                    class="project-icon"
                    style="background:${escapeHtml(color)}"
                ></div>

                <div>

                    <h1>
                        ${escapeHtml(project.name)}
                    </h1>

                    <p class="project-description">
                        ${escapeHtml(
                            project.description ||
                            "No description provided."
                        )}
                    </p>

                    <span class="project-status">
                        ${escapeHtml(status)}
                    </span>

                </div>

            </div>

            <button
                type="button"
                class="danger-button"
                id="deleteProjectBtn"
            >
                Delete Project
            </button>

        </div>

    `;
}


/* =====================================================
   STATS
   ===================================================== */

function renderStats() {

    const total =
        projectTasks.length;

    const todo =
        projectTasks.filter(
            task => task.status === "todo"
        ).length;

    const inProgress =
        projectTasks.filter(
            task => task.status === "in_progress"
        ).length;

    const completed =
        projectTasks.filter(
            task => task.status === "completed"
        ).length;

    totalTasks.textContent = total;
    todoTasks.textContent = todo;
    inProgressTasks.textContent = inProgress;
    completedTasks.textContent = completed;
}


/* =====================================================
   PROGRESS
   ===================================================== */

function renderProgress() {

    const total =
        projectTasks.length;

    const completed =
        projectTasks.filter(
            task => task.status === "completed"
        ).length;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );

    progressPercentage.textContent =
        `${percentage}%`;

    progressBar.style.width =
        `${percentage}%`;
}


/* =====================================================
   KANBAN BOARD
   ===================================================== */

function renderTasks() {

    const columns = [
        {
            status: "todo",
            title: "TO DO"
        },
        {
            status: "in_progress",
            title: "IN PROGRESS"
        },
        {
            status: "completed",
            title: "COMPLETED"
        }
    ];

    tasksContainer.innerHTML =
        columns
            .map(column => {

                const tasks =
                    projectTasks.filter(
                        task =>
                            task.status ===
                            column.status
                    );

                return createColumn(
                    column.title,
                    column.status,
                    tasks
                );

            })
            .join("");

    attachTaskListeners();
    attachDragAndDrop();
}


/* =====================================================
   KANBAN COLUMN
   ===================================================== */

function createColumn(
    title,
    status,
    taskList
) {

    return `

        <div
            class="task-column kanban-column"
            data-status="${status}"
        >

            <div class="task-column-header">

                <span class="task-column-title">
                    ${title}
                </span>

                <span class="task-column-count">
                    ${taskList.length}
                </span>

            </div>

            <div
                class="task-column-list kanban-drop-zone"
                data-status="${status}"
            >

                ${
                    taskList.length === 0

                        ? `
                            <div class="empty-state">
                                Drop tasks here
                            </div>
                        `

                        : taskList
                            .map(createTaskCard)
                            .join("")
                }

            </div>

        </div>

    `;
}


/* =====================================================
   TASK CARD
   ===================================================== */

function createTaskCard(task) {

    const priority =
        task.priority || "medium";

    return `

        <article
            class="task-card kanban-card"
            data-id="${task.id}"
            draggable="true"
        >

            <div class="task-card-title">
                ${escapeHtml(task.title)}
            </div>

            <div class="task-card-description">
                ${escapeHtml(
                    task.description ||
                    "No description"
                )}
            </div>

            <span
                class="
                    task-priority
                    priority-${escapeHtml(priority)}
                "
            >
                ${escapeHtml(priority)}
            </span>

            <div class="task-card-actions">

                <label class="task-status-control">

                    <span class="sr-only">
                        Task status
                    </span>

                    <select
                        class="task-status-select"
                        data-task-id="${task.id}"
                        aria-label="Change task status"
                    >

                        <option
                            value="todo"
                            ${task.status === "todo" ? "selected" : ""}
                        >
                            To do
                        </option>

                        <option
                            value="in_progress"
                            ${task.status === "in_progress" ? "selected" : ""}
                        >
                            In progress
                        </option>

                        <option
                            value="completed"
                            ${task.status === "completed" ? "selected" : ""}
                        >
                            Completed
                        </option>

                    </select>

                </label>

                <button
                    type="button"
                    class="task-delete-button"
                    data-task-id="${task.id}"
                    aria-label="Delete ${escapeHtml(task.title)}"
                >
                    Delete
                </button>

            </div>

        </article>

    `;
}


/* =====================================================
   DRAG AND DROP
   ===================================================== */

function attachDragAndDrop() {

    const cards =
        document.querySelectorAll(
            ".kanban-card"
        );

    const dropZones =
        document.querySelectorAll(
            ".kanban-drop-zone"
        );


    /* ---------------------------------------------
       DRAG START
       --------------------------------------------- */

    cards.forEach(card => {

        card.addEventListener(
            "dragstart",
            event => {

                card.classList.add(
                    "dragging"
                );

                event.dataTransfer.effectAllowed =
                    "move";

                event.dataTransfer.setData(
                    "text/plain",
                    card.dataset.id
                );
            }
        );


        /* -----------------------------------------
           DRAG END
           ----------------------------------------- */

        card.addEventListener(
            "dragend",
            () => {

                card.classList.remove(
                    "dragging"
                );

                dropZones.forEach(zone => {

                    zone.classList.remove(
                        "drag-over"
                    );

                });

            }
        );

    });


    /* ---------------------------------------------
       DRAG OVER
       --------------------------------------------- */

    dropZones.forEach(zone => {

        zone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                event.dataTransfer.dropEffect =
                    "move";

                zone.classList.add(
                    "drag-over"
                );

            }
        );


        /* -----------------------------------------
           DRAG LEAVE
           ----------------------------------------- */

        zone.addEventListener(
            "dragleave",
            event => {

                if (
                    !zone.contains(
                        event.relatedTarget
                    )
                ) {

                    zone.classList.remove(
                        "drag-over"
                    );

                }

            }
        );


        /* -----------------------------------------
           DROP
           ----------------------------------------- */

        zone.addEventListener(
            "drop",
            async event => {

                event.preventDefault();

                zone.classList.remove(
                    "drag-over"
                );

                const taskId =
                    Number(
                        event.dataTransfer.getData(
                            "text/plain"
                        )
                    );

                const newStatus =
                    zone.dataset.status;

                await moveTask(
                    taskId,
                    newStatus
                );

            }
        );

    });

}


/* =====================================================
   MOVE TASK
   ===================================================== */

async function moveTask(
    taskId,
    newStatus
) {

    const task =
        projectTasks.find(
            item =>
                Number(item.id) === taskId
        );

    if (!task) {
        return;
    }

    /* No change needed */

    if (task.status === newStatus) {
        return;
    }

    const previousStatus =
        task.status;

    try {

        /* Update local UI immediately */

        task.status = newStatus;

        renderTasks();
        renderStats();
        renderProgress();

        /* Persist to backend */

        await updateTask(
            taskId,
            {
                project_id: projectId,
                title: task.title,
                description:
                    task.description || null,
                status: newStatus,
                priority:
                    task.priority || "medium",
                due_date:
                    task.due_date || null
            }
        );

    } catch (error) {

        console.error(
            "Unable to move task:",
            error
        );

        /* Restore previous state */

        task.status =
            previousStatus;

        renderTasks();
        renderStats();
        renderProgress();

        alert(
            error.message ||
            "Unable to move task."
        );

    }

}


/* =====================================================
   TASK LISTENERS
   ===================================================== */

function attachTaskListeners() {

    document
        .querySelectorAll(
            ".task-status-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                event => {

                    event.stopPropagation();

                    updateProjectTaskStatus(
                        Number(
                            select.dataset.taskId
                        ),
                        select.value
                    );

                }
            );


            select.addEventListener(
                "click",
                event =>
                    event.stopPropagation()
            );

        });


    document
        .querySelectorAll(
            ".task-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteProjectTask(
                        Number(
                            button.dataset.taskId
                        )
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".task-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    /*
                     * Don't open edit prompt when
                     * clicking controls.
                     */

                    if (
                        event.target.closest(
                            "select, button"
                        )
                    ) {
                        return;
                    }

                    const id =
                        Number(
                            card.dataset.id
                        );

                    editTask(id);

                }
            );

        });

}


/* =====================================================
   STATUS SELECT
   ===================================================== */

async function updateProjectTaskStatus(
    id,
    status
) {

    const task =
        projectTasks.find(
            item =>
                Number(item.id) === id
        );

    if (!task) {
        return;
    }

    await moveTask(
        id,
        status
    );
}


/* =====================================================
   DELETE TASK
   ===================================================== */

async function deleteProjectTask(id) {

    const task =
        projectTasks.find(
            item =>
                Number(item.id) === id
        );

    if (
        !task ||
        !confirm(
            `Delete task "${task.title}"?`
        )
    ) {
        return;
    }

    try {

        await deleteTask(id);

        await loadProject();

    } catch (error) {

        alert(error.message);

    }

}


/* =====================================================
   DELETE PROJECT
   ===================================================== */

async function deleteCurrentProject() {

    if (
        !project ||
        !confirm(
            `Delete project "${project.name}" and all its tasks?`
        )
    ) {
        return;
    }

    try {

        await deleteProject(projectId);

        window.location.href =
            "/dashboard";

    } catch (error) {

        alert(error.message);

    }

}


/* =====================================================
   EDIT TASK
   ===================================================== */

async function editTask(id) {

    const task =
        projectTasks.find(
            item =>
                Number(item.id) === id
        );

    if (!task) {
        return;
    }

    const title =
        prompt(
            "Task title:",
            task.title
        );

    if (title === null) {
        return;
    }

    const description =
        prompt(
            "Task description:",
            task.description || ""
        );

    if (description === null) {
        return;
    }

    const status =
        prompt(
            "Status: todo, in_progress, completed",
            task.status
        );

    if (status === null) {
        return;
    }

    const priority =
        prompt(
            "Priority: low, medium, high",
            task.priority || "medium"
        );

    if (priority === null) {
        return;
    }

    const validStatuses = [
        "todo",
        "in_progress",
        "completed"
    ];

    const validPriorities = [
        "low",
        "medium",
        "high"
    ];

    if (
        !validStatuses.includes(
            status.trim()
        )
    ) {

        alert("Invalid status.");

        return;
    }

    if (
        !validPriorities.includes(
            priority.trim()
        )
    ) {

        alert("Invalid priority.");

        return;
    }

    try {

        await updateTask(
            id,
            {
                project_id: projectId,
                title: title.trim(),
                description:
                    description.trim() ||
                    null,
                status:
                    status.trim(),
                priority:
                    priority.trim(),
                due_date:
                    task.due_date || null
            }
        );

        await loadProject();

    } catch (error) {

        alert(error.message);

    }

}


/* =====================================================
   CREATE TASK MODAL
   ===================================================== */

function openTaskModal() {

    taskModal.classList.remove(
        "hidden"
    );

    taskModal.setAttribute(
        "aria-hidden",
        "false"
    );

    taskTitle.focus();

}


function closeTaskModal() {

    taskModal.classList.add(
        "hidden"
    );

    taskModal.setAttribute(
        "aria-hidden",
        "true"
    );

    taskForm.reset();

}


/* =====================================================
   CREATE TASK
   ===================================================== */

async function createProjectTask(event) {

    event.preventDefault();

    const title =
        taskTitle.value.trim();

    const description =
        taskDescription.value.trim();

    const priority =
        taskPriority.value;

    if (!title) {

        alert(
            "Please enter a task title."
        );

        return;
    }

    try {

        await createTask(
            {
                project_id: projectId,
                title,
                description:
                    description || null,
                status: "todo",
                priority
            }
        );

        closeTaskModal();

        await loadProject();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


/* =====================================================
   ERROR
   ===================================================== */

function showError(message) {

    projectHeader.innerHTML = `

        <div class="loading">

            Unable to load project.

            <br><br>

            ${escapeHtml(message)}

        </div>

    `;

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   EVENTS
   ===================================================== */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadProject
    );

}


document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                "#deleteProjectBtn"
            )
        ) {

            deleteCurrentProject();

        }

    }
);


if (newTaskBtn) {

    newTaskBtn.addEventListener(
        "click",
        openTaskModal
    );

}


if (closeTaskModalBtn) {

    closeTaskModalBtn.addEventListener(
        "click",
        closeTaskModal
    );

}


if (cancelTaskModalBtn) {

    cancelTaskModalBtn.addEventListener(
        "click",
        closeTaskModal
    );

}


if (taskForm) {

    taskForm.addEventListener(
        "submit",
        createProjectTask
    );

}


if (taskModal) {

    taskModal.addEventListener(
        "click",
        event => {

            if (
                event.target === taskModal
            ) {

                closeTaskModal();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeTaskModal();

        }

    }
);


/* =====================================================
   START
   ===================================================== */

loadProject();

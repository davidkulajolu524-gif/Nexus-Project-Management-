const API_BASE = "/";


async function apiRequest(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        }
    );

    if (!response.ok) {
        let errorMessage = "Something went wrong.";

        try {
            const error = await response.json();
            errorMessage = error.detail || errorMessage;
        } catch {
            // Ignore JSON parsing errors.
        }

        throw new Error(errorMessage);
    }

    return response.json();
}


/* =========================
   PROJECTS
========================= */

async function getProjects() {
    return apiRequest("projects/");
}


async function getProject(projectId) {
    return apiRequest(`projects/${projectId}`);
}


async function createProject(project) {
    return apiRequest(
        "projects/",
        {
            method: "POST",
            body: JSON.stringify(project)
        }
    );
}


async function updateProject(projectId, project) {
    return apiRequest(
        `projects/${projectId}`,
        {
            method: "PUT",
            body: JSON.stringify(project)
        }
    );
}


async function deleteProject(projectId) {
    return apiRequest(
        `projects/${projectId}`,
        {
            method: "DELETE"
        }
    );
}


/* =========================
   TASKS
========================= */

async function getTasks() {
    return apiRequest("tasks/");
}


async function getTask(taskId) {
    return apiRequest(`tasks/${taskId}`);
}


async function createTask(task) {
    return apiRequest(
        "tasks/",
        {
            method: "POST",
            body: JSON.stringify(task)
        }
    );
}


async function updateTask(taskId, task) {
    return apiRequest(
        `tasks/${taskId}`,
        {
            method: "PUT",
            body: JSON.stringify(task)
        }
    );
}


async function deleteTask(taskId) {
    return apiRequest(
        `tasks/${taskId}`,
        {
            method: "DELETE"
        }
    );
}

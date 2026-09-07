const API_BASE = "/";


async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers
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


/* =========================
   PROJECT WORKSPACE
========================= */

async function getProjectMembers(projectId) {
    return apiRequest(`projects/${projectId}/members`);
}


async function addProjectMember(projectId, member) {
    return apiRequest(
        `projects/${projectId}/members/invite`,
        {
            method: "POST",
            body: JSON.stringify(member)
        }
    );
}


async function acceptProjectInvitation(projectId, token) {
    return apiRequest(
        `projects/${projectId}/invitations/${encodeURIComponent(token)}/accept`,
        { method: "POST" }
    );
}


async function deleteProjectMember(projectId, memberId) {
    return apiRequest(
        `projects/${projectId}/members/${memberId}`,
        { method: "DELETE" }
    );
}


async function getProjectFiles(projectId) {
    return apiRequest(`projects/${projectId}/files`);
}


async function uploadProjectFile(projectId, file) {
    const formData = new FormData();
    formData.append("upload", file);

    return apiRequest(
        `projects/${projectId}/files`,
        {
            method: "POST",
            body: formData
        }
    );
}


async function deleteProjectFile(projectId, fileId) {
    return apiRequest(
        `projects/${projectId}/files/${fileId}`,
        { method: "DELETE" }
    );
}

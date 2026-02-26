const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ukendt fejl' }));
        throw new Error(error.error || 'API fejl');
    }

    return response.json();
}

// Children API
export const childrenApi = {
    getAll: () => fetchApi('/children'),
    getById: (id) => fetchApi(`/children/${id}`),
    create: (data) => fetchApi('/children', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchApi(`/children/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchApi(`/children/${id}`, { method: 'DELETE' })
};

// Caregivers API
export const caregiversApi = {
    getAll: () => fetchApi('/caregivers'),
    getById: (id) => fetchApi(`/caregivers/${id}`),
    create: (data) => fetchApi('/caregivers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchApi(`/caregivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchApi(`/caregivers/${id}`, { method: 'DELETE' })
};

// Time Entries API
export const timeEntriesApi = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchApi(`/time-entries${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchApi(`/time-entries/${id}`),
    create: (data) => fetchApi('/time-entries', { method: 'POST', body: JSON.stringify(data) }),
    preview: (data) => fetchApi('/time-entries/preview', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id, reviewedBy) => fetchApi(`/time-entries/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ reviewed_by: reviewedBy })
    }),
    reject: (id, reviewedBy, reason) => fetchApi(`/time-entries/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reviewed_by: reviewedBy, rejection_reason: reason })
    }),
    markPayroll: (id, payrollDate = null) => fetchApi(`/time-entries/${id}/payroll`, {
        method: 'PUT',
        body: JSON.stringify(payrollDate != null ? { payroll_date: payrollDate } : {})
    }),
    batchApprove: (ids, reviewedBy) => fetchApi('/time-entries/batch-approve', {
        method: 'POST',
        body: JSON.stringify({ ids, reviewed_by: reviewedBy })
    })
};

// Extra grants API
export const extraGrantsApi = {
    getAll: (childId = null) => fetchApi(`/extra-grants${childId ? `?child_id=${childId}` : ''}`),
    getById: (id) => fetchApi(`/extra-grants/${id}`),
    create: (data) => fetchApi('/extra-grants', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchApi(`/extra-grants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchApi(`/extra-grants/${id}`, { method: 'DELETE' })
};

// Settings API
export const settingsApi = {
    getMonthInterval: () => fetchApi('/settings/month-interval'),
    getMonthIntervalHistory: () => fetchApi('/settings/month-interval/history'),
    updateMonthInterval: (startDay, endDay) => fetchApi('/settings/month-interval', {
        method: 'PUT',
        body: JSON.stringify({ start_day: startDay, end_day: endDay })
    })
};

// Export API
export const exportApi = {
    timeEntries: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return `${API_BASE}/export/time-entries${queryString ? `?${queryString}` : ''}`;
    },
    children: () => `${API_BASE}/export/children`
};

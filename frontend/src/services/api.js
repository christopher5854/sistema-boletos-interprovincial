const BASE_URL = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const api = {
    get: async (endpoint) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: headers()
        });
        return res.json();
    },

    post: async (endpoint, body) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(body)
        });
        return res.json();
    },

    put: async (endpoint, body) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(body)
        });
        return res.json();
    },

    patch: async (endpoint, body) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(body)
        });
        return res.json();
    },

    delete: async (endpoint) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: headers()
        });
        return res.json();
    }
};

export default api;
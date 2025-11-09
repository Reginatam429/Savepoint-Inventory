import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://savepoint-inventory-api-f31a737b8235.herokuapp.com";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

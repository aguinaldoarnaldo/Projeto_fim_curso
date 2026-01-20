import api from './api';

export const getClasses = async () => {
    try {
        const response = await api.get('classes/');
        // Handle both simple list and paginated results
        return response.data.results || response.data;
    } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
    }
};

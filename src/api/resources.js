import client from './client';

export const createResourceApi = (resource) => ({
  getAll: async () => {
    const { data } = await client.get(`/${resource}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await client.post(`/${resource}`, payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await client.put(`/${resource}/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await client.delete(`/${resource}/${id}`);
    return data;
  }
});

export const studySessionsApi = createResourceApi('study-sessions');
export const notesApi = createResourceApi('notes');
export const flashcardsApi = createResourceApi('flashcards');
export const examScoresApi = createResourceApi('exam-scores');

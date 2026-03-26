import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5001/api'
});

export default client;

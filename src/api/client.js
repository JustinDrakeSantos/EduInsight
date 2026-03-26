import axios from 'axios';

const client = axios.create({
  baseURL: 'http://54.177.46.189:5001/api'
});

export default client;

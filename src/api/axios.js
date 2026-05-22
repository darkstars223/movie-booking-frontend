import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://app-fbb420bd-d1bb-4470-b979-da0ba66940ba.cleverapps.io/' || 'http://localhost:5000/api'
});

export default instance;
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/entries';

export const fetchEntries = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch entries", err);
    throw err;
  }
};

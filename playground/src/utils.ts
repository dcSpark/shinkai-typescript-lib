import axios from 'axios';

export const postData = async (input: string, path: string) => {
  try {
    const url = `http://127.0.0.1:9550${path}`; // Construct the full URL with the path
    const response = await axios.post(url, input);
    console.log('Response:', response.data);
  } catch (error) {
    // console.error('Error during POST request:', error);
  }
};

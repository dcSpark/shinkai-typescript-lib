import axios from "axios";

export const postData = async (
  input: string,
  path: string
): Promise<{ status: string; data: any }> => {
  try {
    const url = `http://127.0.0.1:9550${path}`; // Construct the full URL with the path
    const response = await axios.post(url, input);
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error during POST request:",
      (error as any).response.data.error
    );
    return { status: "error", data: (error as any).response.data.error };
  }
};

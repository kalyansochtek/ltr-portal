export async function fetchSAMData() {
  try {
    const response = await fetch("/api/sam");

    const data = await response.json();

    console.log("SAM DATA:", data);

    return data;
  } catch (error) {
    console.error("SAM API Error:", error);
  }
}
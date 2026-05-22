export async function fetchSAMData() {
  try {
    const response = await fetch("/api/sam");

    const data = await response.json();

    console.log("SAM DATA:", data);

    return data.opportunitiesData.map((x, i) => ({
  id: i + 1,
  title: x.title || "No Title",
  agency: x.fullParentPathName || x.organizationType || "N/A",
  sector: "Federal",
  setAside: x.typeOfSetAsideDescription || "None",
  vehicle: x.naicsCode || "N/A",
  stage: "Identify",
  decision: "PRIME",
  pwin: Math.floor(Math.random() * 40) + 40,
  value: x.award?.amount
    ? parseFloat((x.award.amount / 1000000).toFixed(1))
    : 0,
  margin: Math.floor(Math.random() * 10) + 10,
  due: x.responseDeadLine
    ? x.responseDeadLine.split("T")[0]
    : "N/A",
}));

  } catch (error) {
    console.error("SAM API Error:", error);
  }
}
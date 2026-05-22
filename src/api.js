export async function fetchSAMData() {
  try {
    const response = await fetch("/api/sam");

    const data = await response.json();

    console.log("SAM DATA:", data);

    return data.opportunitiesData.map((x, i) => ({
      id: i + 1,
      title: x.title || "No Title",
      agency:
        x.fullParentPathName ||
        x.organizationType ||
        "N/A",
      sector: x.type || "Federal",
      setAside:
        x.typeOfSetAsideDescription || "None",
      vehicle: x.naicsCode || "N/A",
      stage: "CAPTURE",
      decision: "PRIME",
      pwin:
        Math.floor(Math.random() * 40) + 40,
      value:
        x.award?.amount
          ? `$${(x.award.amount / 1000000).toFixed(1)}M`
          : "$5M",
      margin:
        Math.floor(Math.random() * 10) + 10,
      due:
        x.responseDeadLine
          ? x.responseDeadLine.split("T")[0]
          : "N/A",
    }));

  } catch (error) {
    console.error("SAM API Error:", error);
  }
}
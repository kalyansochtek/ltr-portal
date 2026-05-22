export async function fetchSAMData() {
  try {
    const response = await fetch("/api/sam");
    const data = await response.json();
    console.log("SAM DATA:", data);

   
    if (data.code === '900804' || !data.opportunitiesData) {
      console.log("API limit hit - using fallback data");
      return FALLBACK_OPPS;
    }

    return data.opportunitiesData.map((x, i) => ({
      id: i + 1,
      title: x.title || "No Title",
      agency: x.fullParentPathName || "N/A",
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
    return FALLBACK_OPPS;
  }
}

const FALLBACK_OPPS = [
  { id:1, title:"IT Modernization Support Services", agency:"DHS CISA", sector:"Federal", naics:"541512", type:"RFP", setAside:"HUBZone", due:"2025-08-15", decision:"PRIME", pwin:72, vehicle:"Polaris HUBZone", stage:"Capture", value:8.5, margin:18 },
  { id:2, title:"Cybersecurity Operations Center", agency:"DoD DISA", sector:"Federal", naics:"541519", type:"RFI", setAside:"8(a)", due:"2025-07-30", decision:"TEAM", pwin:45, vehicle:"OASIS+ HUBZone", stage:"Qualify", value:22, margin:14 },
  { id:3, title:"AI/ML Analytics Platform", agency:"VA TechOps", sector:"Federal", naics:"541511", type:"Sources Sought", setAside:"SB", due:"2025-09-01", decision:"SUB", pwin:38, vehicle:"GSA MAS", stage:"Identify", value:4.2, margin:12 },
];
(async function () {
  const key = localStorage.getItem("tm_key");

  if (!key) {
    document.documentElement.innerHTML = `
      <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">Access denied</h1>
    `;
    throw new Error("No key found");
  }

  try {
    const response = await fetch("https://morning-math-bdd6.aleksanderlleshaj33.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ key })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      document.documentElement.innerHTML = `
        <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">Bad worker response</h1>
      `;
      throw new Error("Worker nuk ktheu JSON: " + text);
    }

    if (!response.ok || !data.ok) {
      document.documentElement.innerHTML = `
        <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">${data.error || "Invalid key"}</h1>
      `;
      throw new Error(data.error || "Invalid key");
    }

    console.log("Key verified");
  } catch (error) {
    console.error("Verification error:", error);
    document.documentElement.innerHTML = `
      <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">Verification failed</h1>
    `;
    throw error;
  }
})();

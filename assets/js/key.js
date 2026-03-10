(async function () {

  const key = localStorage.getItem("tm_key");

  if (!key) {
    document.documentElement.innerHTML = "<h1>Access denied</h1>";
    throw new Error("No key");
  }

  try {

    const r = await fetch("https://morning-math-bdd6.aleksanderlleshaj33.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ key })
    });

    const data = await r.json();

    if (!data.ok) {
      document.documentElement.innerHTML = "<h1>Invalid key</h1>";
      throw new Error("Invalid key");
    }

  } catch (e) {

    document.documentElement.innerHTML = "<h1>Verification failed</h1>";
    throw e;

  }

})();

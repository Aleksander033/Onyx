(async function () {

  // merr key nga Tampermonkey
  const key = localStorage.getItem("tm_key");

  // nëse nuk ka key blloko faqen
  if (!key) {
    document.documentElement.innerHTML = `
      <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">
      Access denied
      </h1>
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

    const data = await response.json();

    // nëse key nuk është valide
    if (!data.ok) {

      document.documentElement.innerHTML = `
        <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">
        Invalid key
        </h1>
      `;

      throw new Error("Invalid key");

    }

    // nëse është OK faqja vazhdon normalisht
    console.log("Key verified ✔");

  } catch (error) {

    console.error("Verification error:", error);

    document.documentElement.innerHTML = `
      <h1 style="text-align:center;margin-top:100px;font-family:sans-serif;">
      Verification failed
      </h1>
    `;

    throw error;

  }

})();

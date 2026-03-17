const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/send", async (req, res) => {
  try {
    const { token, phone_id, payload } = req.body;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));

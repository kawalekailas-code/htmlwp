const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

/* =========================
   📥 FETCH TEMPLATES
========================= */
app.get("/templates", async (req, res) => {
  const { token, waba } = req.query;

  try {
    const r = await fetch(
      `https://graph.facebook.com/v18.0/${waba}/message_templates`,
      {
        headers: { Authorization: "Bearer " + token }
      }
    );

    const data = await r.json();

    console.log("TEMPLATES:", JSON.stringify(data));

    res.json(data);

  } catch (e) {
    console.log("TEMPLATE ERROR:", e.message);
    res.json({ error: { message: e.message } });
  }
});


/* =========================
   🖼️ IMAGE UPLOAD (OPTIONAL)
========================= */
app.post("/upload-media", upload.single("file"), async (req, res) => {
  try {
    // 👉 future: real Meta upload करू शकतो
    res.json({ id: "MEDIA_ID_DEMO" });

  } catch (e) {
    console.log("UPLOAD ERROR:", e.message);
    res.json({ error: { message: e.message } });
  }
});


/* =========================
   📤 SEND MESSAGE
========================= */
app.post("/send", async (req, res) => {
  const { token, phone_id, payload } = req.body;

  try {
    const r = await fetch(
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

    const data = await r.json();

    // 🔥 FULL DEBUG LOG
    console.log("META RESPONSE:", JSON.stringify(data));

    // 🔥 PROPER RESPONSE STRUCTURE
    if (data.error) {
      return res.json({
        status: "error",
        message: data.error.message,
        full: data
      });
    }

    return res.json({
      status: "success",
      data: data
    });

  } catch (e) {
    console.log("SERVER ERROR:", e.message);

    res.json({
      status: "error",
      message: e.message
    });
  }
});


/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 WhatsApp PRO Server Running on port " + PORT);
});

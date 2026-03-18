const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

/* =========================
   📥 FETCH TEMPLATES (FIXED + DEBUG)
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

    // 🔥 DEBUG LOG
    console.log("TEMPLATE RESPONSE:", JSON.stringify(data));

    if (data.error) {
      return res.json({
        status: "error",
        message: data.error.message,
        full: data
      });
    }

    return res.json({
      status: "success",
      data: data.data || []
    });

  } catch (e) {
    console.log("TEMPLATE ERROR:", e.message);

    res.json({
      status: "error",
      message: e.message
    });
  }
});

/* =========================
   🖼️ IMAGE UPLOAD
========================= */
app.post("/upload-media", upload.single("file"), async (req, res) => {
  try {
    const { token, phone_id } = req.body;

    const form = new FormData();

form.append("file", fs.createReadStream(req.file.path), {
  filename: req.file.originalname,
  contentType: req.file.mimetype
});

form.append("messaging_product", "whatsapp");
     
    const r = await fetch(
      `https://graph.facebook.com/v18.0/${phone_id}/media`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          ...form.getHeaders()
        },
        body: form
      }
    );

    const data = await r.json();

    console.log("MEDIA RESPONSE:", JSON.stringify(data));

    fs.unlinkSync(req.file.path);

    if (data.error) {
      return res.json({
        status: "error",
        message: data.error.message
      });
    }

    res.json({
      status: "success",
      id: data.id
    });

  } catch (e) {
    console.log("UPLOAD ERROR:", e.message);

    res.json({
      status: "error",
      message: e.message
    });
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

    console.log("SEND RESPONSE:", JSON.stringify(data));

    if (data.error) {
      return res.json({
        status: "error",
        message: data.error.message,
        full: data
      });
    }

    res.json({
      status: "success"
    });

  } catch (e) {
    console.log("SEND ERROR:", e.message);

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
  console.log("🔥 Server running on port " + PORT);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

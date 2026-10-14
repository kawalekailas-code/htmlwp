const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const { execFile } = require("child_process");
const { promisify } = require("util");
const runFfmpeg = promisify(execFile);

const app = express();
const upload = multer({ dest: "uploads/", limits: { fileSize: 100 * 1024 * 1024 } });

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
   🖼️ IMAGE / 🎥 VIDEO UPLOAD
========================= */
app.post("/upload-media", upload.single("file"), async (req, res) => {
  let convertedPath = null;
  try {
    if (!req.file) return res.status(400).json({ status: "error", message: "फाइल निवडलेली नाही." });
    const { token, phone_id } = req.body;
    if (!token || !phone_id) return res.status(400).json({ status: "error", message: "Access Token आणि Phone Number ID आवश्यक आहेत." });
    const isVideo = req.file.mimetype.startsWith("video/") || /\.(mp4|mov|m4v|3gp)$/i.test(req.file.originalname);
    if (!isVideo && !req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ status: "error", message: "फक्त image किंवा video निवडा." });
    }

    let uploadPath = req.file.path;
    let uploadName = req.file.originalname;
    let contentType = req.file.mimetype;

    // Re-encode uploaded videos so Cloud API receives a broadly compatible MP4.
    if (isVideo) {
      convertedPath = req.file.path + "-converted.mp4";
      await runFfmpeg(ffmpegPath, [
        "-y", "-i", req.file.path,
        "-vf", "scale='min(720,iw)':-2,fps=30",
        "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.1",
        "-pix_fmt", "yuv420p", "-preset", "veryfast", "-b:v", "1800k",
        "-c:a", "aac", "-b:a", "96k", "-ac", "2", "-ar", "44100",
        "-movflags", "+faststart", convertedPath
      ], { timeout: 120000, maxBuffer: 1024 * 1024 * 5 });
      const convertedSize = fs.statSync(convertedPath).size;
      if (convertedSize > 16 * 1024 * 1024) {
        return res.status(400).json({ status: "error", message: "Convert केल्यानंतर video 16 MB पेक्षा मोठा आहे. कमी duration/quality वापरून पुन्हा export करा." });
      }
      uploadPath = convertedPath;
      uploadName = "converted-video.mp4";
      contentType = "video/mp4";
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(uploadPath), { filename: uploadName, contentType });
    form.append("messaging_product", "whatsapp");

    const r = await fetch(`https://graph.facebook.com/v18.0/${phone_id}/media`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, ...form.getHeaders() },
      body: form
    });
    const data = await r.json();
    console.log("MEDIA RESPONSE:", JSON.stringify(data));
    if (data.error) return res.json({ status: "error", message: data.error.message, full: data });
    res.json({ status: "success", id: data.id });
  } catch (e) {
    console.log("UPLOAD ERROR:", e.message);
    res.json({ status: "error", message: e.message });
  } finally {
    for (const f of [req.file && req.file.path, convertedPath]) {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    }
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

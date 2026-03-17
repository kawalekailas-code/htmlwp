
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

// Fetch templates
app.get("/templates", async (req,res)=>{
  const { token, waba } = req.query;
  try{
    const r = await fetch(`https://graph.facebook.com/v18.0/${waba}/message_templates`,{
      headers:{ Authorization:"Bearer "+token }
    });
    const data = await r.json();
    res.json(data);
  }catch(e){
    res.json({error:e.message});
  }
});

// Upload image → return fake media id (demo safe)
app.post("/upload-media", upload.single("file"), async (req,res)=>{
  res.json({ id:"MEDIA_ID_DEMO" });
});

// Send message
app.post("/send", async (req,res)=>{
  const { token, phone_id, payload } = req.body;
  try{
    const r = await fetch(`https://graph.facebook.com/v18.0/${phone_id}/messages`,{
      method:"POST",
      headers:{
        Authorization:"Bearer "+token,
        "Content-Type":"application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    res.json(data);
  }catch(e){
    res.json({error:{message:e.message}});
  }
});

app.listen(3000, ()=>console.log("PRO server running"));

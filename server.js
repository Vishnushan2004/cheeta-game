require('dotenv').config(); // Reads from .env

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const mongoURI = process.env.MONGO_URI;


const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  coins: { type: Number, default: 0 },
  miningRate: { type: Number, default: 1 },
  referrals: { type: [String], default: [] },
  lastDailyClaim: { type: Date, default: null },
});

const User = mongoose.model("User", userSchema);

app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;
  try {
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId });
      await user.save();
      if (ref && ref !== telegramId) {
        const refUser = await User.findOne({ telegramId: ref });
        if (refUser) {
          refUser.coins += 200;
          refUser.referrals.push(telegramId);
          await refUser.save();
        }
      }
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update", async (req, res) => {
  const { telegramId, coins, lastDailyClaim } = req.body;
  try {
    const updateData = { coins };
    if (lastDailyClaim) updateData.lastDailyClaim = new Date(lastDailyClaim);
    const user = await User.findOneAndUpdate(
      { telegramId },
      updateData,
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

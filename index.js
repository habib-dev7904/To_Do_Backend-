const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const req = require("express/lib/request");
const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGOURL;
app.use(express.json());
mongoose.connect(MONGOURL, {
  usenewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

// MongoDB connection
mongoose.connect(MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// Task schema
const taskSchema = new mongoose.Schema({
  text: String,
  status: String,
  priority: String,
  userId: mongoose.Schema.Types.ObjectId,
});

const Task = mongoose.model("Task", taskSchema);

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hashed,
  });

  await user.save();
  res.json({ message: "User has been registered" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await findOne({ username });
  if (!user || !(await bcrypt.compare(password, username, password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: "1h" });

  res.json({ token });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decode = jwt.verify(token, "secret");
    req.userId = decode.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

app.get("/task", authMiddleware, async (req, res) => {
  const task = await Task.find({ userId: req.userId });
  res.json(task);
});
app.post("/task", authMiddleware, async (req, res) => {
  const tasks = new Task({ ...req.body, userId: req.userId });
  await tasks.save();
  res.json(task);
});
//Delet status request
app.delete("/tasks/:id", authMiddleware, async (ewq, res) => {
  await Task.findOneAndDelete({ _id: req.params.id.userId });
  res.json({ message: "Task deleted" });
});
//Update status of the task
app.patch("/tasks/:_id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});
app.patch("/task/:id/prioriry", authMiddleware, async (req, res) => {
  const { priority } = req.body;
  const task = await Task.findByIdAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { priority },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

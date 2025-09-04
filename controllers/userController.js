const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Presentation = require("../models/Presentation");


// Register
exports.register = async (req, res) => {
    try {
        const { email, password, presentationId } = req.body; // Add presentationId to request body

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            presentations: presentationId ? [presentationId] : [], // Add presentationId if provided
            currentPresentationId: presentationId || null,
        });
        await user.save();

        // Update Presentation with user ID if presentationId is provided
        if (presentationId) {
            await User.findByIdAndUpdate(
                user._id,
                {
                    $addToSet: { presentations: presentationId },
                    $set: { currentPresentationId: presentationId },
                },
                { new: true }
            );
            await Presentation.findOneAndUpdate(
                { presentation_id: presentationId },
                { user: user._id }
            );
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1y" });

        res.json({ token, userId: user._id, presentationId });
    } catch (err) {
        console.error("Register error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password, presentationId } = req.body; // Add presentationId to request body

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

        // If presentationId is provided, add it to user's presentations
        if (presentationId) {
            await User.findByIdAndUpdate(
                user._id,
                {
                    $addToSet: { presentations: presentationId },
                    $set: { currentPresentationId: presentationId },
                },
                { new: true }
            );
            await Presentation.findOneAndUpdate(
                { presentation_id: presentationId },
                { user: user._id }
            );
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1y" });

        res.json({ token, userId: user._id, presentationId });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, password } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (password) updates.password = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select("-password");
        res.json(user);
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.userId);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

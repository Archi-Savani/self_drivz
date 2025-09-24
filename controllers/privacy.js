const PrivacyPolicy = require("../models/privacyPolicy");

exports.createOrUpdate = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "content is required" });

        const doc = await PrivacyPolicy.create({ content, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to save privacy policy", error: error.message });
    }
};

exports.getLatest = async (req, res) => {
    try {
        const doc = await PrivacyPolicy.findOne().sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ success: false, message: "No privacy policy found" });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch privacy policy", error: error.message });
    }
};

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "content is required" });
        const doc = await PrivacyPolicy.findByIdAndUpdate(id, { content }, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: "Privacy policy not found" });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update privacy policy", error: error.message });
    }
};

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await PrivacyPolicy.findByIdAndDelete(id);
        if (!doc) return res.status(404).json({ success: false, message: "Privacy policy not found" });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete privacy policy", error: error.message });
    }
};



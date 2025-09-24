const TermsAndConditions = require("../models/termsAndConditions");

exports.createOrUpdate = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "content is required" });

        const doc = await TermsAndConditions.create({ content, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to save terms & conditions", error: error.message });
    }
};

exports.getLatest = async (req, res) => {
    try {
        const doc = await TermsAndConditions.findOne().sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ success: false, message: "No terms & conditions found" });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch terms & conditions", error: error.message });
    }
};

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "content is required" });
        const doc = await TermsAndConditions.findByIdAndUpdate(id, { content }, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: "Terms & Conditions not found" });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update terms & conditions", error: error.message });
    }
};

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await TermsAndConditions.findByIdAndDelete(id);
        if (!doc) return res.status(404).json({ success: false, message: "Terms & Conditions not found" });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete terms & conditions", error: error.message });
    }
};



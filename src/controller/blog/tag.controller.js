const Tag = require("../../models/Blog/Tag.model");


 const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({ isDeleted: false });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: "Failed to load tags", error });
  }
};


 const createTag = async (req, res) => {
  try {
    const tag = await Tag.create(req.body);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ message: "Failed to create tag", error });
  }
};


 const updateTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    res.json(tag);
  } catch (error) {
    res.status(400).json({ message: "Failed to update tag", error });
  }
};


 const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    res.json({ message: "Tag deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tag", error });
  }
};

module.exports = {getAllTags, createTag,updateTag, deleteTag};

// COMPLETED FUNCTIONS:
// 1. getAllTags - Get all active tags
// 2. createTag - Create new tag
// 3. updateTag - Update tag
// 4. deleteTag - Soft delete tag
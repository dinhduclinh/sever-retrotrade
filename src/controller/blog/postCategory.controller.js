const PostCategory = require("../../models/Blog/PostCategory.model");

const getAllCategories = async (req, res) => {
  try {
    const categories = await PostCategory.find({ isDeleted: false });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to load categories", error });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await PostCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      isDeleted: false,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Tên danh mục đã tồn tại. Vui lòng chọn tên khác." });
    }

    const category = await PostCategory.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: "Lỗi tạo danh mục.", error });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;

    const duplicate = await PostCategory.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, "i") },
      isDeleted: false,
    });
    if (duplicate) {
      return res
        .status(400)
        .json({ message: "Tên danh mục đã tồn tại. Vui lòng chọn tên khác." });
    }

    const category = await PostCategory.findByIdAndUpdate(
      id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );

    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Không cập nhật được danh mục", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await PostCategory.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category", error });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

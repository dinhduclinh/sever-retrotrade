const Category = require("../../models/Product/Categories.model");
const slugify = require("slugify");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, description, parentCategoryId, isActive } = req.body;
    const slug = slugify(name, { lower: true, locale: "vi" });
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ message: "Đường dẫn đã tồn tại" });
    }
    let parentCategory = null;
    if (parentCategoryId) {
      parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        return res.status(404).json({ message: "danh mục lớn không tồn tại" });
      }
      if (!parentCategory.isActive) {
        return res.status(400).json({
          message:
            "Không thể thêm danh mục nhỏ khi danh mục lớn đang không hoạt động",
        });
      }
    }
    const category = new Category({
      name,
      slug,
      description,
      parentCategoryId,
      path: parentCategory ? [...parentCategory.path, slug] : [slug],
      level: parentCategory ? parentCategory.level + 1 : 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategoryId, isActive } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }
    if (name) {
      const newSlug = slugify(name, { lower: true, locale: "vi" });
      const existingCategory = await Category.findOne({
        slug: newSlug,
        _id: { $ne: id },
      });
      if (existingCategory) {
        return res.status(400).json({ message: "Slug đã tồn tại" });
      }
      category.name = name;
      category.slug = newSlug;
    }
    if (description !== undefined) category.description = description;
    if (parentCategoryId !== undefined) {
      if (parentCategoryId) {
        const parentCategory = await Category.findById(parentCategoryId);
        if (!parentCategory) {
          return res
            .status(404)
            .json({ message: "danh mục lớn không tồn tại" });
        }
        if (!parentCategory.isActive) {
          return res.status(400).json({
            message:
              "Không thể thay đổi danh mục lớn khi danh mục lớn đang không hoạt động",
          });
        }
        category.parentCategoryId = parentCategoryId;
        category.path = [...parentCategory.path, category.slug];
        category.level = parentCategory.level + 1;
      } else {
        category.parentCategoryId = null;
        category.path = [category.slug];
        category.level = 0;
      }
    }
    if (isActive !== undefined) {
      if (isActive && category.parentCategoryId) {
        const parentCategory = await Category.findById(
          category.parentCategoryId
        );
        if (!parentCategory || !parentCategory.isActive) {
          return res.status(400).json({
            message:
              "Không thể kích hoạt danh mục nhỏ khi danh mục lớn đang không hoạt động",
          });
        }
      }
      category.isActive = isActive;
    }
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const hardDeleteRecursive = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) return;

  const children = await Category.find({ parentCategoryId: categoryId });
  for (const child of children) {
    await hardDeleteRecursive(child._id);
  }

  await Category.deleteOne({ _id: categoryId });
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    if (category.isActive) {
      const childCategories = await Category.find({
        parentCategoryId: id,
      });
      if (childCategories.length > 0) {
        return res.status(400).json({
          message:
            "Danh mục có danh mục nhỏ. Nếu bạn vô hiệu hóa danh mục lớn, tất cả danh mục nhỏ cũng sẽ bị vô hiệu hóa.",
          requireCascade: true,
        });
      }

      category.isActive = false;
      await category.save();

      return res.status(200).json({
        message: "Danh mục đã được chuyển sang trạng thái không hoạt động.",
        id: category._id,
        isActive: false,
      });
    }

    await hardDeleteRecursive(id);
    return res.status(200).json({
      message: "Đã xóa danh mục vĩnh viễn khỏi hệ thống.",
      id,
    });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: err.message });
  }
};

const cascadeDeactivateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    const deactivateChildren = async (parentId) => {
      const children = await Category.find({ parentCategoryId: parentId });
      for (const child of children) {
        child.isActive = isActive;
        await child.save();
        await deactivateChildren(child._id);
      }
    };

    category.isActive = isActive;
    await category.save();
    await deactivateChildren(category._id);

    res
      .status(200)
      .json({ message: "Đã vô hiệu hóa danh mục và toàn bộ danh mục nhỏ." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  cascadeDeactivateCategory,
};

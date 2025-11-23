const CartItem = require("../../models/Order/CartItem.model");
const Item = require("../../models/Product/Item.model");
const ItemImages = require("../../models/Product/ItemImage.model");
const ItemConditions = require("../../models/Product/ItemConditions.model");
const PriceUnits = require("../../models/Product/PriceUnits.model");
const Categories = require("../../models/Product/Categories.model");


const getCartItems = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    const cartItems = await CartItem.find({ userId })
      .populate({
        path: 'itemId',
        populate: [
          { 
            path: 'CategoryId', 
            model: 'Categories',
            select: '_id name'
          },
          { 
            path: 'OwnerId', 
            model: 'User', 
            select: 'fullName email avatarUrl userGuid' 
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Filter out and delete cartItems with deleted items
    const invalidCartItemIds = [];
    const validCartItems = [];

    for (const cartItem of cartItems) {
      const item = cartItem.itemId;
      
      // Check if item is null, deleted, or not approved
      if (!item || !item._id || item.IsDeleted === true || item.StatusId !== 2) {
        invalidCartItemIds.push(cartItem._id);
        continue;
      }
      
      validCartItems.push(cartItem);
    }

    // Delete invalid cart items from database
    if (invalidCartItemIds.length > 0) {
      await CartItem.deleteMany({ _id: { $in: invalidCartItemIds } });
    }

    // Get additional item details
    const cartItemsWithDetails = await Promise.all(
      validCartItems.map(async (cartItem) => {
        const item = cartItem.itemId;
        
        // Get primary image
        const primaryImage = await ItemImages.findOne({
          ItemId: item._id,
          IsPrimary: true,
          IsDeleted: false
        });

        // Get condition and price unit
        const [condition, priceUnit] = await Promise.all([
          ItemConditions.findOne({ ConditionId: item.ConditionId, IsDeleted: false }),
          PriceUnits.findOne({ UnitId: item.PriceUnitId, IsDeleted: false })
        ]);

        return {
          _id: cartItem._id,
          itemId: cartItem.itemId._id,
          title: item.Title,
          shortDescription: item.ShortDescription,
          basePrice: item.BasePrice,
          depositAmount: item.DepositAmount,
          currency: item.Currency,
          availableQuantity: item.AvailableQuantity,
          category: item.CategoryId ? {
            _id: item.CategoryId._id,
            CategoryName: item.CategoryId.name || 'Chưa phân loại'
          } : {
            _id: null,
            CategoryName: 'Chưa phân loại'
          },
          owner: item.OwnerId,
          condition: condition?.ConditionName || 'Chưa xác định',
          priceUnit: priceUnit?.UnitName || 'Ngày',
          primaryImage: primaryImage?.Url || null,
          rentalStartDate: cartItem.rentalStartDate,
          rentalEndDate: cartItem.rentalEndDate,
          quantity: cartItem.quantity,
          createdAt: cartItem.createdAt,
          updatedAt: cartItem.updatedAt,
          // Thêm thông tin ngày thuê
          rentalPeriod: cartItem.rentalStartDate && cartItem.rentalEndDate ? {
            startDate: cartItem.rentalStartDate,
            endDate: cartItem.rentalEndDate,
            duration: Math.ceil((new Date(cartItem.rentalEndDate) - new Date(cartItem.rentalStartDate)) / (1000 * 60 * 60 * 24)) || 1
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Lấy danh sách giỏ hàng thành công",
      data: cartItemsWithDetails
    });
  } catch (error) {
    console.error("Error getting cart items:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách giỏ hàng",
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { itemId, quantity = 1, rentalStartDate, rentalEndDate } = req.body;

    // Validate required fields
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ID sản phẩm"
      });
    }

    // Check if item exists and is available
    const item = await Item.findOne({ 
      _id: itemId, 
      IsDeleted: false,
      StatusId: 2 // Approved
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc không khả dụng"
      });
    }

    
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải là số nguyên dương"
      });
    }

    if (quantity > 99) {
      return res.status(400).json({
        success: false,
        message: "Số lượng không được vượt quá 99 sản phẩm"
      });
    }

    if (item.OwnerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng"
      });
    }

    
    if (item.AvailableQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng khả dụng không đủ. Chỉ còn ${item.AvailableQuantity} sản phẩm`
      });
    }

    
    const existingCartItem = await CartItem.findOne({ userId, itemId });

    if (existingCartItem) {
      
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (item.AvailableQuantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng khả dụng không đủ. Chỉ còn ${item.AvailableQuantity} sản phẩm`
        });
      }

      existingCartItem.quantity = newQuantity;
      if (rentalStartDate) existingCartItem.rentalStartDate = rentalStartDate;
      if (rentalEndDate) existingCartItem.rentalEndDate = rentalEndDate;
      
      await existingCartItem.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật giỏ hàng thành công",
        data: existingCartItem
      });
    }

    
    const cartItem = await CartItem.create({
      userId,
      itemId,
      quantity,
      rentalStartDate,
      rentalEndDate
    });

    res.status(201).json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: cartItem
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm vào giỏ hàng",
      error: error.message
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { cartItemId } = req.params;
    const { quantity, rentalStartDate, rentalEndDate } = req.body;

    
    const cartItem = await CartItem.findOne({ 
      _id: cartItemId, 
      userId 
    }).populate('itemId');

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng"
      });
    }

    // Check if item is still available
    const item = cartItem.itemId;
    if (item.IsDeleted || item.StatusId !== 2) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm không còn khả dụng"
      });
    }

    // Validate quantity
    if (quantity !== undefined) {
      // Check if quantity is a positive integer
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng phải là số nguyên dương"
        });
      }

      // Check if quantity exceeds available quantity
      if (quantity > item.AvailableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng không được vượt quá ${item.AvailableQuantity} sản phẩm có sẵn`
        });
      }

      // Check if quantity exceeds maximum limit
      if (quantity > 99) {
        return res.status(400).json({
          success: false,
          message: "Số lượng không được vượt quá 99 sản phẩm"
        });
      }
    }

    // Update cart item
    if (quantity !== undefined) cartItem.quantity = quantity;
    if (rentalStartDate !== undefined) cartItem.rentalStartDate = rentalStartDate;
    if (rentalEndDate !== undefined) cartItem.rentalEndDate = rentalEndDate;

    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật giỏ hàng thành công",
      data: cartItem
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật giỏ hàng",
      error: error.message
    });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { cartItemId } = req.params;

    const cartItem = await CartItem.findOneAndDelete({ 
      _id: cartItemId, 
      userId 
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng"
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa khỏi giỏ hàng thành công",
      data: cartItem
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa khỏi giỏ hàng",
      error: error.message
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.user.userId to req.user._id

    const result = await CartItem.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "Xóa toàn bộ giỏ hàng thành công",
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa giỏ hàng",
      error: error.message
    });
  }
};

// Get cart item count
const getCartItemCount = async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.user.userId to req.user._id

    const count = await CartItem.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: "Lấy số lượng giỏ hàng thành công",
      data: { count }
    });
  } catch (error) {
    console.error("Error getting cart count:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy số lượng giỏ hàng",
      error: error.message
    });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount
};


const { Carts } = require("../models/product/cart");

const removePurchasedFromCart = async (userId, purchasedIds) => {
    await Carts.updateOne(
        { user: userId },
        {
            $pull: {
                items: { product: { $in: purchasedIds } }
            }
        }
    );
};

module.exports = removePurchasedFromCart;
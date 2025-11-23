const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const cartItemController = require('../../controller/order/cartItem.controller');

router.get('/', authenticateToken, cartItemController.getCartItems);
router.post('/', authenticateToken, cartItemController.addToCart);
router.put('/:cartItemId', authenticateToken, cartItemController.updateCartItem);
router.delete('/:cartItemId', authenticateToken, cartItemController.removeFromCart);
router.delete('/', authenticateToken, cartItemController.clearCart);
router.get('/count', authenticateToken, cartItemController.getCartItemCount);

module.exports = router;

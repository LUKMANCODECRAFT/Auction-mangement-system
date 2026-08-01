const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  getAllAuctions,
  updateUserRole,
  topupWallet,
  deleteAuction,
  forceSettleAuction
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/auctions', getAllAuctions);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/wallet', topupWallet);
router.delete('/auctions/:id', deleteAuction);
router.post('/auctions/:id/settle', forceSettleAuction);

module.exports = router;

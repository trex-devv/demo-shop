import express from "express";
import verifyDeveloper, { devLogin } from "../middleware/devAuth.js";
import * as devController from "../controllers/devController.js";

const router = express.Router();

router.post("/login", devLogin);
router.use(verifyDeveloper);

// ORDERS MANAGEMENT
router.get("/orders", devController.getAllOrders);
router.delete("/orders/delete-all", devController.deleteAllOrders);
router.delete("/orders/delete-rejected", devController.deleteRejectedOrders);
router.delete("/orders/delete-delivered", devController.deleteDeliveredOrders);
router.delete("/orders/delete-pending", devController.deletePendingOrders);
router.delete("/orders/delete-by-date", devController.deleteOrdersByDate);
router.get("/orders/:id", devController.getOrderById);
router.put("/orders/:id/status", devController.updateOrderStatus);
router.delete("/orders/:id", devController.deleteOrder);

// TICKETS MANAGEMENT
router.get("/tickets", devController.getAllTickets);
router.delete("/tickets/delete-all", devController.deleteAllTickets);
router.delete("/tickets/delete-resolved", devController.deleteResolvedTickets);
router.delete("/tickets/delete-pending", devController.deletePendingTickets);
router.get("/tickets/:id", devController.getTicketById);
router.put("/tickets/:id/status", devController.updateTicketStatus);
router.delete("/tickets/:id", devController.deleteTicket);

// USERS MANAGEMENT
router.get("/users", devController.getAllUsers);
router.delete("/users/delete-all", devController.deleteAllUsers);
router.delete("/users/delete-inactive", devController.deleteInactiveUsers);
router.get("/users/:id", devController.getUserById);
router.put("/users/:id/role", devController.updateUserRole);
router.delete("/users/:id", devController.deleteUser);

router.get("/stats", devController.getStats);
router.delete("/delete-all-data", devController.deleteAllData);

export default router;
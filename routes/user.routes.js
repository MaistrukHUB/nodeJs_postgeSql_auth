const Router = require("express");
const router = new Router();
const userController = require("../controllers/user.controller");

router.post("/user/register", userController.registerUser);
router.post("/user/login", userController.loginUser);
router.get("/user/all_users", userController.getUsers);
router.get("/user/:id", userController.getOneUser);
router.put("/user/:id", userController.updateUser);
router.delete("/user/:id", userController.deleteUser);

module.exports = router;

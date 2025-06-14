const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const invValidate = require("../utilities/inventory-validation");

// Route to build inventory by classification view
router.get(
  "/type/:classificationId",
  invController.buildByClassificationId
);

router.get(
  "/detail/:vehicleId",
  invController.buildByInventoryId
);

router.get("/", invController.buildInventoryManagement);
router.get(
  "/add-classification",
  invController.buildAddClassification
);
router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  invController.addClassification
);
router.get("/add-vehicle", invController.buildAddVehicle);
router.post(
  "/add-vehicle",
  invValidate.inventoryRules(),
  invValidate.checkInvData,
  invController.addVehicle
);

module.exports = router;

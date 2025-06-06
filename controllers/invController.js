const invModel = require("../models/inventory-model");
const utilities = require("../utilities/");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (
  req,
  res,
  next
) {
  const classification_id = req.params.classificationId;
  const data =
    await invModel.getInventoryByClassificationId(
      classification_id
    );
  const grid = await utilities.buildClassificationGrid(
    data
  );
  let nav = await utilities.getNav();
  const className = data[0].classification_name;
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
    errors: null,
  });
};

/* ***************************
 *  Build inventory by vehicle view
 * ************************** */
invCont.buildByInventoryId = async function (
  req,
  res,
  next
) {
  const inv_id = req.params.vehicleId;
  const data = await invModel.getInventoryByInventoryId(
    inv_id
  );
  const details = await utilities.buildInventoryDetails(
    data[0]
  );
  let nav = await utilities.getNav();

  const className = `${data[0].inv_year} ${data[0].inv_make} ${data[0].inv_model}`;
  res.render("./inventory/details", {
    title: className,
    nav,
    details,
    errors: null,
  });
};

module.exports = invCont;

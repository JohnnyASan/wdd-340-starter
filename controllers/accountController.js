const utilities = require("../utilities/");
const accountModel = require("../models/account-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
  });
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  });
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body;

  // Hash the password before storing
  let hashedPassword;
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(
      account_password,
      10
    );
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the registration."
    );
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    });
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  );

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    );
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null,
    });
  } else {
    req.flash("notice", "Sorry, the registration failed.");
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    });
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;
  const accountData = await accountModel.getAccountByEmail(
    account_email
  );
  if (!accountData) {
    req.flash(
      "notice",
      "Please check your credentials and try again."
    );
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    });
    return;
  }
  try {
    if (
      await bcrypt.compare(
        account_password,
        accountData.account_password
      )
    ) {
      delete accountData.account_password;
      const accessToken = jwt.sign(
        accountData,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: 3600 * 1000 }
      );
      if (process.env.NODE_ENV === "development") {
        res.cookie("jwt", accessToken, {
          httpOnly: true,
          maxAge: 3600 * 1000,
        });
      } else {
        res.cookie("jwt", accessToken, {
          httpOnly: true,
          secure: true,
          maxAge: 3600 * 1000,
        });
      }
      return res.redirect("/account/");
    } else {
      req.flash(
        "message notice",
        "Please check your credentials and try again."
      );
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }
  } catch (error) {
    throw new Error("Access Forbidden");
  }
}

/* ****************************************
 *  Deliver authenticated view
 * *************************************** */
async function buildManagement(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/management", {
    title: "Account",
    nav,
    errors: null,
  });
}

/* ****************************************
 *  Process logout request
 * *************************************** */
async function accountLogout(req, res) {
  res.clearCookie("jwt");
  res.locals.accountData = null;
  res.locals.loggedin = 0;
  req.flash("notice", "You have been logged out.");
  return res.redirect("/");
}

/* ****************************************
 *  Deliver update account view
 * *************************************** */
async function buildUpdate(req, res, next) {
  const id = parseInt(req.params.account_id);
  const userData = await accountModel.getAccountById(id);
  if (!userData) {
    req.flash(
      "notice",
      "Sorry, that account does not exist."
    );
    return res.redirect("/account/");
  }
  let nav = await utilities.getNav();
  res.render("account/update", {
    title: "Update Account",
    nav,
    account_firstname: userData.account_firstname,
    account_lastname: userData.account_lastname,
    account_email: userData.account_email,
    account_id: 1,
    errors: null,
  });
}
/* ****************************************
 *  Process update account request
 * *************************************** */
async function updateAccount(req, res) {
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_id,
  } = req.body;
  const updateResult = await accountModel.updateAccount(
    account_id,
    account_firstname,
    account_lastname,
    account_email
  );
  const nav = await utilities.getNav();
  if (updateResult) {
    req.flash("notice", "Your account has been updated.");
    return res.status(200).render("account/management", {
      title: "Account",
      nav: nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  } else {
    req.flash(
      "notice",
      "Sorry, your account could not be updated."
    );
    return res.status(501).render("account/update", {
      title: "Update Account",
      nav: nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }
}

/* ****************************************
 *  Process update password request
 * *************************************** */
async function updateAccountPassword(req, res) {
  const { new_account_password } = req.body;
  const account_id = parseInt(req.body.account_id);
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hashSync(
      new_account_password,
      10
    );
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the password update."
    );
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav: await utilities.getNav(),
      errors: null,
      account_id,
    });
  }
  const updateResult =
    await accountModel.updateAccountPassword(
      account_id,
      hashedPassword
    );
  if (updateResult) {
    req.flash("notice", "Your password has been updated.");
    return res.status(200).render("account/management", {
      title: "Account",
      nav: await utilities.getNav(),
      errors: null,
      account_id,
    });
  } else {
    req.flash(
      "notice",
      "Sorry, your password could not be updated."
    );
    return res.status(501).render("account/update", {
      title: "Update Account",
      nav: await utilities.getNav(),
      errors: null,
      account_id,
    });
  }
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  buildManagement,
  accountLogin,
  accountLogout,
  buildUpdate,
  updateAccount,
  updateAccountPassword,
};

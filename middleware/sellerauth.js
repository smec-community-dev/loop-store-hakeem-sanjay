module.exports = (req, res, next) => {
  if (!req.session.seller) {
    return res.redirect("/seller/login");
  }
  next();
};
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");
const path = require("path");

module.exports = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    key: (req, file, cb) => {
      cb(null, `uploads/products/${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
});

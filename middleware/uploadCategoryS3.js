const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

module.exports = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    key: (req, file, cb) => {
      cb(null, `uploads/category/${Date.now()}-${file.originalname}`);
    },
  }),
});

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errs = errors.array();
    console.warn('[validate] 유효성 검사 실패:', JSON.stringify(errs));
    return res.status(400).json({
      success: false,
      message: errs[0].msg,
      errors: errs,
    });
  }
  next();
};

module.exports = validate;

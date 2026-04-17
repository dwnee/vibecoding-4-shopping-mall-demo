const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '이름을 입력해주세요.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '이메일을 입력해주세요.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호를 입력해주세요.'],
      minlength: 6,
      select: false,
    },
    user_type: {
      type: String,
      enum: ['customer', 'admin'],
      required: [true, '유저 타입을 입력해주세요.'],
      default: 'customer',
    },
    address: {
      street: String,
      city: String,
      zipCode: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

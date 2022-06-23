import { StatusCodes } from "http-status-codes";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors/index.js";

const register = async (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    throw new BadRequestError("Please Provide All Values");
  }

  const isUserExists = await User.findOne({ email: email });

  if (isUserExists) {
    throw new BadRequestError("User with this Email Already Exists");
  }

  //hashing password
  const hashPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    fullName,
    email,
    password: hashPassword,
  });

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      userEmail: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );

  res.status(StatusCodes.CREATED).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    token,
  });
};

const login = async (req, res) => {
  const { username, email, password } = req.body;

  if ((!username && !email) || !password) {
    throw new BadRequestError("Please Provide All the Values");
  }

  const isUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (!isUser) {
    throw new NotFoundError("Invalid Credentials");
  }

  //compare password
  const comparePassword = await bcrypt.compare(password, isUser.password);

  if (!comparePassword) {
    throw new BadRequestError(
      "Please Make Sure You have entered Correct Password!"
    );
  }

  const token = jwt.sign(
    {
      userId: isUser._id,
      username: isUser.username,
      userEmail: isUser.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );

  res.status(StatusCodes.OK).json({
    _id: isUser._id,
    username: isUser.username,
    email: isUser.email,
    fullName: isUser.fullName,
    avatar: isUser.avatar,
    token,
  });
};

export { register, login };

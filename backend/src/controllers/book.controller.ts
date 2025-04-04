import mongoose, { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import Book from "../models/book.model";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/index";
import {
  ID_BADREQUEST_MSG,
  FORBIDDEN_ERROR_MSG,
  UNAUTHENTICATED_ERROR_MSG,
  NOTFOUND_ERROR_MSG,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

// CRUD
// Get default books
export const getDefaultBooks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log(" Get DefaultBooks");
  try {
    console.log("Running Get DefaultBooks");
    const books = await Book.find({ owner: null });
    console.log("Books: ", books);
    const formatted = books.map((book) => ({
      ...book.toObject(),
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.log("Error getting default books:  " + error);
    next(error);
  }
};

// Get User's books specific to their profile
export const getUserProfileBooks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }
  try {
    const owner = new Types.ObjectId(req.user.userId);

    const books = await Book.find({ owner });
    const formatted = books.map((book) => ({
      ...book.toObject(),
      //_id: uuidv4(), // guarantees string
    }));
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// Create Book
export const createBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }

  try {
    const { title, author, year, imageLink, link } = req.body;
    const book = await Book.create({
      _id: uuidv4(), // Manually assigning as string
      title,
      author,
      year,
      imageLink,
      link,
      owner: new Types.ObjectId(req.user.userId),
    });

    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }
  const updateData = { ...req.body };
  delete updateData.owner;
  const owner = req.user.userId;

  console.log("Looking for book with id:", req.params.id, "and owner:", owner);
  try {
    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.id,
        owner,
      },
      updateData,
      { new: true }
    );
    if (!book) {
      throw new NotFoundError(NOTFOUND_ERROR_MSG);
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }

  const owner = new Types.ObjectId(req.user.userId);

  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      owner,
    });

    if (!book) {
      throw new NotFoundError(NOTFOUND_ERROR_MSG);
    }
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Add book to user's collection
export const addToCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }

  const { _id, title, author, year, imageLink, link } = req.body;
  const owner = new Types.ObjectId(req.user.userId);

  if (!_id) {
    throw new BadRequestError(ID_BADREQUEST_MSG);
  }

  try {
    const book = await Book.findOneAndUpdate(
      { _id, owner },
      { _id, title, author, year, imageLink, link },
      { upsert: true, new: true }
    );
    res.status(200).json(book);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(new BadRequestError(ID_BADREQUEST_MSG));
    } else {
      next(error);
    }
  }
};

// Remove book from collection
export const removeFromCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError(UNAUTHENTICATED_ERROR_MSG);
  }

  const { _id } = req.body;
  const owner = new Types.ObjectId(req.user.userId);

  if (!_id) {
    throw new BadRequestError(ID_BADREQUEST_MSG);
  }

  try {
    const book = await Book.findOne({ _id, owner });
    if (!book) {
      throw new ForbiddenError(FORBIDDEN_ERROR_MSG);
    }

    await Book.findOneAndDelete({ _id, owner });
    res
      .status(200)
      .json({ message: "Book removed from collection successfully" });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(new BadRequestError(ID_BADREQUEST_MSG));
    } else {
      next(error);
    }
  }
};

// Route to view list of all books in user's collection
export const getBookCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const owner = new Types.ObjectId(req.user.userId); // ensures proper match
    const books = await Book.find({ owner });

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

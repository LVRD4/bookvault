import { BASE_URL, request } from "./index";
import { BookInput } from "../contexts/AuthContext";

const BOOK_BASE_URL = `${BASE_URL}/books`;

export interface BookResponse extends BookInput {
  _id: string;
}

export function getDefaultBooks(): Promise<BookResponse[]> {
  return request(`${BOOK_BASE_URL}/`, {
    headers: {
      Accept: "application/json",

      "Content-Type": "application/json",
    },
  });
}

export function getUserProfileBooks(token: string): Promise<BookResponse[]> {
  return request(`${BOOK_BASE_URL}/user-books`, {
    headers: {
      Accept: "application/json",
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// Create book
export function createBookAPI(
  book: BookInput,
  token: string
): Promise<BookResponse> {
  return request(`${BOOK_BASE_URL}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });
}

// Update book
export function updateBookAPI(
  _id: string,
  updatedBook: Partial<BookInput>,
  token: string
): Promise<BookResponse> {
  return request(`${BOOK_BASE_URL}/${_id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedBook),
  });
}

// Delete book
export function deleteBookAPI(
  _id: string,
  token: string
): Promise<BookResponse> {
  return request(`${BOOK_BASE_URL}/${_id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// Add to collection
export function addToCollectionAPI(
  book: BookInput,
  token: string
): Promise<BookResponse> {
  return request(`${BOOK_BASE_URL}/collection`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });
}

// Remove from collection
export function removeFromCollectionAPI(
  _id: string,
  token: string
): Promise<BookResponse[]> {
  return request(`${BOOK_BASE_URL}/collection`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _id }),
  });
}

export function getAddedCollection(token: string): Promise<BookResponse[]> {
  return request(`${BOOK_BASE_URL}/collection`, {
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

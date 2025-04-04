import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { login, register, getUserProfile } from "../utils";
import {
  createBookAPI,
  updateBookAPI,
  deleteBookAPI,
  addToCollectionAPI,
  removeFromCollectionAPI,
  getUserProfileBooks,
  getDefaultBooks,
} from "../utils";
import { getToken, setToken, removeToken } from "../utils";

// Types
export interface User {
  email: string;
  password?: string;
  name: string;
  id: string;
}

export interface Book {
  _id: string;
  title: string;
  author?: string;
  year: number;
  imageLink: string;
  language?: string;
  pages?: number;
  link?: string;
  owner?: string;
}

export interface UserWithCollection extends User {
  bookCollection: Book[];
}

export interface BookInput {
  _id?: string;
  title: string;
  author?: string;
  year: number;
  imageLink: string;
  language?: string;
  pages?: number;
  link?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  books: Book[];
  isLoading: boolean;
  activeModal: string;
  openModal: (modal: string) => void;
  closeModal: () => void;
  handleLogin: (
    userData: Pick<User, "email"> & { password: string }
  ) => Promise<UserWithCollection | void>;
  handleRegister: (
    userData: Pick<User, "email" | "name"> & { password: string }
  ) => Promise<UserWithCollection | void>;
  logout: () => void;
  createBook: (bookData: BookInput) => Promise<Book>;
  editBook: (id: string, updates: Partial<BookInput>) => Promise<Book>;
  deleteBook: (id: string) => Promise<void>;
  addToCollection: (book: Book) => void;
  removeFromCollection: (id: string) => void;
  selectedBookId: Book["_id"] | null; // Currently selected book's id
  setSelectedBookId: (id: Book["_id"] | null) => void;
  isLoggedIn: boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [bookCollection, setBookCollection] = useState<Book[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<Book["_id"] | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const openModal = (modal: string) => {
    setActiveModal(modal);
  };
  const closeModal = () => setActiveModal("");

  useEffect(() => {
    const token = getToken();
    console.log(token);
    setIsLoading(true);

    if (token) {
      Promise.all([getUserProfile(token), getUserProfileBooks(token)])
        .then(([user, userBooks]) => {
          console.log("🟩 Fetched user books:", userBooks); // <-- ADD THIS
          setCurrentUser(user);
          setBookCollection(userBooks);
          setIsLoggedIn(true);
        })
        .catch((err) => {
          console.error("Auth check failed", err);
          removeToken();
          setCurrentUser(null);

          getDefaultBooks().then((defaultBooks) => {
            console.log("🟨 Fallback to default books:", defaultBooks); // <-- ADD THIS
            setBookCollection(defaultBooks);
          });
        })
        .finally(() => setIsLoading(false));
    } else {
      getDefaultBooks()
        .then((defaultBooks) => {
          console.log("🟦 No token - loading default books:", defaultBooks); // <-- ADD THIS
          setBookCollection(defaultBooks);
        })
        .catch((err) => {
          console.error("Failed to load default books", err);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const handleLogin = async (
    userData: Pick<User, "email"> & { password: string }
  ): Promise<UserWithCollection | void> => {
    setIsLoading(true);

    const { email, password } = userData;

    if (!email || !password) {
      console.log("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const res = await login(userData); // login() should accept { email, password }

      setToken(res.token);
      setCurrentUser(res.user);
      setIsLoggedIn(true);

      const userBooks = await getUserProfileBooks(res.token);
      setBookCollection(userBooks as Book[]);

      return {
        ...res.user,
        bookCollection: userBooks,
      };
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    userData: Pick<User, "email" | "name"> & { password: string }
  ) => {
    const { email, password, name } = userData;
    console.log(userData);

    if (!email || !password || !name) {
      console.log("Email, password, and username required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await register(userData);

      return res.user;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
    setCurrentUser(null);
    closeModal();
  };

  const createBook = async (bookData: BookInput): Promise<Book> => {
    const token = getToken();

    if (!token) {
      throw new Error(
        "No token found. User must be logged in to create a book."
      );
    }

    const newBook = await createBookAPI(bookData, token);
    setBookCollection((prev) => [...prev, newBook]);
    return newBook;
  };

  const editBook = async (
    id: string,
    updates: Partial<BookInput>
  ): Promise<Book> => {
    const token = getToken();
    if (!token) throw new Error("No token found.");

    const updated = await updateBookAPI(id, updates, token);
    setBookCollection((prev) =>
      prev.map((book) => (book._id === id ? updated : book))
    );
    return updated;
  };

  const deleteBook = async (id: string): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error("No auth token found.");

    try {
      await deleteBookAPI(id, token); // your API util
      setBookCollection((prev) => prev.filter((book) => book._id !== id));
    } catch (error) {
      console.error("Failed to delete book:", error);
      throw error;
    }
  };

  const addToCollection = async (book: Book): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error("No auth token found.");

    try {
      const addedBook = await addToCollectionAPI(book, token); // your API util
      setBookCollection((prev) => [...prev, addedBook]);
    } catch (error) {
      console.error("Failed to add book to collection:", error);
      throw error;
    }
  };

  const removeFromCollection = async (id: string): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error("No auth token found.");

    try {
      await removeFromCollectionAPI(id, token); // your API util
      setBookCollection((prev) => prev.filter((book) => book._id !== id));
    } catch (error) {
      console.error("Failed to remove book from collection:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        books: bookCollection,
        activeModal,
        closeModal,
        openModal,
        handleLogin,
        handleRegister,
        logout,
        createBook,
        editBook,
        deleteBook,
        addToCollection,
        removeFromCollection,
        selectedBookId,
        setSelectedBookId,
        isLoggedIn,
      }}
    >
      {" "}
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

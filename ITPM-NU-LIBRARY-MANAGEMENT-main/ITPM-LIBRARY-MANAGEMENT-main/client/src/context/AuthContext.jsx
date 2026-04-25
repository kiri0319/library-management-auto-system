import { createContext, useEffect, useState } from "react";
import { libraryApi } from "../api/libraryApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("library_token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("library_token")));

  const persistAuth = (payload) => {
    localStorage.setItem("library_token", payload.token);
    setToken(payload.token);
    setUser({
      _id: payload._id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      studentId: payload.studentId,
      phone: payload.phone,
      address: payload.address,
      avatar: payload.avatar,
      membershipCode: payload.membershipCode,
    });
  };

  const login = async (payload) => {
    const { data } = await libraryApi.auth.login(payload);
    persistAuth(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await libraryApi.auth.register(payload);
    // Do not persist auth here, as registration now sends OTP
    return data;
  };

  const verifyOtp = async (payload) => {
    const { data } = await libraryApi.auth.verifyOtp(payload);
    persistAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("library_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await libraryApi.auth.me();
    setUser(data);
    return data;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser()
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


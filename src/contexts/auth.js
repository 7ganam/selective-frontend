import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import Router, { useRouter } from "next/router";

//api here is an axios instance which has the baseURL set according to the env.
import api from "../utils/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState(null);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const router = useRouter();

  useEffect(() => {
    async function loadUserFromCookies() {
      const jwt = Cookies.get("jwt");
      if (jwt) {
        console.log("Got a jwt in the cookies, let's see if it is valid");
        api.defaults.headers.Authorization = `Bearer ${jwt}`;
        const result = await api.get("users/me");
        const user = result.data;
        if (user) setUser(user);
        console.log("current user is :>> ", user);
      }
      //   setLoading(false);
    }
    loadUserFromCookies();
  }, []);

  const signUp = async (userName, email, password) => {
    try {
      setSignupError(null);
      setSignupLoading(true);
      const results = await api.post("auth/local/register", {
        username: userName,
        email,
        password,
      });
      console.log("results :>> ", results);
      router.push("/confirm-email");
      console.log("user :>> ", user);
      setSignupLoading(false);
    } catch (error) {
      console.log("signup error > ", error?.response?.data?.error?.message);
      setSignupLoading(false);
      setSignupError(
        error?.response?.data?.error?.message ?? "Something went wrong"
      );
    }
  };

  const login = async (email, password) => {
    try {
      setLoginError(null);
      setLoginLoading(true);
      const results = await api.post("auth/local", {
        identifier: email,
        password,
      });
      console.log("results :>> ", results);
      let jwt = results.data.jwt;
      let user = results.data.user;
      if (jwt) {
        console.log("Got jwt");
        Cookies.set("jwt", jwt, { expires: 60 });
        api.defaults.headers.Authorization = `Bearer ${jwt}`;
        setUser(user);
        console.log("Got user", user);
      }
    } catch (error) {
      console.log("Login error > ", error?.response?.data?.error?.message);
      setLoginLoading(false);
      setLoginError(
        error?.response?.data?.error?.message ?? "Something went wrong"
      );
    }
  };

  const logout = (email, password) => {
    Cookies.remove("jwt");
    setUser(null);
    delete api.defaults.headers.Authorization;
    // window.location.pathname = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        signUp,
        signupError,
        signupLoading,
        login,
        loginLoading,
        loginError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import siteConfig from "../../config/site.config";
import logo from "/logo.png";
import loginImage from "../../assets/login.jpg";
import signupImage from "../../assets/signup.jpg";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setToken, backendUrl } = useContext(ShopContext);
  
  // Check if user is already logged in - using useEffect instead of render
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem('token', token);
        setToken(token);
        toast.success("Login successful!");
        return true;
      } else {
        toast.error(response.data.message || "Login failed");
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  const handleRegister = async (name, email, password, phone) => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/register`, {
        name,
        email,
        password,
        phone
      });
      
      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem('token', token);
        setToken(token);
        toast.success("Registration successful!");
        return true;
      } else {
        toast.error(response.data.message || "Registration failed");
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (isLogin) {
      success = await handleLogin(email, password);
    } else {
      success = await handleRegister(name, email, password, phone);
    }

    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <img 
          src={isLogin ? loginImage : signupImage} 
          alt={isLogin ? "Login" : "Signup"} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            {logo ? (
              <img 
                src={logo} 
                alt={siteConfig.siteName} 
                className="h-20 w-auto mx-auto mb-4"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {siteConfig.siteName}
              </h1>
            )}
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-md text-gray-500 mt-1.5">
              {isLogin ? "Login in to continue" : `Sign Up to ${siteConfig.siteName}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base bg-white text-gray-900 placeholder:text-gray-400"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base bg-white text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base bg-white text-gray-900 placeholder:text-gray-400"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base bg-white text-gray-900 placeholder:text-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-5">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-gray-900 font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            {!isLogin && (
              <p className="text-xs text-gray-500">
                By continuning, you agree to our{" "}
                <Link to="/terms&privacy" className="text-gray-900 underline hover:text-black">
                  Terms and Privacy Policy
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
import { Button, TextField, Card, Typography } from "@mui/material";
import { FaLinkedin, FaGoogle } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="p-8 w-96 rounded-xl shadow-lg bg-white">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo & Title */}
          <Typography variant="h4" className="text-blue-500 font-bold">
            Bizradar
          </Typography>
          <Typography variant="h6" className="text-gray-700">
            Log in to Bizradar
          </Typography>

          {/* Social Login Buttons */}
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors duration-300 w-full">
            <Button
              variant="outlined"
              fullWidth
              className="flex items-center justify-center border-gray-300 py-2"
              startIcon={<FaLinkedin className="text-blue-600" />}
            >
              Sign in with LinkedIn
            </Button>
          </a>
          <a href="https://Google.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors duration-300 w-full">
          <Button
            variant="outlined"
            fullWidth
            className="flex items-center justify-center border-gray-300 py-2"
            startIcon={<FaGoogle className="text-red-600" />}
          >
            Sign in with Google
          </Button>
          </a>

          {/* Divider */}
          <div className="w-full text-center text-gray-400">OR</div>

          {/* Email Field */}
          <TextField label="Email" variant="outlined" fullWidth required />

          {/* Password Field + Forgot Password */}
          <div className="relative w-full">
            <TextField label="Password" type="password" variant="outlined" fullWidth required />
            <div className="absolute right-3 top-3 text-blue-500 text-sm cursor-pointer">
              Forgot password?
            </div>
          </div>

          {/* Login Button */}
          <Button variant="contained" fullWidth className="bg-blue-500 text-white py-3">
            Log in with email
          </Button>

          {/* Signup Redirect */}
          <Typography className="text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-500 font-semibold">
              Sign up
            </Link>
          </Typography>
        </div>
      </Card>
    </div>
  );
}

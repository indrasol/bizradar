import React, { useState, useEffect } from "react";
import { Lock, Key, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../Auth/useAuth";
import { supabase } from "../../utils/supabase";

const PasswordManagement: React.FC<{}> = () => {
  const { updatePassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastPasswordChange, setLastPasswordChange] = useState("1 Month ago");
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [strengthScore, setStrengthScore] = useState(0);

  // Fetch user's password information
  useEffect(() => {
    const fetchPasswordInfo = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) return;

        // Get user's metadata which includes last_sign_in_at and updated_at
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) return;

        // Use updated_at from auth.users as it indicates when the password was last changed
        const lastChange = session.user.updated_at;
        if (lastChange) {
          const changeDate = new Date(lastChange);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - changeDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            setLastPasswordChange("Today");
          } else if (diffDays === 1) {
            setLastPasswordChange("Yesterday");
          } else if (diffDays < 7) {
            setLastPasswordChange(`${diffDays} days ago`);
          } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            setLastPasswordChange(`${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`);
          } else {
            const months = Math.floor(diffDays / 30);
            setLastPasswordChange(`${months} ${months === 1 ? 'month' : 'months'} ago`);
          }
        }
      } catch (error) {
        console.error('Error fetching password info:', error);
      }
    };

    fetchPasswordInfo();
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
      noSpaces: !/\s/.test(password),
      noCommonPatterns: !/(password|123456|qwerty)/i.test(password),
    };

    // Length scoring
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;

    // Character type scoring
    if (checks.uppercase) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.special) score += 1;
    if (checks.noSpaces) score += 1;
    if (checks.noCommonPatterns) score += 1;

    // Additional complexity scoring
    if (password.length >= 12 &&
      checks.uppercase &&
      checks.lowercase &&
      checks.numbers &&
      checks.special) {
      score += 1;
    }

    setStrengthScore(score);

    // Determine strength level
    if (score >= 7) return "Strong";
    if (score >= 4) return "Medium";
    return "Weak";
  };

  // Update password strength when new password changes
  useEffect(() => {
    if (newPassword) {
      const strength = calculatePasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength("Weak");
      setStrengthScore(0);
    }
  }, [newPassword]);

  const validatePasswords = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) newErrors.currentPassword = "Current password is required.";
    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else {
      if (newPassword.length < 8)
        newErrors.newPassword = "Must be at least 8 characters.";
      if (!/[A-Z]/.test(newPassword))
        newErrors.newPassword = "Must contain at least one uppercase letter.";
      if (!/[0-9]/.test(newPassword))
        newErrors.newPassword = "Must contain at least one number.";
      if (!/[!@#$%^&*]/.test(newPassword))
        newErrors.newPassword = "Must include a special character.";
    }
    if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (validatePasswords()) {
      try {
        await updatePassword(newPassword, currentPassword);
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        setLastPasswordChange("Just now");
      } catch (error: any) {
        toast.error(error.message || "Failed to update Password");
      }
    } else {
      toast.error("Please fix the errors before submitting.");
    }
  };

  // Get strength color based on score
  const getStrengthColor = () => {
    if (strengthScore >= 7) return "bg-green-100 text-green-600";
    if (strengthScore >= 4) return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Lock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Password Management</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-800">Change Password</h4>
              <p className="text-sm text-gray-500">
                Last changed: {lastPasswordChange}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="current_password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border ${errors.currentPassword ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>}
            </div>

            {/* Password Requirements */}
            <div className="border-t border-gray-100 pt-2">
              <h4 className="font-medium text-gray-800 mb-4">Password Requirements</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  {
                    (newPassword.length < 8) ? <CheckCircle className="h-4 w-4" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                  }
                  <span>At least 8 characters</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  {
                    (!/[A-Z]/.test(newPassword)) ? <CheckCircle className="h-4 w-4" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                  }
                  <span>At least one uppercase letter</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  {
                    (!/[0-9]/.test(newPassword)) ? <CheckCircle className="h-4 w-4" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                  }
                  <span>At least one number</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  {
                    (!/[!@#$%^&*]/.test(newPassword)) ? <CheckCircle className="h-4 w-4" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                  }
                  <span>At least one special character</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`px-3 py-1 rounded-full ${getStrengthColor()} text-sm font-medium`}>
                    {passwordStrength}</span>
                </li>
              </ul>

            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border ${errors.newPassword ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
              onClick={handlePasswordChange}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordManagement;
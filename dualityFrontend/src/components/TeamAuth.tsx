import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Users as UsersIcon } from 'lucide-react';
import { teamRegister, teamLogin } from '../services/auth.service';

interface Member {
  name: string;
  email: string;
}

export function TeamAuth({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true); // Default to login for teams
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [teamName, setTeamName] = useState('');
  const [memberCount, setMemberCount] = useState(2);
  const [members, setMembers] = useState<Member[]>([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);
  const [loginData, setLoginData] = useState({
    teamName: '',
    password: '',
  });
  const [password, setPassword] = useState('');

  const getApiErrorMessage = (err: any) => {
    const serverMessage = err?.response?.data?.message;
    const validationErrors = err?.response?.data?.errors;

    if (serverMessage) return serverMessage;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      return validationErrors
        .map((e: { message?: string }) => e?.message)
        .filter(Boolean)
        .join(' | ');
    }

    return 'An error occurred. Please try again.';
  };

  const handleMemberCountChange = (count: number) => {
    setMemberCount(count);
    const newMembers = Array.from({ length: count }, (_, i) =>
      members[i] || { name: '', email: '' }
    );
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: 'name' | 'email', value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const trimmedTeamName = teamName.trim();
    const trimmedPassword = password.trim();
    const normalizedMembers = members.map((member) => ({
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
    }));

    if (!trimmedTeamName) {
      setError('Team name is required.');
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (normalizedMembers.length < 2 || normalizedMembers.length > 3) {
      setError('Team must have 2 to 3 members.');
      setLoading(false);
      return;
    }

    const hasEmptyMemberFields = normalizedMembers.some((member) => !member.name || !member.email);
    if (hasEmptyMemberFields) {
      setError('Each member must have a name and email.');
      setLoading(false);
      return;
    }

    const uniqueEmailCount = new Set(normalizedMembers.map((member) => member.email)).size;
    if (uniqueEmailCount !== normalizedMembers.length) {
      setError('Member emails must be unique.');
      setLoading(false);
      return;
    }

    try {
      const response = await teamRegister({
        teamName: trimmedTeamName,
        password: trimmedPassword,
        members: normalizedMembers,
      });
      setSuccessMessage(response.message || 'Team registered successfully! Please wait for admin approval.');
      // Clear form
      setTeamName('');
      setPassword('');
      setMembers([{ name: '', email: '' }, { name: '', email: '' }]);
      setMemberCount(2);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await teamLogin({
        teamName: loginData.teamName,
        password: loginData.password,
      });
      onLogin();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  if (isLogin) {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Team Login
          </h1>
          <p className="text-gray-400">
            Sign in with your team credentials
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Team Name Field */}
            <div>
              <label htmlFor="login-team-name" className="block text-sm text-gray-300 mb-2">
                Team Name
              </label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="login-team-name"
                  name="teamName"
                  value={loginData.teamName}
                  onChange={handleLoginChange}
                  className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Enter your team name"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : 'Sign In as Team'}
            </button>
          </form>

          {/* Toggle to Signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have a team account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-white hover:underline font-medium"
              >
                Register your team
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Team Registration
        </h1>
        <p className="text-gray-400">
          Register your team for the competition
        </p>
      </div>

      {/* Signup Form Container */}
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <form onSubmit={handleSignupSubmit} className="space-y-5">
          {/* Team Name Field */}
          <div>
            <label htmlFor="team-name" className="block text-sm text-gray-300 mb-2">
              Team Name
            </label>
            <div className="relative">
              <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="Enter your team name"
                required
              />
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 text-green-500 text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Member Count Dropdown */}
          <div>
            <label htmlFor="member-count" className="block text-sm text-gray-300 mb-2">
              Number of Members
            </label>
            <select
              id="member-count"
              value={memberCount}
              onChange={(e) => handleMemberCountChange(Number(e.target.value))}
              className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {[2, 3].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Member' : 'Members'}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Member Fields */}
          <div className="space-y-6 pt-4">
            <div className="border-t border-zinc-800 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Team Members</h3>
            </div>

            {members.map((member, index) => (
              <div key={index} className="space-y-4 p-4 bg-black rounded-lg border border-zinc-800">
                <div className="text-sm font-medium text-gray-400 mb-3">
                  Member {index + 1}
                </div>

                {/* Member Name */}
                <div>
                  <label htmlFor={`member-${index}-name`} className="block text-sm text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id={`member-${index}-name`}
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    placeholder="Enter member name"
                    required
                  />
                </div>

                {/* Member Email */}
                <div>
                  <label htmlFor={`member-${index}-email`} className="block text-sm text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id={`member-${index}-email`}
                    value={member.email}
                    onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    placeholder="Enter member email"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Team Password */}
          <div className="pt-4">
            <label htmlFor="team-password" className="block text-sm text-gray-300 mb-2">
              Team Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="team-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="Create a password for your team"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register Team'}
          </button>
        </form>

        {/* Toggle to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already registered?{' '}
            <button
              onClick={() => setIsLogin(true)}
              className="text-white hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
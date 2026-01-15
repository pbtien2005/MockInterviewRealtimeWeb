import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { config } from "../config";
export default function CoachList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coachers, setCoachers] = useState([]);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${config.apiUrl}/students/list_coachers`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setCoachers(data);
    } catch (err) {
      console.error("lỗi khi fetch list coach:", err);
      const errorMessage = "Failed to load coaches";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (email) => {
    const colors = [
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 blur-xl opacity-50 animate-pulse"></div>
            <div
              className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-border"
              style={{ borderTopColor: "transparent" }}
            ></div>
          </div>
          <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Loading coaches...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-6 rounded-3xl bg-red-50 dark:bg-red-900/20 backdrop-blur-lg mb-4">
            <svg
              className="w-20 h-20 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header với hiệu ứng gradient */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-3">
              Available Coaches
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
            Browse and connect with our {coachers.length} professional coaches
          </p>
        </div>

        {/* Coach Grid với animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {coachers.map((coach, index) => (
            <Link
              key={coach.user_id}
              to={`/coacher/${coach.user_id}`}
              className="block group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-white/20 dark:border-gray-700/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden">
                {/* Gradient overlay hiệu ứng */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500 rounded-3xl"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Avatar với ring gradient */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-500"></div>
                      {coach.avatar_url ? (
                        <img
                          src={coach.avatar_url}
                          alt="Coach Avatar"
                          className="relative w-28 h-28 rounded-full object-cover shadow-2xl ring-4 ring-white/50 dark:ring-gray-700/50 group-hover:ring-purple-500/50 group-hover:scale-110 transition-all duration-500"
                        />
                      ) : (
                        <div
                          className={`relative w-28 h-28 rounded-full ${getAvatarColor(
                            coach.email
                          )} flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white/50 dark:ring-gray-700/50 group-hover:ring-purple-500/50 group-hover:scale-110 transition-all duration-500`}
                        >
                          {getInitials(coach.email)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-purple-600 group-hover:to-blue-600 transition-all duration-500 truncate">
                      {coach.full_name || coach.email}
                    </h3>

                    {/* Email với icon */}
                    <div className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-600/50 group-hover:from-pink-100 group-hover:to-purple-100 dark:group-hover:from-gray-600/70 dark:group-hover:to-gray-500/70 transition-all duration-300">
                      <svg
                        className="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {coach.email}
                      </span>
                    </div>

                    {/* View Profile badge */}
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg">
                        View Profile →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State với gradient */}
        {coachers.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-8 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg shadow-xl mb-6">
              <svg
                className="w-32 h-32 mx-auto text-purple-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              No coaches available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Check back later for new coaches
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

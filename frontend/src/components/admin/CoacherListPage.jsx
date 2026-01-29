/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi.js";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import CoacherModal from "../../components/admin/CoacherModal.jsx";
import ProfileModal from "../../components/admin/ProfileModal.jsx";

const LIMIT_PER_PAGE = 5; // Giống như trang Student

export default function CoacherListPage() {
  const [coachers, setCoachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Modal
  const [editModalMode, setEditModalMode] = useState(null); // 'add' hoặc 'edit'
  const [viewModalUserId, setViewModalUserId] = useState(null); // ID của user để xem
  const [selectedCoacher, setSelectedCoacher] = useState(null);

  // State cho Filter
  const [filters, setFilters] = useState({
    full_name: "",
    start_date: "",
    end_date: "",
  });

  // State cho Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- HÀM TẢI DỮ LIỆU (Đã thêm logic phân trang) ---
  const fetchCoachers = async (page = 1) => {
    try {
      setLoading(true);
      const validFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v),
      );
      const skip = (page - 1) * LIMIT_PER_PAGE;
      const params = { ...validFilters, skip: skip, limit: LIMIT_PER_PAGE };

      // API trả về { data: [...], total_count: ... }
      const response = await adminApi.getCoachers(params);

      if (response && typeof response === "object" && response.data) {
        setCoachers(Array.isArray(response.data) ? response.data : []);
        const total = response.total_count || 0;
        setTotalPages(Math.ceil(total / LIMIT_PER_PAGE) || 1);
      } else {
        setCoachers([]);
        setTotalPages(1);
      }
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu lần đầu
  useEffect(() => {
    fetchCoachers(1);
  }, []); // Bỏ 'filters' ra khỏi dependencies

  // --- Xử lý sự kiện ---
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchCoachers(1); // Luôn về trang 1 khi lọc
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) fetchCoachers(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) fetchCoachers(currentPage - 1);
  };

  // Mở/Đóng Modals
  const openAddModal = () => {
    setSelectedCoacher(null);
    setEditModalMode("add");
  };

  const openEditModal = (coacher) => {
    // Lấy data TƯƠI NHẤT (bao gồm certificates) từ state 'coachers'
    const freshCoacherData = coachers.find(
      (s) => s.user_id === coacher.user_id,
    );
    setSelectedCoacher(freshCoacherData || coacher); // Dùng data mới nhất
    setEditModalMode("edit");
  };

  const openViewModal = (coacher) => {
    setViewModalUserId(coacher.user_id);
  };

  const closeModals = () => {
    setEditModalMode(null);
    setViewModalUserId(null);
    setSelectedCoacher(null);
  };

  // Xử lý CUD
  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa Coacher này?")) {
      try {
        await adminApi.deleteCoacher(userId);
        fetchCoachers(currentPage); // Tải lại trang hiện tại
      } catch (err) {
        alert("Lỗi khi xóa: " + err.message);
      }
    }
  };

  //
  // --- *** SỬA LỖI Ở ĐÂY *** ---
  //
  const handleSave = async (coacherData) => {
    try {
      if (editModalMode === "edit") {
        // 1. Chế độ Sửa: Lọc payload
        const updatePayload = {
          full_name: coacherData.full_name,
          dob: coacherData.dob || null,
          phone: coacherData.phone || null,
          job: coacherData.job || null,
          university: coacherData.university || null, // <-- THÊM DÒNG NÀY
          is_active: coacherData.is_active,
          avatar_base64: coacherData.avatar_base64 || null,
          student_number: coacherData.student_number,
        };
        await adminApi.updateCoacher(selectedCoacher.user_id, updatePayload);
      } else {
        // 2. Chế độ Thêm mới
        const createPayload = {
          email: coacherData.email,
          password: coacherData.password,
          full_name: coacherData.full_name || null,
          is_active: coacherData.is_active,
          student_number: coacherData.student_number,
        };
        await adminApi.createCoacher(createPayload);
      }

      closeModals();
      // 3. Tải lại data
      await fetchCoachers(editModalMode === "add" ? 1 : currentPage);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };
  //
  // --- *** KẾT THÚC SỬA LỖI *** ---
  //

  return (
    <div className="container mx-auto">
      {/* Header và Nút Add */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Coacher</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Coacher
        </button>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-end gap-4"
      >
        <div className="flex-1">
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700"
          >
            Tên
          </label>
          <input
            type="text"
            name="full_name"
            value={filters.full_name}
            onChange={handleFilterChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tìm theo tên..."
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700"
          >
            Từ ngày
          </label>
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="end_date"
            className="block text-sm font-medium text-gray-700"
          >
            Đến ngày
          </label>
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <Search className="w-5 h-5" />
          Lọc
        </button>
      </form>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <p className="p-4">Đang tải...</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-1/12">
                    ID
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-4/12">
                    Email / Tên
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-2/12">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-2/12">
                    Giới hạn HV (Quota)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-3/1KA">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coachers.map((coacher) => (
                  <tr key={coacher.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {coacher.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate">
                      <div className="font-medium truncate">
                        {coacher.full_name || "(Chưa có tên)"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {coacher.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coacher.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {coacher.student_number || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => openViewModal(coacher)}
                        className="text-blue-600 hover:text-blue-900 transition-transform hover:scale-125 cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(coacher)}
                        className="text-indigo-600 hover:text-indigo-900 transition-transform hover:scale-125 cursor-pointer"
                        title="Sửa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(coacher.user_id)}
                        className="text-red-600 hover:text-red-900 transition-transform hover:scale-125 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PHÂN TRANG */}
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-700">
                Trang <strong>{currentPage}</strong> /{" "}
                <strong>{totalPages}</strong>
              </span>
              <div className="inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Trước
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Sau
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Render Modals */}
      <AnimatePresence>
        {editModalMode && (
          <CoacherModal
            key="editModal"
            mode={editModalMode}
            coacher={selectedCoacher}
            onClose={closeModals}
            onSave={handleSave}
            onDataChange={() => fetchCoachers(currentPage)}
          />
        )}

        {viewModalUserId && (
          <ProfileModal
            key="viewModal"
            userId={viewModalUserId}
            onClose={closeModals}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

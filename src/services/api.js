const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    this.setToken(null);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
  async usersCount() {
    return this.request('/metrics/users/count');
  }
  async suspendedUsersCount() {
    return this.request('/metrics/users/suspended');
  }
  async teachersCount() {
    return this.request('/metrics/teachers/count');
  }
  async studentsCount() {
    return this.request('/metrics/students/count');
  }
  async coursesCount() {
    return this.request('/metrics/courses/count');
  }
  async classesCount() {
    return this.request('/metrics/classes/count');
  }
  async transactionsCount() {
    return this.request('/metrics/transactions/count');
  }
  async overviewMetrics() {
    return this.request('/metrics/overview');
  }

  // Courses
  async listCourses() {
    return this.request('/courses');
  }

  async createCourse(payload) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateCourse(id, payload) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteCourse(id) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Course assignments
  async listCourseTeachers(courseId) {
    return this.request(`/courses/${courseId}/teachers`)
  }
  async assignCourseTeachers(courseId, teacherIds) {
    return this.request(`/courses/${courseId}/assign`, { method: 'POST', body: JSON.stringify({ teacherIds }) })
  }
  async listAssignedCourses(teacherId) {
    return this.request(`/courses/assigned/${encodeURIComponent(teacherId)}`)
  }
  async listCourseClasses(courseId) {
    return this.request(`/courses/${courseId}/classes`)
  }
  async createCourseClass(courseId, payload) {
    return this.request(`/courses/${courseId}/classes`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async cancelCourseClass(courseId, classId) {
    return this.request(`/courses/${courseId}/classes/${classId}/cancel`, { method: 'POST' })
  }

  // Materials
  async listClassMaterials(classId) {
    return this.request(`/materials/class/${classId}`);
  }
  async addClassMaterial(classId, payload) {
    return this.request(`/materials/class/${classId}`, { method: 'POST', body: JSON.stringify(payload) });
  }
  async deleteClassMaterial(materialId) {
    return this.request(`/materials/${materialId}`, { method: 'DELETE' })
  }

  // Teacher applications
  async applyTeacher(payload) {
    return this.request('/teachers/apply', { method: 'POST', body: JSON.stringify(payload) })
  }
  async myTeacherApplication(userId) {
    return this.request(`/teachers/my?userId=${encodeURIComponent(userId)}`)
  }
  async myTeacherApplications(userId) {
    return this.request(`/teachers/my/list?userId=${encodeURIComponent(userId)}`)
  }
  async listTeacherApplications() {
    return this.request('/teachers/applications')
  }
  async approveTeacher(id) {
    return this.request(`/teachers/${id}/approve`, { method: 'POST' })
  }
  async rejectTeacher(id, comment) {
    return this.request(`/teachers/${id}/reject`, { method: 'POST', body: JSON.stringify({ comment }) })
  }
  async listApprovedTeachers() {
    return this.request('/teachers/approved')
  }

  // Users admin
  async listUsers() {
    return this.request('/users');
  }
  async updateUser(id, payload) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
  async suspendUser(id) {
    return this.request(`/users/${id}/suspend`, { method: 'POST' });
  }
  async activateUser(id) {
    return this.request(`/users/${id}/activate`, { method: 'POST' });
  }

  // Enrollments
  async myEnrollments(userId) {
    return this.request(`/enrollments/my?userId=${encodeURIComponent(userId)}`)
  }
  async createEnrollment(courseId, studentId) {
    return this.request('/enrollments', { method: 'POST', body: JSON.stringify({ courseId, studentId }) })
  }

  // Payments
  async createPayment(paymentData) {
    return this.request('/payments/create', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async checkPaymentStatus(reference) {
    return this.request(`/payments/status/${reference}`);
  }

  async getPaymentHistory() {
    return this.request('/payments/history');
  }

  // Transactions
  async submitTransactionId(payload) {
    return this.request('/transactions/submit-transaction', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPendingTransactions() {
    return this.request('/transactions/pending-transactions');
  }

  async approveTransaction(enrollmentId) {
    return this.request(`/transactions/approve-transaction/${enrollmentId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
  }

  async rejectTransaction(enrollmentId) {
    return this.request(`/transactions/approve-transaction/${enrollmentId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' }),
    });
  }
}

export default new ApiService();

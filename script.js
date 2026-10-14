const STORAGE_KEY = "sisStudentRecords";
const SESSION_KEY = "sisCurrentUser";

function getStudents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
}

function showMessage(id, message, success = false) {
  const box = document.getElementById(id);
  if (box) {
    box.textContent = message;
    box.style.color = success ? "#20844b" : "#c33d4b";
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Show or hide password fields using the button inside each password input.
document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
  button.addEventListener("click", function () {
    const passwordField = document.getElementById(button.dataset.togglePassword);
    if (passwordField) {
      const isHidden = passwordField.type === "password";
      passwordField.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Hide" : "Show";
      button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    }
  });
});

// Student login
const studentLoginForm = document.getElementById("studentLoginForm");
if (studentLoginForm) {
  studentLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const number = document.getElementById("studentNumber").value.trim();
    const password = document.getElementById("studentPassword").value;
    const student = getStudents().find(function (item) {
      return item.studentNo.toLowerCase() === number.toLowerCase()
        && item.password === password;
    });

    if (student) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        role: "student",
        studentNo: student.studentNo
      }));
      window.location.href = "student.html";
    } else {
      showMessage("studentLoginMessage", "Student number or password is incorrect.");
    }
  });
}

// Administrator login
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "Admin123!") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: "admin" }));
      window.location.href = "admin.html";
    } else {
      showMessage("adminLoginMessage", "Incorrect administrator username or password.");
    }
  });
}

// Log out buttons
const adminLogout = document.getElementById("adminLogout");
if (adminLogout) {
  adminLogout.addEventListener("click", function () {
    logout();
    window.location.href = "admin-login.html";
  });
}

const studentLogout = document.getElementById("studentLogout");
if (studentLogout) {
  studentLogout.addEventListener("click", function () {
    logout();
    window.location.href = "main.html";
  });
}

// Add student and show student records
const studentForm = document.getElementById("studentForm");
if (studentForm) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
  } else {
    studentForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const student = {
        studentNo: document.getElementById("studentNo").value.trim(),
        fullName: document.getElementById("fullName").value.trim(),
        course: document.getElementById("course").value,
        year: document.getElementById("year").value,
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        status: document.getElementById("status").value,
        password: document.getElementById("studentPassword").value
      };

      if (!student.studentNo || !student.fullName || !student.course ||
        !student.year || !student.status || !student.password) {
        showMessage("adminMessage", "Please fill in all required fields.");
        return;
      }

      if (student.password.length < 8) {
        showMessage("adminMessage", "Password must be at least 8 characters.");
        return;
      }

      const students = getStudents();
      const alreadyExists = students.some(function (item) {
        return item.studentNo.toLowerCase() === student.studentNo.toLowerCase();
      });

      if (alreadyExists) {
        showMessage("adminMessage", "That student number already exists.");
        return;
      }

      students.push(student);
      saveStudents(students);
      studentForm.reset();
      showMessage("adminMessage", "Student account added successfully.", true);
      showStudents();
    });

    function showStudents() {
      const students = getStudents();
      const table = document.getElementById("studentTable");
      const search = document.getElementById("searchStudent").value.toLowerCase();
      const courseFilter = document.getElementById("filterCourse").value;
      const yearFilter = document.getElementById("filterYear").value;

      document.getElementById("studentCount").textContent = students.length;
      document.getElementById("courseCount").textContent =
        new Set(students.map(function (item) { return item.course; })).size;
      document.getElementById("yearCount").textContent =
        new Set(students.map(function (item) { return item.year; })).size;

      const oldCourse = document.getElementById("filterCourse").value;
      const courseSelect = document.getElementById("filterCourse");
      const courses = [...new Set(students.map(function (item) { return item.course; }))].sort();
      courseSelect.innerHTML = '<option value="">All courses</option>';
      courses.forEach(function (course) {
        const option = document.createElement("option");
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
      });
      courseSelect.value = courses.includes(oldCourse) ? oldCourse : "";

      const filtered = students.filter(function (item) {
        return (String(item.fullName || "").toLowerCase().includes(search) ||
          String(item.studentNo || "").toLowerCase().includes(search)) &&
          (!courseFilter || item.course === courseFilter) &&
          (!yearFilter || item.year === yearFilter);
      });

      // Sort student numbers from lowest to highest, including numbers with dashes.
      filtered.sort(function (a, b) {
        return String(a.studentNo || "").localeCompare(
          String(b.studentNo || ""), undefined,
          { numeric: true, sensitivity: "base" }
        );
      });

      document.getElementById("visibleCount").textContent =
        filtered.length + (filtered.length === 1 ? " record" : " records");
      table.innerHTML = "";

      if (filtered.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="empty-cell">No student records found.</td></tr>';
        return;
      }

      filtered.forEach(function (item) {
        const row = document.createElement("tr");
        [item.studentNo, item.fullName, item.course, item.year].forEach(function (value) {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = "status-badge";
        if (item.status === "Irregular") status.classList.add("status-irregular");
        if (item.status === "On Leave") status.classList.add("status-on-leave");
        if (item.status === "Dropped") status.classList.add("status-dropped");
        status.textContent = item.status;
        statusCell.appendChild(status);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "action-edit";
        viewButton.textContent = "View Profile";
        viewButton.addEventListener("click", function (event) {
          event.stopPropagation();
          sessionStorage.setItem("sisSelectedStudent", item.studentNo);
          window.location.href = "student-profile.html";
        });
        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        row.addEventListener("click", function () {
          sessionStorage.setItem("sisSelectedStudent", item.studentNo);
          window.location.href = "student-profile.html";
        });
        table.appendChild(row);
      });
    }

    ["searchStudent", "filterCourse", "filterYear"].forEach(function (id) {
      const field = document.getElementById(id);
      field.addEventListener(id === "searchStudent" ? "input" : "change", showStudents);
    });

    document.getElementById("clearFilters").addEventListener("click", function () {
      document.getElementById("searchStudent").value = "";
      document.getElementById("filterCourse").value = "";
      document.getElementById("filterYear").value = "";
      showStudents();
    });

    showStudents();
  }
}

// Administrator student profile page
const profileForm = document.getElementById("profileForm");
if (profileForm) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
  } else {
    const selectedNumber = sessionStorage.getItem("sisSelectedStudent");
    let students = getStudents();
    let student = students.find(function (item) {
      return item.studentNo === selectedNumber;
    });

    if (!student) {
      window.location.href = "admin.html";
    } else {
      function fillProfile() {
        document.getElementById("profileName").textContent = student.fullName;
        document.getElementById("profileNumber").textContent = student.studentNo;
        document.getElementById("profileInitials").textContent =
          student.fullName.split(" ").map(function (word) { return word[0]; }).slice(0, 2).join("");
        document.getElementById("profileStatus").textContent = student.status;
        document.getElementById("profileStatus").className = "status-badge";
        if (student.status === "Dropped") document.getElementById("profileStatus").classList.add("status-dropped");
        if (student.status === "Irregular") document.getElementById("profileStatus").classList.add("status-irregular");
        if (student.status === "On Leave") document.getElementById("profileStatus").classList.add("status-on-leave");
        document.getElementById("profileStudentNo").value = student.studentNo;
        document.getElementById("profileFullName").value = student.fullName;
        document.getElementById("profileCourse").value = student.course;
        document.getElementById("profileYear").value = student.year;
        document.getElementById("profileEmail").value = student.email || "";
        document.getElementById("profilePhone").value = student.phone || "";
        document.getElementById("profileAddress").value = student.address || "";
        document.getElementById("profileAcademicStatus").value = student.status;
      }

      fillProfile();

      profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        students = getStudents();
        const index = students.findIndex(function (item) {
          return item.studentNo === selectedNumber;
        });
        if (index === -1) {
          showMessage("profileMessage", "Student record could not be found.");
          return;
        }

        students[index].fullName = document.getElementById("profileFullName").value.trim();
        students[index].course = document.getElementById("profileCourse").value;
        students[index].year = document.getElementById("profileYear").value;
        students[index].email = document.getElementById("profileEmail").value.trim();
        students[index].phone = document.getElementById("profilePhone").value.trim();
        students[index].address = document.getElementById("profileAddress").value.trim();
        students[index].status = document.getElementById("profileAcademicStatus").value;

        const newPassword = document.getElementById("profileNewPassword").value;
        if (newPassword && newPassword.length < 8) {
          showMessage("profileMessage", "New password must be at least 8 characters.");
          return;
        }
        if (newPassword) {
          students[index].password = newPassword;
        }

        saveStudents(students);
        document.getElementById("profileNewPassword").value = "";
        const passwordToggle = document.querySelector('[data-show-password="profileNewPassword"]');
        if (passwordToggle) {
          passwordToggle.checked = false;
          document.getElementById("profileNewPassword").type = "password";
        }
        student = students[index];
        fillProfile();
        showMessage("profileMessage", newPassword
          ? "Student information and password updated successfully."
          : "Student information saved successfully.", true);
      });

      document.getElementById("deleteProfile").addEventListener("click", function () {
        if (confirm("Are you sure you want to delete this student record?")) {
          saveStudents(getStudents().filter(function (item) {
            return item.studentNo !== selectedNumber;
          }));
          sessionStorage.removeItem("sisSelectedStudent");
          window.location.href = "admin.html";
        }
      });
    }
  }
}

// Student dashboard
const studentName = document.getElementById("viewName");
if (studentName) {
  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "main.html";
  } else {
    const student = getStudents().find(function (item) {
      return item.studentNo === session.studentNo;
    });

    if (!student) {
      logout();
      window.location.href = "main.html";
    } else {
      document.getElementById("viewNameHeading").textContent = student.fullName;
      document.getElementById("viewName").textContent = student.fullName;
      document.getElementById("viewNumber").textContent = student.studentNo;
      document.getElementById("viewCourse").textContent = student.course;
      document.getElementById("viewYear").textContent = student.year;
      document.getElementById("viewEmail").textContent = student.email || "Not provided";
      document.getElementById("viewPhone").textContent = student.phone || "Not provided";
      document.getElementById("viewAddress").textContent = student.address || "Not provided";
      document.getElementById("studentInitials").textContent =
        student.fullName.split(" ").map(function (word) { return word[0]; }).slice(0, 2).join("");

      const badge = document.getElementById("viewStatusBadge");
      badge.textContent = student.status;
      if (student.status === "Irregular") badge.classList.add("status-irregular");
      if (student.status === "On Leave") badge.classList.add("status-on-leave");
      if (student.status === "Dropped") badge.classList.add("status-dropped");
    }
  }
}

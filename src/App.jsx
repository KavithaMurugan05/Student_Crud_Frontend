import Login from "./Login";
import {useState, useEffect, useRef} from 'react'
import './App.css';
const API_URL = import.meta.env.VITE_API_URL;
function App(){
  const[isLoggedIn, setIsLoggedIn] = useState(false);
  const[authChecked, setAuthChecked] = useState(false);
  const[loggedInUser, setLoggedInUser] = useState("");
  const[sessionExpired, setSessionExpired] = useState(false);
  const[student,setStudent] = useState({
    name: '',
    dept: '',
    email: '',
    year: '',
    phone: '',
    dob: '',
    status: '',
    gender: ''
  });
  const[students,setStudents] = useState([]);

  const getStudents = async () => {
    try{
    const response = await fetch(`${API_URL}/students`,{
      method: "GET",
      credentials: "include",
    });
    if(handleAuthResponse(response)){
      return;
    }
    if(response.ok){
    const data = await response.json();
    setStudents(data);}
    else{
      setError("Server error. Please try again later");
    }}catch(error){
      setError("Unable to connect to server. Please check your connection");
    }
  };
  
  const[isEditing, setIsEditing] = useState(false);
  const[selectedStudent, setSelectedStudent] = useState(null);
  const[error, setError] = useState("");
  const[validationErrors, setValidationErrors] = useState({});
  const[searchTerm, setSearchTerm] = useState("");
  const[sortOption, setSortOption] = useState("name-asc");
  const[statusFilter, setStatusFilter] = useState("");
  const[success, setSuccess] = useState("");
  const[currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 7;
  const studentListRef = useRef(null);

  useEffect(() => {
    const checkLogin = async() => {
      try{
        const response = await fetch(`${API_URL}/me`,
          {
            credentials:"include"
          }
        );
        if(response.ok){
          const data = await response.json();
          setLoggedInUser(data.username);
          setIsLoggedIn(true);
        }
      }catch(error){
        console.error("Session check failed: ", error);
      }finally{
        setAuthChecked(true);
      }
    };
    checkLogin();
  },[]);
  useEffect(() => {
    if(isLoggedIn){
      getStudents();
    }
  },[isLoggedIn]);
  useEffect(()=>{
    if(success){
      const timer=setTimeout(()=>{
        setSuccess("");
      },3000);
      return() => clearTimeout(timer);
    }
  },[success]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption, statusFilter]);

  const handleLogin = (username) => {
    setSessionExpired(false);
    setLoggedInUser(username);
    setIsLoggedIn(true);
  };
  const handleLogout = async() => {
    try{
      await fetch(`${API_URL}/logout`,{
        method: "POST",
        credentials: "include",
      });
    }catch(error){
      console.error("Logout error: ", error);
    }
    setIsLoggedIn(false);
    setLoggedInUser("");
    setStudents([]);
  }

  const handleSessionExpired = () => {
    setSessionExpired(true);
    setIsLoggedIn(false);
    setLoggedInUser("");
    setStudents([]);
  };
  const handleAuthResponse = (response) => {
    if(response.status === 401 || response.status === 403){
      handleSessionExpired();
      return true;
    }
    return false;
  };

  const validateStudent=() => {
    const errors={};
    if(!student.name.trim()){
      errors.name="Student name is required";
    }
    else if(student.name.trim().length < 2){
      errors.name="Name must contain atleast 2 characters";
    }
    if(!student.dept.trim()){
      errors.dept="Department is required";
    }
    if(!student.email.trim()){
      errors.email="Email is required";
    }
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)){
      errors.email="Please enter a valid Email address";
    }
    if(!student.phone.trim()){
      errors.phone="Phone number is required";
    }
    else if(!/^[0-9]{10}$/.test(student.phone)){
      errors.phone="Phone number must contain exactly 10 digits";
    }
    if(!student.year){
      errors.year="Year is required";
    }
    else if(Number(student.year)<1 || Number(student.year)>5){
      errors.year="Year must be between 1&5";
    }
    if(!student.dob){
      errors.dob="Date of Birth is required";
    }
    if(!student.status){
      errors.status="Student status is required";
    }
    if(!student.gender){
      errors.gender="Gender is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange=(e)=>{
    const{name,value}=e.target;
    setStudent({
      ...student,
      [name]: value
    });
    setValidationErrors({
    ...validationErrors,
    [name]: ""
    });
  };

  const handleBackendError = async(response)=>{
    const contentType = response.headers.get("content-type");
    if(contentType && contentType.includes("application/json")){
      const errors = await response.json();
      const errorMessages = Object.values(errors).join(", ");
      setError(errorMessages);
    }else{
      const errorMessage = await response.text();
      setError(
        errorMessage || "Something went wrong. Please try again later"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if(!validateStudent()){
      return;
    }
    let response;
    if(isEditing){
      response = await fetch(
        `${API_URL}/students/${student.id}`,
        {
          method:"PUT",
          headers: {
            "Content-Type":"application/json"
          },
          credentials: "include",
          body: JSON.stringify(student)
        }
      );
    }
    else{
      response = await fetch(
        `${API_URL}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type":"application/json"
          },
          credentials: "include",
          body: JSON.stringify(student)
        }
      );
    }
    if(handleAuthResponse(response)){
      return;
    }
    if(!response.ok){
      await handleBackendError(response);
      return;
    }
    if(isEditing){
      setSuccess("Student updated successfully");
    }
    else{
      setSuccess("Student added successfully");
    }
    getStudents();
    
    setStudent({
      name:'',
      dept:'',
      email:'',
      year:'',
      phone: '',
      dob: '',
      status: '',
      gender: ''
    });
    setValidationErrors(({}));
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );
    if(!confirmDelete){
      return;
    }
    setError("");
    setSuccess("");
    const response=await fetch(`${API_URL}/students/${id}`,{
      method: "DELETE",
      credentials: "include",
    });
    if(handleAuthResponse(response)){
      return;
    }
    if(!response.ok){
      await handleBackendError(response);
      return;
    }
    setSuccess("Student deleted successfully");
    getStudents();
  };
  const handleViewProfile = (studentData) => {
    setSelectedStudent(studentData);
  };
  const handleEdit = (studentData) => {
    setStudent(studentData);
    setValidationErrors({});
    setError("");
    setIsEditing(true);
    window.scrollTo({
      top:0,
      behavior:"smooth"
    });
  };
  const handleCancel = () => {
    setStudent({
      name:'',
      dept:'',
      email:'',
      year:'',
      phone: '',
      dob: '',
      status: '',
      gender: ''
    });
    setValidationErrors({});
    setError("");
    setIsEditing(false);
  };
  const filteredStudents = students.filter((s) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (s.name||"").toLowerCase().includes(search) ||
      (s.email||"").toLowerCase().includes(search) ||
      (s.phone||"").includes(search);
    const matchesStatus =
      statusFilter === "" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const sortedStudents = [...filteredStudents].sort((a,b)=>{
    if(sortOption === "name-asc"){
      return a.name.localeCompare(b.name);
    }
    if(sortOption === "name-desc"){
      return b.name.localeCompare(a.name);
    }
    if(sortOption === "year-asc"){
      return a.year - b.year;
    }
    if(sortOption === "year-desc"){
      return b.year - a.year;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedStudents.length/studentsPerPage);
  const startIndex = (currentPage-1)*studentsPerPage;
  const currentStudents = sortedStudents.slice(
    startIndex, startIndex + studentsPerPage);

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.status === "Active"
  ).length;
  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive"
  ).length;
  const graduatedStudents = students.filter(
    (student) => student.status === "Graduated"
  ).length;
  useEffect(() => {
    if(totalPages > 0 && currentPage > totalPages){
      setCurrentPage(totalPages);
    }
    },[currentPage, totalPages]);
    
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setTimeout(()=>{
      studentListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    },0);
  };

  if(!authChecked){
    return null;
  }
  if(!isLoggedIn){
    return (
    <Login onLogin={handleLogin}
    sessionExpired={sessionExpired}/>);
  }
  return(
      <div className="app-container">
      <div className="content-container">
        <h1>Student Administration Portal</h1>
        <p className="subtitle">Manage student records with ease and efficiency</p>
        <div className="admin-header">
          <span>Welcome, {loggedInUser}</span>
          <button className="logout-button"
            onClick={handleLogout}>Logout</button>
        </div>
        <div className="dashboard">
          <div className="stat-card total-card"
            onClick={()=>handleStatusFilter("")}>
            <h3>Total Students</h3>
            <p>{totalStudents}</p>
          </div>
          <div className="stat-card active-card"
              onClick={()=>handleStatusFilter("Active")}>
            <h3>Active Students</h3>
            <p>{activeStudents}</p>
          </div>
          <div className="stat-card inactive-card"
            onClick={()=>handleStatusFilter("Inactive")}>
            <h3>Inactive Students</h3>
            <p>{inactiveStudents}</p>
          </div>
          <div className="stat-card graduated-card"
            onClick={()=>handleStatusFilter("Graduated")}>
            <h3>Graduated Students</h3>
            <p>{graduatedStudents}</p>
          </div>
        </div>
        <h2>STUDENT FORM</h2>
       <form onSubmit={handleSubmit} className="student-form">
        <div className="input-group">
         <input 
           type="text"
           name="name"
           minLength = "2"
           placeholder="Enter Student Name"
           value={student.name}
           className={validationErrors.name ? "input-error" : ""}
           onChange={handleChange}
         />
         {validationErrors.name && (
          <p className="validation-error">
            {validationErrors.name}
          </p>
         )}
        </div>
        <div className="input-group">
         <input 
           type="text"
           name="dept"
           placeholder="Enter Student Dept"
           value={student.dept}
           className={validationErrors.dept ? "input-error" : ""}
           onChange={handleChange}
         />
         {validationErrors.dept && (
          <p className="validation-error">
            {validationErrors.dept}
          </p>
         )}
        </div>
        <div className="input-group">
         <input 
           type="email"
           name="email"
           placeholder="Enter Student Email"
           value={student.email}
           className={validationErrors.email ? "input-error" : ""}
           onChange={handleChange}
         />
          {validationErrors.email && (
          <p className="validation-error">
            {validationErrors.email}
          </p>
          )}
        </div>
        <div className="input-group">
          <input type="text"
          name="phone"
          placeholder="Enter phone number"
          value={student.phone}
          className={validationErrors.phone ? "input-error" : ""}
          onChange={handleChange}
          />
          {validationErrors.phone && (
            <p className="validation-error">
              {validationErrors.phone}
            </p>
          )}
        </div>
        <div className="input-group">
          <input
            type="date"
            name="dob"
            value={student.dob}
            className={`${student.dob ? "" : "dob-placeholder"} ${validationErrors.dob ? "input-error" : ""}`}
            onChange={handleChange}
          />
          {validationErrors.dob && (
            <p className="validation-error">
              {validationErrors.dob}
            </p>
          )}
        </div>
        <div className="input-group">
         <input 
           type="number"
           name="year"
           placeholder="Enter Student Year"
           min="1" max="5"
           value={student.year}
           className={validationErrors.year ? "input-error" : ""}
           onChange={handleChange}
         />
          {validationErrors.year && (
            <p className="validation-error">
               {validationErrors.year}
            </p>
          )}
        </div>
        <div className="input-group">
          <select
            name="status"
            value={student.status}
            className={student.status ? "" : "status-placeholder"}
            onChange={handleChange}
          >
            <option value="">Select Student Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
          {validationErrors.status && (
            <p className="validation-error">
              {validationErrors.status}
            </p>
          )}
        </div>
        <div className="input-group">
          <select
            name="gender"
            value={student.gender}
            className={student.gender ? "" : "status-placeholder"}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Transgender">Transgender</option>
          </select>
          {validationErrors.gender && (
            <p className="validation-error">
              {validationErrors.gender}
            </p>
          )}
        </div>
        <div className="form-buttons">
         <button 
          type="submit"
          className="add-button">
          {isEditing ? "Update Student" : "Add Student"}
         </button>
         {isEditing && (
          <button 
          type="button" 
          className="cancel-button"
          onClick={handleCancel}>
            Cancel
          </button>
         )}
        </div>
      </form>
      {error && (
        <p className="backend-error">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message">
          {success}
        </p>
      )}
      <h2>STUDENTS LIST</h2>
      <div className="search-sort-container">
      <input type="text"
        className="search-input"
        placeholder="Search by name, email or phone..."
        value={searchTerm}
        onChange={(e)=>setSearchTerm(e.target.value)}
      />
      <select 
        className="sort-select"
        value={sortOption}
        onChange={(e)=>setSortOption(e.target.value)}>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>
      {statusFilter && (
        <p className="active-filter">
          Showing {statusFilter} Students
        </p>
      )}
      <div className="student-list" ref={studentListRef}>
      {
        currentStudents.length>0 ? (
        currentStudents.map((s) => (
          <div className="student-card"
          key={s.id}>
            <div className="student-info">
            <p><strong>Name: {s.name}</strong></p>
            <p><strong>Department: {s.dept}</strong></p>
            <p><strong>Year: {s.year}</strong></p>
            </div>
            <div className="student-buttons">
              <button className="view-button"
              onClick={() => handleViewProfile(s)}>
                View Profile
              </button>
              <button className="delete-button"
              onClick={() => handleDelete(s.id)}>
                Delete
              </button>
            </div>
            
          </div>
        ))
        ):(
          <p className="no-students">
            No students found
          </p>
      )}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}>Previous</button>
          {Array.from({length: totalPages}, (_, index) => (
            <button key={index+1}
              className={currentPage === index+1 ? "active-page" : ""}
              onClick={() => setCurrentPage(index+1)}>{index+1}</button>
          ))}
          <button onClick={()=>setCurrentPage(currentPage+1)}
              disabled={currentPage===totalPages}>Next</button>
        </div>)}
      {selectedStudent && (
  <div className="profile-overlay">
    <div className="profile-card">
      <h2>STUDENT PROFILE</h2>
      <div className="profile-info">
        <p><strong>Name:</strong> {selectedStudent.name}</p>
        <p><strong>Department:</strong> {selectedStudent.dept}</p>
        <p><strong>Email:</strong> {selectedStudent.email}</p>
        <p><strong>Phone:</strong> {selectedStudent.phone}</p>
        <p><strong>Date of Birth:</strong> {selectedStudent.dob}</p>
        <p><strong>Gender:</strong> {selectedStudent.gender}</p>
        <p><strong>Year:</strong> {selectedStudent.year}</p>
        <p><strong>Status:</strong> {selectedStudent.status}</p>
      </div>
      <div className="profile-buttons">
        <button
        className="edit-button"
        onClick={() => {handleEdit(selectedStudent);
          setSelectedStudent(null);
        }}>
          Edit
        </button>
        <button
          className="close-button"
          onClick={() => setSelectedStudent(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
export default App;
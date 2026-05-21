import { useState } from "react";
import { Search,FileText,Star,Upload,Download,x } from "lucide-react";
import { TopNavbar } from "../components/TopNavbar";
import { MobileTabBar } from "../components/MobileTabBar";

export function NotesMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);

const semesters = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];
const branches = ["All", "IT", "CS", "EXTC", "MECH"];
const subjects = ["All", "DSA", "DBMS", "CN", "OS", "TOC", "SE", "AI/ML"];

const notes = [
    { id: 1, subject: "Data Structures and Algorithms", uploader: "@rahul_m", semester: "3", branch: "IT", rating: 4.5, downloads: 234 },
    { id: 2, subject: "Database Management Systems", uploader: "@priya_s", semester: "4", branch: "CS", rating: 4.8, downloads: 189 },
    { id: 3, subject: "Computer Networks", uploader: "@arjun_k", semester: "5", branch: "IT", rating: 4.2, downloads: 156 },
    { id: 4, subject: "Machine Learning Complete Notes", uploader: "@sneha_p", semester: "7", branch: "IT", rating: 4.9, downloads: 89 },
    { id: 5, subject: "Theory of Computation", uploader: "@amit_v", semester: "5", branch: "CS", rating: 4.7, downloads: 67 },
  ];
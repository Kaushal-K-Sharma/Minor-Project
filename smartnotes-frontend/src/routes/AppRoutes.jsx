import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import ModeSelection from "../pages/ModeSelection";
import LectureUpload from "../pages/LectureUpload";
import StudyMode from "../pages/StudyMode";
import Processing from "../pages/Processing";
import GeneratedNotes from "../pages/GeneratedNotes";
import History from "../pages/History";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mode-selection" element={<ModeSelection />} />
      <Route path="/lecture-upload" element={<LectureUpload />} />
      <Route path="/study-mode" element={<StudyMode />} />
      <Route path="/processing" element={<Processing />} />
      <Route path="/notes" element={<GeneratedNotes />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

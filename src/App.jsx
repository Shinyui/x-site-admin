import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import UploadPage from "@/pages/UploadPage";
import FileManagerPage from "@/pages/FileManagerPage";
import AlbumBuilderPage from "@/pages/AlbumBuilderPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="files" element={<FileManagerPage />} />
        <Route path="album-builder" element={<AlbumBuilderPage />} />
      </Route>
    </Routes>
  );
}

export default App;

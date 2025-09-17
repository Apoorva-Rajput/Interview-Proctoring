import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Interviewer from "./components/Interviewer";
import Interviewee from "./components/Interviewee";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/Interviewer" element={<Interviewer />} />
        {/* <Route path="/Interviewee" element={<Interviewee />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;